# Data Structure Change Plan (Notes to Self)

These are working notes that explain the refactor plan for the HDD data structure. The goal is to make the model
understandable and consistent, and to stop carrying legacy group/series/variant scaffolding that is confusing and
error-prone.

## Goal
- Replace the current nested group/series/entry structure with a simpler, line-first model.
- Make each plotted line/curve a first-class object.
- Remove the old `group_id`, `series_id`, `variant_key`, and `series_key` logic from the new format.
- Keep plotting and filtering intact by moving meaning into structured attributes, not into ad-hoc naming fields.

## Why this change
The current model repeats the same metadata at multiple levels and makes it hard to reason about what a "group",
"series", or "entry" actually means. This leads to confusion and makes the contribution workflow too complex.

We want a model that:
- Maps directly to plotting (one line = one object).
- Keeps all metadata attached to the line.
- Uses structured attributes (material, conditions, composition, etc.) for comparisons instead of free-text series labels.

## New mental model
- **Line (or Entry)** is the unit of plotting.
- Each line belongs to one source (paper).
- Each line contains either:
  - one or more model segments (arrhenius/power/single_point), or
  - a list of digitized points.
- All metadata (material, conditions, composition, etc.) lives on the line.

## What changes
### Remove
- `group_id` as a required plotting concept.
- `series_id`, `series_key`, `series_value`.
- `variant_key`, `variant_value`, `variant_unit`.

### Keep
- `entry_id` (or rename to `line_id`) for each line.
- `source_id` to tie back to the paper.
- `model.type` and model parameters.
- `temperature_validity` when needed.

### Add/standardize
- A single line label for the legend (human-readable).
- A `plotting` hint on the line when needed (e.g., scatterband shading).
- Structured attributes for all varying factors (composition, processing, surface, charging, etc.).

## Example target structure (conceptual)
Each source produces multiple line entries:

- entry_id (line_id)
- source_id
- label (legend)
- meta (material/conditions/etc.)
- segments[] (each segment has model type + parameters + validity)
  OR
- points[] (digitized data)

### Example 1: Arrhenius line (single segment)
```
{
  "entry_id": "asano_1974_coldwork_40pct",
  "source_id": "asano_1974_trapping_effect_of",
  "label": "40% cold reduction",
  "meta": {
    "material": {
      "class": "Low Alloy Steel",
      "grade": "X70"
    },
    "conditions": {
      "measurement_method": "Electrochemical permeation",
      "charging_method": "devanathan_stachursky_cell",
      "reported_as": "apparent"
    }
  },
  "segments": [
    {
      "type": "arrhenius",
      "D0_mm2_per_s": 24.0,
      "Q_J_per_mol": 33890.4,
      "temperature_validity_K": [293.15, 353.15]
    }
  ]
}
```

### Example 2: Piecewise Arrhenius (two segments, one line)
```
{
  "entry_id": "abe_2013_crmov_piecewise",
  "source_id": "abe_2013_influence_of_dehydrogenation_heat",
  "label": "CrMoV (piecewise)",
  "meta": { "material": { "class": "Creep Resistant Steel" } },
  "segments": [
    {
      "type": "arrhenius",
      "D0_mm2_per_s": 11.0,
      "Q_J_per_mol": 38874.0,
      "temperature_validity_K": [293.15, 573.15]
    },
    {
      "type": "arrhenius",
      "D0_mm2_per_s": 0.9,
      "Q_J_per_mol": 18900.0,
      "temperature_validity_K": [573.15, 873.15]
    }
  ]
}
```

### Example 3: Digitized curve (points)
```
{
  "entry_id": "boellinghaus_1995_scatterband_low_c",
  "source_id": "boellinghaus_1995_scatterband_microalloyed_low_carbon",
  "label": "Low C (scatter band)",
  "plotting": { "style": "band" },
  "meta": { "material": { "class": "Low Alloy Steel" } },
  "points": [
    { "temperature_K": 300.0, "diffusivity_mm2_per_s": 0.0031 },
    { "temperature_K": 325.0, "diffusivity_mm2_per_s": 0.0038 }
  ]
}
```

## Migration strategy (high level)
1. Rebuild exporter from `hydrogen-diffusion-database/data/entries`.
2. For each existing group/series/entry, emit a line entry:
   - Use series labels for the line label.
   - Merge all relevant metadata into the line meta.
3. Encode piecewise models as multiple segments in one line entry.
4. Encode digitized curves as points on the line entry.
5. Update Explorer to read line entries directly (no nested groups/series).

## Important
This is a deliberate break from the old model. Do not keep backwards compatibility.
Do not re-introduce group/series/variant naming in the new format.
All comparisons should be driven by structured metadata on each line.
arging_method
        - diffusion_coefficient_determination
        - trapping_considered


**Notes for the user, random thoughts just so i dont foget. AI should ignore everything that follows:**

Here I will work on a future structure change. We already have a decent database but we also have a lot info that we didnt know how it would fit into filters etc so we wrote everything i noted down while reading the papers in "notes" so we dont lose info.

we also have random tags/keys i created that hold information that originally wouldnt fit anywhere. The plan is to now make a sort of definitive list of tags by setting the contribution form. This will lead to new submissions having different tags then the old data entries.**

**To fix this data structure difference, i will have to go back to the original datasets (not the databank but the individual files) and enforce the new structure. Dont omit missing but instead have as "not_reported". 
1. Phase 1: We will go through the entries, enforce tags we WANT, remove tags we dont and dump the info into notes. 
2. Phase Two: Then we will go thru notes and see if the information there is already present in the tags we have after phase 1. if yes, remove THAT piece of informatin from notes. if not, which tag/key should hold this info? -> Add it there.
3. Phase three: are there still notes left? if yes, what and why? Decide if we want new tags | leave in notes | or drop information all together
4. Phase four: Is there any information from the original papers missing in this new structure? Go back to original notes from reading papers and see if you have that piece of info, if yes add, if no... well sh... mark this in some way so maybe someone can go back and read again? 

Worry about the Plotting tag 