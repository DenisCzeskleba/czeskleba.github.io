#!/usr/bin/env python3
import argparse
import json
import os
import re
from datetime import datetime


def slugify(value):
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = value.strip("_")
    return value or "unknown"


def parse_authors(authors_raw):
    if not authors_raw:
        return []
    return [a.strip() for a in authors_raw.split(",") if a.strip()]


def to_kelvin(value, unit):
    if value is None:
        return None
    if unit == "C":
        return value + 273.15
    return value


def deep_merge(base, override):
    if not isinstance(override, dict):
        return base
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = deep_merge(base.get(key, {}), value)
        else:
            base[key] = value
    return base


def build_source(payload):
    source = payload["source"]
    authors = parse_authors(source.get("authors", ""))
    source_id = slugify(f"{authors[0] if authors else 'unknown'}_{source.get('year', 'unknown')}_{source.get('title', '')}")
    source_json = {
        "schema_version": "1.0.0",
        "sources": [
            {
                "source_id": source_id,
                "clear_name": source.get("title", ""),
                "type": "journal_article",
                "title": source.get("title", ""),
                "authors": authors,
                "year": int(source.get("year")) if str(source.get("year", "")).isdigit() else source.get("year"),
                "journal": source.get("journal", ""),
                "doi": source.get("doi", ""),
                "url_open_access": source.get("oa_url", ""),
                "license_hint": "open_access",
                "notes": source.get("notes") or "",
                "ingest_status": "draft",
                "ingest_timestamp": datetime.now().isoformat(),
                "ingest_notes": "Draft created from contribution form.",
            }
        ],
    }
    return source_id, source_json


