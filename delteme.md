diff --git a/hdd/hdd-explorer.js b/hdd/hdd-explorer.js
index a6752e5..a191543 100644
--- a/hdd/hdd-explorer.js
+++ b/hdd/hdd-explorer.js
@@ -100,10 +100,10 @@
     );
 
     bindEvents();
-    state.monochrome = dom.monochrome-.checked -- false;
-    state.gridX = dom.gridX-.checked -- true;
-    state.gridY = dom.gridY-.checked -- true;
-    state.includeUnconfirmed = dom.includeUnconfirmed-.checked -- false;
+    state.monochrome = dom.monochrome?.checked ?? false;
+    state.gridX = dom.gridX?.checked ?? true;
+    state.gridY = dom.gridY?.checked ?? true;
+    state.includeUnconfirmed = dom.includeUnconfirmed?.checked ?? false;
     populateFilters(payload);
     applyFilters();
     selectAllVisible();
@@ -137,12 +137,12 @@
         source.clear_name || source.title || group.source_id || "Unknown source";
 
       (group.series || []).forEach((series, index) => {
-        const seriesKeyPart = series.series_id -- index;
+        const seriesKeyPart = series.series_id ?? index;
         const seriesId = `${group.group_id}::${seriesKeyPart}::${index}`;
         const segments = series.segments || [];
         const meta = collectSeriesMeta(segments);
         const materialLabel = deriveMaterialLabel(meta);
-        const seriesLabel = series.series_value - String(series.series_value) : "Series";
+        const seriesLabel = series.series_value ? String(series.series_value) : "Series";
 
         const entry = {
           id: seriesId,
@@ -235,7 +235,7 @@
     console.error("HDD dataset validation issues:", issues);
     if (dom.summary) {
       const list = issues.slice(0, 12).map((item) => `<li>${item}</li>`).join("");
-      const tail = issues.length > 12 - `<li>…and ${issues.length - 12} more.</li>` : "";
+      const tail = issues.length > 12 ? `<li>…and ${issues.length - 12} more.</li>` : "";
       dom.summary.innerHTML = `
         <strong>Data issues detected.</strong>
         <p>${message}</p>
@@ -273,7 +273,7 @@
 
       addIfPresent(meta.reported_as, segment.reported_as);
       deriveModelTypeLabels(segment).forEach((label) => addIfPresent(meta.model_type, label));
-      addIfPresent(meta.plotting_status, segment.plotting-.status);
+      addIfPresent(meta.plotting_status, segment.plotting?.status);
 
       const conditions = segment.conditions || {};
       addIfPresent(meta.measurement_method, conditions.measurement_method);
@@ -287,8 +287,8 @@
 
   function deriveModelTypeLabels(segment) {
     const labels = new Set();
-    const modelType = segment.model-.type;
-    const style = segment.plotting-.style;
+    const modelType = segment.model?.type;
+    const style = segment.plotting?.style;
     const isLineStyle = typeof style === "string" && style.toLowerCase() === "line";
     if (modelType === "arrhenius") {
       labels.add("Arrhenius");
@@ -317,50 +317,50 @@
   }
 
   function bindEvents() {
-    dom.search-.addEventListener("input", applyFilters);
-    dom.list-.addEventListener("change", handleSelectionChange);
-    dom.summary-.addEventListener("click", handleSummaryToggle);
-    dom.unitButtons-.forEach((btn) =>
+    dom.search?.addEventListener("input", applyFilters);
+    dom.list?.addEventListener("change", handleSelectionChange);
+    dom.summary?.addEventListener("click", handleSummaryToggle);
+    dom.unitButtons?.forEach((btn) =>
       btn.addEventListener("click", () => toggleUnits(btn))
     );
-    dom.scaleButtons-.forEach((btn) =>
+    dom.scaleButtons?.forEach((btn) =>
       btn.addEventListener("click", () => toggleScale(btn))
     );
-    dom.envelope-.addEventListener("change", () => {
+    dom.envelope?.addEventListener("change", () => {
       state.envelope = dom.envelope.checked;
       plotSelectedSeries();
     });
-    dom.numbering-.addEventListener("change", () => {
+    dom.numbering?.addEventListener("change", () => {
       state.numbering = dom.numbering.checked;
       plotSelectedSeries();
     });
-    dom.monochrome-.addEventListener("change", () => {
+    dom.monochrome?.addEventListener("change", () => {
       state.monochrome = dom.monochrome.checked;
       plotSelectedSeries();
     });
-    dom.gridX-.addEventListener("change", () => {
+    dom.gridX?.addEventListener("change", () => {
       state.gridX = dom.gridX.checked;
       plotSelectedSeries();
     });
-    dom.gridY-.addEventListener("change", () => {
+    dom.gridY?.addEventListener("change", () => {
       state.gridY = dom.gridY.checked;
       plotSelectedSeries();
     });
     [dom.tempMin, dom.tempMax].forEach((input) =>
-      input-.addEventListener("input", () => {
-        state.tempMin = parseNumber(dom.tempMin-.value);
-        state.tempMax = parseNumber(dom.tempMax-.value);
+      input?.addEventListener("input", () => {
+        state.tempMin = parseNumber(dom.tempMin?.value);
+        state.tempMax = parseNumber(dom.tempMax?.value);
         applyFilters();
       })
     );
-    dom.plotButton-.addEventListener("click", () => plotSelectedSeries(true));
-    dom.downloadButtons-.forEach((button) =>
+    dom.plotButton?.addEventListener("click", () => plotSelectedSeries(true));
+    dom.downloadButtons?.forEach((button) =>
       button.addEventListener("click", () => handleDownload(button))
     );
-    dom.clearFilters-.addEventListener("click", clearFilters);
-    dom.selectAll-.addEventListener("click", selectAllVisible);
-    dom.deselectAll-.addEventListener("click", deselectAllVisible);
-    dom.includeUnconfirmed-.addEventListener("change", () => {
+    dom.clearFilters?.addEventListener("click", clearFilters);
+    dom.selectAll?.addEventListener("click", selectAllVisible);
+    dom.deselectAll?.addEventListener("click", deselectAllVisible);
+    dom.includeUnconfirmed?.addEventListener("change", () => {
       state.includeUnconfirmed = dom.includeUnconfirmed.checked;
       applyFilters();
       plotSelectedSeries(true);
@@ -391,12 +391,12 @@
       .sort((a, b) => a.label.localeCompare(b.label));
 
     setSelectOptions(dom.filterSource, sourceOptions);
-    setSelectOptions(dom.filterClass, toOptions(payload.filters-.material_class));
-    setSelectOptions(dom.filterGrade, toOptions(payload.filters-.material_grade));
+    setSelectOptions(dom.filterClass, toOptions(payload.filters?.material_class));
+    setSelectOptions(dom.filterGrade, toOptions(payload.filters?.material_grade));
     setSelectOptions(dom.filterComposition, toOptions(collectMetaValues(state.seriesList, "chemical_composition")));
-    setSelectOptions(dom.filterReported, toOptions(payload.filters-.reported_as));
-    setSelectOptions(dom.filterEffect, toOptions(payload.filters-.studied_effects));
-    setSelectOptions(dom.filterMethod, toOptions(payload.filters-.measurement_method));
+    setSelectOptions(dom.filterReported, toOptions(payload.filters?.reported_as));
+    setSelectOptions(dom.filterEffect, toOptions(payload.filters?.studied_effects));
+    setSelectOptions(dom.filterMethod, toOptions(payload.filters?.measurement_method));
     setSelectOptions(dom.filterModel, toOptions(collectMetaValues(state.seriesList, "model_type")));
   }
 
@@ -425,7 +425,7 @@
   function collectMetaValues(seriesList, key) {
     const values = new Set();
     seriesList.forEach((entry) => {
-      const set = entry.meta-.[key];
+      const set = entry.meta?.[key];
       if (!set) return;
       set.forEach((value) => {
         if (value == null) return;
@@ -445,7 +445,7 @@
         const value = values[key];
         if (value == null || value === "") return null;
         const number = Number(value);
-        const display = Number.isFinite(number) - number.toPrecision(4) : String(value);
+        const display = Number.isFinite(number) ? number.toPrecision(4) : String(value);
         return `${key}=${display}`;
       })
       .filter(Boolean);
@@ -466,9 +466,9 @@
   }
 
   function applyFilters() {
-    const previousScrollTop = dom.panelLeft - dom.panelLeft.scrollTop : null;
+    const previousScrollTop = dom.panelLeft ? dom.panelLeft.scrollTop : null;
     const selectScroll = captureSelectScroll();
-    const query = dom.search-.value.trim().toLowerCase() || "";
+    const query = dom.search?.value.trim().toLowerCase() || "";
     const filters = {
       source: selectedValues(dom.filterSource),
       materialClass: selectedValues(dom.filterClass),
@@ -582,7 +582,7 @@
 
   function isPlottingAllowed(entry, includeUnconfirmed) {
     if (includeUnconfirmed) return true;
-    const statuses = entry.meta-.plotting_status;
+    const statuses = entry.meta?.plotting_status;
     if (!statuses || !statuses.size) return true;
     for (const status of statuses) {
       if (String(status).toLowerCase() !== "plot") return false;
@@ -625,41 +625,41 @@
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "materialClass")) return;
-      entry.meta.material_class-.forEach((value) => availability.materialClass.add(String(value)));
+      entry.meta.material_class?.forEach((value) => availability.materialClass.add(String(value)));
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "materialGrade")) return;
-      entry.meta.material_grade-.forEach((value) => availability.materialGrade.add(String(value)));
+      entry.meta.material_grade?.forEach((value) => availability.materialGrade.add(String(value)));
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "chemicalComposition")) return;
-      entry.meta.chemical_composition-.forEach((value) =>
+      entry.meta.chemical_composition?.forEach((value) =>
         availability.chemicalComposition.add(String(value))
       );
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "reportedAs")) return;
-      entry.meta.reported_as-.forEach((value) => availability.reportedAs.add(String(value)));
+      entry.meta.reported_as?.forEach((value) => availability.reportedAs.add(String(value)));
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "studiedEffects")) return;
-      entry.meta.studied_effects-.forEach((value) => availability.studiedEffects.add(String(value)));
+      entry.meta.studied_effects?.forEach((value) => availability.studiedEffects.add(String(value)));
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "measurementMethod")) return;
-      entry.meta.measurement_method-.forEach((value) =>
+      entry.meta.measurement_method?.forEach((value) =>
         availability.measurementMethod.add(String(value))
       );
     });
 
     state.seriesList.forEach((entry) => {
       if (!entryMatchesFilters(entry, filters, query, "modelType")) return;
-      entry.meta.model_type-.forEach((value) => availability.modelType.add(String(value)));
+      entry.meta.model_type?.forEach((value) => availability.modelType.add(String(value)));
     });
 
     updateSelectAvailability(dom.filterSource, availability.source);
@@ -683,7 +683,7 @@
         item.classList.remove("is-disabled", "is-hidden");
         return;
       }
-      const isAvailable = available.size - available.has(checkbox.value) : true;
+      const isAvailable = available.size ? available.has(checkbox.value) : true;
       checkbox.disabled = !isAvailable;
       item.classList.toggle("is-disabled", !isAvailable);
       item.classList.toggle("is-hidden", !isAvailable);
@@ -705,15 +705,15 @@
       option.setAttribute("for", inputId);
       option.innerHTML = `
         <input type="checkbox" id="${inputId}" value="${entry.id}" ${
-        state.selected.has(entry.id) - "checked" : ""
+        state.selected.has(entry.id) ? "checked" : ""
       } />
         <div>
           <strong>${entry.label}</strong>
           <div class="hdd-group-meta">
             ${entry.sourceTitle}
-            ${entry.seriesLabel - ` · ${entry.seriesLabel}` : ""}
+            ${entry.seriesLabel ? ` · ${entry.seriesLabel}` : ""}
             ${formatRange(entry.temperatureRange)}
-            ${entry.materialLabel - ` · ${entry.materialLabel}` : ""}
+            ${entry.materialLabel ? ` · ${entry.materialLabel}` : ""}
           </div>
         </div>
       `;
@@ -723,7 +723,7 @@
   }
 
   function selectAllVisible() {
-    const checkboxes = dom.list-.querySelectorAll("input[type='checkbox']");
+    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
     if (!checkboxes || !checkboxes.length) return;
     checkboxes.forEach((checkbox) => {
       checkbox.checked = true;
@@ -733,7 +733,7 @@
   }
 
   function deselectAllVisible() {
-    const checkboxes = dom.list-.querySelectorAll("input[type='checkbox']");
+    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
     if (checkboxes && checkboxes.length) {
       checkboxes.forEach((checkbox) => {
         checkbox.checked = false;
@@ -755,7 +755,7 @@
   }
 
   function handleSummaryToggle(event) {
-    const button = event.target-.closest-.(".hdd-summary-toggle");
+    const button = event.target?.closest?.(".hdd-summary-toggle");
     if (!button) return;
     event.preventDefault();
     state.summaryExpanded = !state.summaryExpanded;
@@ -773,7 +773,7 @@
     const allItems = Array.from(state.selected)
       .map((id) => state.seriesById.get(id))
       .filter(Boolean);
-    const plottedSeries = seriesList && seriesList.length - seriesList : currentSeries;
+    const plottedSeries = seriesList && seriesList.length ? seriesList : currentSeries;
     const seriesOrder = plottedSeries.length
       - plottedSeries.map((series, index) => ({ id: series.id, index }))
       : allItems.map((series, index) => ({ id: series.id, index }));
@@ -782,24 +782,24 @@
     const orderedItems = allItems
       .map((series, fallbackIndex) => ({
         series,
-        index: orderMap.has(series.id) - orderMap.get(series.id) : fallbackIndex,
+        index: orderMap.has(series.id) ? orderMap.get(series.id) : fallbackIndex,
         fallbackIndex,
       }))
       .sort((a, b) => a.index - b.index);
 
     const previewLimit = 6;
-    const maxPreview = state.summaryExpanded - orderedItems.length : previewLimit;
+    const maxPreview = state.summaryExpanded ? orderedItems.length : previewLimit;
     const previewItems = orderedItems.slice(0, maxPreview);
     const allItemLines = previewItems.map((item) => {
         const series = item.series;
         const range = formatRangeValue(series.temperatureRange) || "range unknown";
-        const ordinal = orderMap.has(series.id) - orderMap.get(series.id) + 1 : item.fallbackIndex + 1;
+        const ordinal = orderMap.has(series.id) ? orderMap.get(series.id) + 1 : item.fallbackIndex + 1;
         return `<li><span class="hdd-ordinal">${ordinal}.</span> <strong>${seriesDisplayLabel(series)}</strong> - ${series.seriesLabel} - ${range}</li>`;
       });
     const selectedCount = allItems.length;
     const plottedCount = plottedSeries.length;
     const needsToggle = selectedCount > previewLimit;
-    const toggleLabel = state.summaryExpanded - "Show less" : `Show all (${selectedCount})`;
+    const toggleLabel = state.summaryExpanded ? "Show less" : `Show all (${selectedCount})`;
     const toggleButton = needsToggle
       - `<button type="button" class="hdd-summary-toggle">${toggleLabel}</button>`
       : "";
@@ -819,7 +819,7 @@
   }
 
   function toggleScale(button) {
-    state.scale = button.dataset.scale === "linear" - "linear" : "log";
+    state.scale = button.dataset.scale === "linear" ? "linear" : "log";
     dom.scaleButtons.forEach((btn) =>
       btn.classList.toggle("is-active", btn === button)
     );
@@ -860,17 +860,17 @@
 
       const axisLine = samples.line.map((sample) => ({
         temperature_K: sample.temperature_K,
-        temperature_axis: state.units === "C" - sample.temperature_K - 273.15 : sample.temperature_K,
+        temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
         diffusivity: sample.diffusivity,
       }));
 
       const axisPoints = samples.points.map((sample) => ({
         temperature_K: sample.temperature_K,
-        temperature_axis: state.units === "C" - sample.temperature_K - 273.15 : sample.temperature_K,
+        temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
         diffusivity: sample.diffusivity,
       }));
 
-      const color = state.monochrome - "#111111" : COLORS[index % COLORS.length];
+      const color = state.monochrome ? "#111111" : COLORS[index % COLORS.length];
       result.push({
         id: entry.id,
         label: entry.label,
@@ -891,18 +891,18 @@
 
     entry.segments.forEach((segment, idx) => {
       const model = segment.model || {};
-      const plottingStyle = segment.plotting-.style-.toLowerCase-.() || "";
+      const plottingStyle = segment.plotting?.style?.toLowerCase?.() || "";
       if (model.type === "single_point") {
         const temperature = resolveSinglePointTemperature(segment);
         if (temperature == null) return;
         if (!isWithinClamp(temperature, clampMin, clampMax)) return;
-        const target = plottingStyle === "line" - line : points;
+        const target = plottingStyle === "line" ? line : points;
         target.push({ temperature_K: temperature, diffusivity: model.diffusivity_mm2_per_s });
         return;
       }
 
-      const segMin = clampTemperature(segment.temperature_validity_K-.[0], clampMin);
-      const segMax = clampTemperature(segment.temperature_validity_K-.[1], clampMax, true);
+      const segMin = clampTemperature(segment.temperature_validity_K?.[0], clampMin);
+      const segMax = clampTemperature(segment.temperature_validity_K?.[1], clampMax, true);
       if (!(segMax > segMin)) return;
       const steps = Math.max(2, SAMPLES_PER_SEGMENT);
       for (let i = 0; i < steps; i++) {
@@ -1028,7 +1028,7 @@
     ctx.fillStyle = theme.ink;
     ctx.font = "12px IBM Plex Sans, Arial, sans-serif";
     ctx.textAlign = "center";
-    const tempUnitLabel = state.units === "C" - "°C" : "°K";
+    const tempUnitLabel = state.units === "C" ? "°C" : "°K";
     ctx.fillText(
       `Temperature [${tempUnitLabel}]`,
       margin.left + plotWidth / 2,
@@ -1105,7 +1105,7 @@
       ctx.fillStyle = "rgba(15,118,110,0.18)";
       ctx.beginPath();
       overlap.temps.forEach((temperature, idx) => {
-        const x = xToPx(state.units === "C" - temperature - 273.15 : temperature);
+        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
         const y = yToPx(overlap.maxVals[idx]);
         if (idx === 0) {
           ctx.moveTo(x, y);
@@ -1115,7 +1115,7 @@
       });
       for (let i = overlap.temps.length - 1; i >= 0; i--) {
         const temperature = overlap.temps[i];
-        const x = xToPx(state.units === "C" - temperature - 273.15 : temperature);
+        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
         const y = yToPx(overlap.minVals[i]);
         ctx.lineTo(x, y);
       }
@@ -1129,12 +1129,12 @@
     const minVals = [];
     const maxVals = [];
     const start = Math.max(
-      minSeries.descriptor.temperatureRange-.[0] || -Infinity,
-      maxSeries.descriptor.temperatureRange-.[0] || -Infinity
+      minSeries.descriptor.temperatureRange?.[0] || -Infinity,
+      maxSeries.descriptor.temperatureRange?.[0] || -Infinity
     );
     const end = Math.min(
-      minSeries.descriptor.temperatureRange-.[1] || Infinity,
-      maxSeries.descriptor.temperatureRange-.[1] || Infinity
+      minSeries.descriptor.temperatureRange?.[1] || Infinity,
+      maxSeries.descriptor.temperatureRange?.[1] || Infinity
     );
     if (!(end > start)) return { temps, minVals, maxVals };
     const steps = 160;
@@ -1156,7 +1156,7 @@
     for (const segment of descriptor.segments) {
       const range = segment.temperature_validity_K || [];
       if (range.length === 2 && temperature >= range[0] && temperature <= range[1]) {
-        if (segment.model-.type === "single_point") return null;
+        if (segment.model?.type === "single_point") return null;
         return evaluateModel(segment.model, temperature);
       }
     }
@@ -1164,10 +1164,10 @@
   }
 
   function inferBand(descriptor) {
-    const band = descriptor.segments-.[0]-.metadata-.band;
+    const band = descriptor.segments?.[0]?.metadata?.band;
     if (band) return band;
     const match = descriptor.groupId.match(/_(mean|min|max)$/);
-    return match - match[1] : null;
+    return match ? match[1] : null;
   }
 
   function stripBand(groupId) {
@@ -1235,15 +1235,15 @@
         if (drawGrid) {
           ctx.save();
           ctx.strokeStyle = theme.line;
-          ctx.lineWidth = factor === 1 - 1.2 : 1;
-          ctx.globalAlpha = factor === 1 - 0.7 : 0.25;
+          ctx.lineWidth = factor === 1 ? 1.2 : 1;
+          ctx.globalAlpha = factor === 1 ? 0.7 : 0.25;
           ctx.beginPath();
           ctx.moveTo(margin.left, y);
           ctx.lineTo(margin.left + width, y);
           ctx.stroke();
           ctx.restore();
         }
-        const tickLen = factor === 1 - 6 : 3;
+        const tickLen = factor === 1 ? 6 : 3;
         ctx.beginPath();
         ctx.moveTo(margin.left - tickLen, y);
         ctx.lineTo(margin.left, y);
@@ -1363,7 +1363,7 @@
 
   function parseNumber(value) {
     const parsed = Number(value);
-    return Number.isFinite(parsed) - parsed : null;
+    return Number.isFinite(parsed) ? parsed : null;
   }
 
   function selectedValues(listbox) {
@@ -1414,7 +1414,7 @@
   }
 
   function seriesDisplayLabel(entry) {
-    return entry-.sourceTitle || entry-.label || entry-.groupId || "Series";
+    return entry?.sourceTitle || entry?.label || entry?.groupId || "Series";
   }
 
   function isFiniteNumber(value) {
@@ -1424,7 +1424,7 @@
   function clampTemperature(value, clamp, isMax = false) {
     if (!isFiniteNumber(value)) return null;
     if (clamp == null) return value;
-    return isMax - Math.min(value, clamp) : Math.max(value, clamp);
+    return isMax ? Math.min(value, clamp) : Math.max(value, clamp);
   }
 
   function isWithinClamp(value, min, max) {