def build_entries(payload, source_id):
    defaults = payload.get("defaults", {})
    rows = payload.get("rows", [])
    temp_unit = defaults.get("temperature_unit", None)
    diffusivity_unit = defaults.get("diffusivity_unit", None)

    entries = []
    warnings = []

    for row in rows:
        group_slug = slugify(row.get("group_name", ""))
        series_slug = slugify(row.get("series_name", ""))
        model_type = row.get("model_type")
        tmin = row.get("temperature_validity", {}).get("min")
        tmax = row.get("temperature_validity", {}).get("max")
        row_temp_unit = row.get("temperature_unit") or temp_unit or "K"
        row_diff_unit = row.get("diffusivity_unit") or diffusivity_unit or "mm^2/s"

        group_id = f"{source_id}_{group_slug}"

        entry_id_seed = f"{group_id}_{series_slug}_{model_type}"
        if model_type == "single_point":
            entry_id_seed += f"_{row.get('model', {}).get('single_point', {}).get('temperature')}"
        else:
            entry_id_seed += f"_{tmin}_{tmax}"
        entry_id = slugify(entry_id_seed)

        merged_material = deep_merge(
            {
                "class": defaults.get("material", {}).get("class") or "not_reported",
                "grade": defaults.get("material", {}).get("grade") or "not_reported",
                "microstructure": defaults.get("material", {}).get("microstructure") or "not_reported",
                "phase": defaults.get("material", {}).get("phase") or "not_reported",
                "processing": defaults.get("material", {}).get("processing") or ["not_reported"],
                "tags": defaults.get("material", {}).get("tags") or ["not_reported"],
                "notes": defaults.get("material", {}).get("notes") or "not_reported",
                "chemical_composition": defaults.get("material", {}).get("chemical_composition") or {"notes": "not_reported"},
            },
            row.get("overrides", {}).get("material") if row.get("overrides") else {},
        )

        merged_conditions = deep_merge(
            {
                "measurement_method": defaults.get("conditions", {}).get("measurement_method") or "not_reported",
                "charging_method": defaults.get("conditions", {}).get("charging_method") or "not_reported",
                "notes": defaults.get("conditions", {}).get("notes") or "not_reported",
            },
            row.get("overrides", {}).get("conditions") if row.get("overrides") else {},
        )

        merged_metadata = deep_merge(
            {
                "studied_effects": defaults.get("metadata", {}).get("studied_effects") or ["not_reported"],
            },
            row.get("overrides", {}).get("metadata") if row.get("overrides") else {},
        )

        reported_as = row.get("reported_as") or defaults.get("reported_as") or "apparent"
        if row.get("overrides") and row.get("overrides", {}).get("reported_as"):
            reported_as = row["overrides"]["reported_as"]

        model = None
        if model_type == "single_point":
            temp = row.get("model", {}).get("single_point", {}).get("temperature")
            diff = row.get("model", {}).get("single_point", {}).get("diffusivity")
            model = {
                "type": "single_point",
                "temperature_K": to_kelvin(temp, row_temp_unit),
                "diffusivity_mm2_per_s": diff,
            }
        elif model_type == "arrhenius":
            model = {
                "type": "arrhenius",
                "D0_mm2_per_s": row.get("model", {}).get("arrhenius", {}).get("D0"),
                "Q_J_per_mol": row.get("model", {}).get("arrhenius", {}).get("Q"),
                "R_J_per_molK": row.get("model", {}).get("arrhenius", {}).get("R") or 8.314,
            }
        elif model_type == "power":
            model = {
                "type": "power",
                "input": row.get("model", {}).get("power", {}).get("input") or "theta_C",
                "A_mm2_per_s": row.get("model", {}).get("power", {}).get("A"),
                "n": row.get("model", {}).get("power", {}).get("n"),
            }
        else:
            warnings.append(f"Unknown model_type for row {row.get('series_name')}")

        entry = {
            "entry_id": entry_id,
            "source_id": source_id,
            "group_id": group_id,
            "variant_key": "Temperature",
            "variant_value": None,
            "variant_unit": "K",
            "series_key": "Series",
            "series_value": row.get("series_name"),
            "plotting": {"status": "plot"},
            "metadata": merged_metadata,
            "material": merged_material,
            "conditions": merged_conditions,
            "reported_as": reported_as,
            "model": model,
            "temperature_validity_K": [
                to_kelvin(tmin, row_temp_unit),
                to_kelvin(tmax, row_temp_unit),
            ],
            "extraction": {
                "method": "contribution_form",
                "tool": "web_form",
                "notes": "Draft created from contribution form.",
            },
            "confidence": "reported",
        }

        if model_type == "single_point":
            entry["variant_value"] = to_kelvin(row.get("model", {}).get("single_point", {}).get("temperature"), row_temp_unit)

        entries.append(entry)
        if diffusivity_unit and row_diff_unit != diffusivity_unit:
            warnings.append(f"Mixed diffusivity units detected: {diffusivity_unit} vs {row_diff_unit}.")
        diffusivity_unit = row_diff_unit

    return {
        "schema_version": "1.0.2",
        "diffusivity_unit": diffusivity_unit or "mm^2/s",
        "entries": entries,
    }, warnings


def main():
    parser = argparse.ArgumentParser(description="Convert HDD contribution JSON into draft sources/entries files.")
    parser.add_argument("input", help="Path to submission JSON file.")
    parser.add_argument("--out", required=True, help="Output root directory containing data/sources and data/entries.")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    source_id, source_json = build_source(payload)
    entries_json, warnings = build_entries(payload, source_id)

    sources_dir = os.path.join(args.out, "sources")
    entries_dir = os.path.join(args.out, "entries")
    os.makedirs(sources_dir, exist_ok=True)
    os.makedirs(entries_dir, exist_ok=True)

    sources_path = os.path.join(sources_dir, f"{source_id}.json")
    entries_path = os.path.join(entries_dir, f"{source_id}.json")

    with open(sources_path, "w", encoding="utf-8") as handle:
        json.dump(source_json, handle, indent=2, ensure_ascii=True)

    with open(entries_path, "w", encoding="utf-8") as handle:
        json.dump(entries_json, handle, indent=2, ensure_ascii=True)

    print(f"Wrote sources: {sources_path}")
    print(f"Wrote entries: {entries_path}")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")


if __name__ == "__main__":
    main()
