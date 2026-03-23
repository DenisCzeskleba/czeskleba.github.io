/* Hydrogen Diffusion Explorer (series-aware) */
(function () {
  const R_DEFAULT = 8.314462618;
  const SAMPLES_PER_SEGMENT = 70;
  const AXIS_DISTRIBUTION_SAMPLES = 30;
  const AXIS_SINGLE_POINT_EPSILON_K = 1e-6;
  const AXIS_BUCKET_JITTER_SPAN = 0.62;
  const FILTER_LIST_DEFAULT_HEIGHT = 280;
  const FILTER_LIST_MIN_HEIGHT = 75;
  const COLORS = [
    "#000000",
    "#426b9c",
    "#840084",
    "#c00000",
    "#008000",
    "#e69900",
    "#008080",
    "#595959",
  ];
  const AXIS_MODE_TEMPERATURE = "temperature";
  const AXIS_MODE_FILTER = "filter";
  const AXIS_TEMP_BEHAVIOR_DISTRIBUTION = "distribution";
  const AXIS_TEMP_BEHAVIOR_SLICE = "slice";
  const MARKER_STYLE_FILLED = "filled-circle";
  const MARKER_STYLE_HOLLOW = "hollow-circle";
  const MARKER_STYLE_X = "x";
  const MARKER_STYLE_TRIANGLE = "triangle";
  const MARKER_STYLES = new Set([
    MARKER_STYLE_FILLED,
    MARKER_STYLE_HOLLOW,
    MARKER_STYLE_X,
    MARKER_STYLE_TRIANGLE,
  ]);
  const AXIS_COLOR_SCALES = {
    "blue-red": {
      label: "Blue-Red",
      stops: [
        { t: 0, color: "#1e5eff" },
        { t: 1, color: "#d7191c" },
      ],
    },
    viridis: {
      label: "Viridis",
      stops: [
        { t: 0, color: "#440154" },
        { t: 0.25, color: "#3b528b" },
        { t: 0.5, color: "#21918c" },
        { t: 0.75, color: "#5ec962" },
        { t: 1, color: "#fde725" },
      ],
    },
    plasma: {
      label: "Plasma",
      stops: [
        { t: 0, color: "#0d0887" },
        { t: 0.25, color: "#7e03a8" },
        { t: 0.5, color: "#cc4778" },
        { t: 0.75, color: "#f89441" },
        { t: 1, color: "#f0f921" },
      ],
    },
    inferno: {
      label: "Inferno",
      stops: [
        { t: 0, color: "#2a0f54" },
        { t: 0.25, color: "#6a176e" },
        { t: 0.5, color: "#932667" },
        { t: 0.75, color: "#dd513a" },
        { t: 1, color: "#fff2a8" },
      ],
    },
    turbo: {
      label: "Turbo",
      stops: [
        { t: 0, color: "#30123b" },
        { t: 0.2, color: "#4666ff" },
        { t: 0.4, color: "#1ec8ff" },
        { t: 0.6, color: "#5cf06b" },
        { t: 0.8, color: "#f9c63a" },
        { t: 1, color: "#b10f0f" },
      ],
    },
    cividis: {
      label: "Cividis",
      stops: [
        { t: 0, color: "#00204c" },
        { t: 0.25, color: "#2d4f77" },
        { t: 0.5, color: "#576d73" },
        { t: 0.75, color: "#9a9b59" },
        { t: 1, color: "#fee838" },
      ],
    },
  };
  const AXIS_DISABLED_BLOCK_IDS = new Set([
    "hdd-filter-block-source",
    "hdd-filter-block-temp",
    "hdd-filter-block-literature",
  ]);
  const AXIS_CATEGORICAL_DEFS = {
    "hdd-filter-class": {
      axisKey: "material_class",
      label: "Material Class",
      filterKey: "materialClass",
      modeKey: "materialClass",
      metaKey: "material_class",
    },
    "hdd-filter-grade": {
      axisKey: "material_grade",
      label: "Material Grade",
      filterKey: "materialGrade",
      modeKey: "materialGrade",
      metaKey: "material_grade",
    },
    "hdd-filter-microstructure": {
      axisKey: "material_microstructure",
      label: "Microstructure",
      filterKey: "materialMicrostructure",
      modeKey: "materialMicrostructure",
      metaKey: "material_microstructure",
    },
    "hdd-filter-phase": {
      axisKey: "material_phase",
      label: "Phase",
      filterKey: "materialPhase",
      modeKey: "materialPhase",
      metaKey: "material_phase",
    },
    "hdd-filter-processing": {
      axisKey: "material_processing",
      label: "Processing",
      filterKey: "materialProcessing",
      modeKey: "materialProcessing",
      metaKey: "material_processing",
    },
    "hdd-filter-tags": {
      axisKey: "material_tags",
      label: "Material Tags",
      filterKey: "materialTags",
      modeKey: "materialTags",
      metaKey: "material_tags",
    },
    "hdd-filter-weld-process": {
      axisKey: "welded_process",
      label: "Welding Process",
      filterKey: "weldedProcess",
      modeKey: "weldedProcess",
      metaKey: "welded_process",
    },
    "hdd-filter-weld-layer": {
      axisKey: "welded_layer",
      label: "Welding Layer / Pass",
      filterKey: "weldedLayer",
      modeKey: "weldedLayer",
      metaKey: "welded_layer",
    },
    "hdd-filter-charging-method": {
      axisKey: "charging_method",
      label: "Charging Method",
      filterKey: "chargingMethod",
      modeKey: "chargingMethod",
      metaKey: "charging_method",
    },
    "hdd-filter-calculation-model": {
      axisKey: "calculation_model",
      label: "Calculation Model",
      filterKey: "calculationModel",
      modeKey: "calculationModel",
      metaKey: "calculation_model",
    },
    "hdd-filter-sample-geometry": {
      axisKey: "sample_geometry",
      label: "Sample Geometry",
      filterKey: "sampleGeometry",
      modeKey: "sampleGeometry",
      metaKey: "sample_geometry",
    },
    "hdd-filter-surface-condition": {
      axisKey: "surface_condition",
      label: "Surface Condition",
      filterKey: "surfaceCondition",
      modeKey: "surfaceCondition",
      metaKey: "surface_condition",
    },
    "hdd-filter-surface-finish-detail": {
      axisKey: "surface_finish_detail",
      label: "Surface Finish Detail",
      filterKey: "surfaceFinishDetail",
      modeKey: "surfaceFinishDetail",
      metaKey: "surface_finish_detail",
    },
    "hdd-filter-coated": {
      axisKey: "coated",
      label: "Coated",
      filterKey: "coated",
      modeKey: "coated",
      metaKey: "coated",
    },
    "hdd-filter-coating-type": {
      axisKey: "coating_type",
      label: "Coating Type",
      filterKey: "coatingType",
      modeKey: "coatingType",
      metaKey: "coating_type",
    },
    "hdd-filter-deformation-history": {
      axisKey: "deformation_history",
      label: "Deformation History",
      filterKey: "deformationHistory",
      modeKey: "deformationHistory",
      metaKey: "deformation_history",
    },
    "hdd-filter-mechanical-loading": {
      axisKey: "mechanical_loading_during_test",
      label: "Mechanical Loading During Test",
      filterKey: "mechanicalLoading",
      modeKey: "mechanicalLoading",
      metaKey: "mechanical_loading",
    },
    "hdd-filter-loading-regime": {
      axisKey: "loading_regime",
      label: "Loading Regime",
      filterKey: "loadingRegime",
      modeKey: "loadingRegime",
      metaKey: "loading_regime",
    },
    "hdd-filter-electrolyte": {
      axisKey: "electrolyte",
      label: "Electrolyte",
      filterKey: "electrolyte",
      modeKey: "electrolyte",
      metaKey: "electrolyte",
    },
    "hdd-filter-control-mode": {
      axisKey: "control_mode",
      label: "Control Mode",
      filterKey: "controlMode",
      modeKey: "controlMode",
      metaKey: "control_mode",
    },
    "hdd-filter-poison-additive": {
      axisKey: "poison_additive",
      label: "Poison Additive",
      filterKey: "poisonAdditive",
      modeKey: "poisonAdditive",
      metaKey: "poison_additive",
    },
    "hdd-filter-gas-composition": {
      axisKey: "gas_composition",
      label: "Gas Composition",
      filterKey: "gasComposition",
      modeKey: "gasComposition",
      metaKey: "gas_composition",
    },
    "hdd-filter-gas-purity": {
      axisKey: "gas_purity",
      label: "Gas Purity",
      filterKey: "gasPurity",
      modeKey: "gasPurity",
      metaKey: "gas_purity",
    },
    "hdd-filter-tda-peak": {
      axisKey: "tda_peak_analysis",
      label: "TDA Peak Analysis",
      filterKey: "tdaPeakAnalysis",
      modeKey: "tdaPeakAnalysis",
      metaKey: "tda_peak_analysis",
    },
    "hdd-filter-sims-type": {
      axisKey: "sims_type",
      label: "SIMS Type",
      filterKey: "simsType",
      modeKey: "simsType",
      metaKey: "sims_type",
    },
    "hdd-filter-dev-entry-electrolyte": {
      axisKey: "devanathan_entry_electrolyte",
      label: "Devanathan Entry Electrolyte",
      filterKey: "devEntryElectrolyte",
      modeKey: "devEntryElectrolyte",
      metaKey: "dev_entry_electrolyte",
    },
    "hdd-filter-dev-exit-electrolyte": {
      axisKey: "devanathan_exit_electrolyte",
      label: "Devanathan Exit Electrolyte",
      filterKey: "devExitElectrolyte",
      modeKey: "devExitElectrolyte",
      metaKey: "dev_exit_electrolyte",
    },
    "hdd-filter-reported": {
      axisKey: "reported_as",
      label: "Reported As",
      filterKey: "reportedAs",
      modeKey: "reportedAs",
      metaKey: "reported_as",
    },
    "hdd-filter-effect": {
      axisKey: "studied_effects",
      label: "Studied Effect",
      filterKey: "studiedEffects",
      modeKey: "studiedEffects",
      metaKey: "studied_effects",
    },
    "hdd-filter-method": {
      axisKey: "measurement_method",
      label: "Measurement Method",
      filterKey: "measurementMethod",
      modeKey: "measurementMethod",
      metaKey: "measurement_method",
    },
    "hdd-filter-model": {
      axisKey: "model_type",
      label: "Model Type",
      filterKey: "modelType",
      modeKey: "modelType",
      metaKey: "model_type",
    },
  };
  const AXIS_NUMERIC_LABELS = {
    year: "Year",
    welding_t85: "Welding t8/5",
    charging_temperature_c: "Charging Temperature [C]",
    charging_duration_h: "Charging Duration [h]",
    characteristic_length_mm: "Characteristic Length [mm]",
    coating_thickness_um: "Coating Thickness [um]",
    pre_strain_percent: "Pre-strain [%]",
    cold_reduction_percent: "Cold Reduction [%]",
    applied_stress_mpa: "Applied Stress [MPa]",
    applied_strain_percent: "Applied Strain [%]",
    current_density_mA_per_cm2: "Current Density [mA/cm2]",
    applied_potential_v: "Applied Potential [V]",
    gas_pressure_bar: "Gas Pressure [bar]",
    heating_rate_k_per_min: "Heating Rate [K/min]",
    extraction_temperature_c: "Extraction Temperature [C]",
  };
  const SETTINGS_HASH_KEY = "hdd-settings-v1";
  const LEGACY_DB_MAX_BYTES = 15 * 1024 * 1024;
  const DEFAULT_ZENODO_DOI = "10.5281/zenodo.19127023";
  const FILTER_SELECTION_BINDINGS = [
    { key: "source", domKey: "filterSource", label: "Source" },
    { key: "materialClass", domKey: "filterClass", label: "Material Class" },
    { key: "materialGrade", domKey: "filterGrade", label: "Material Grade" },
    { key: "materialMicrostructure", domKey: "filterMicrostructure", label: "Microstructure" },
    { key: "materialPhase", domKey: "filterPhase", label: "Phase" },
    { key: "materialProcessing", domKey: "filterProcessing", label: "Processing" },
    { key: "materialTags", domKey: "filterTags", label: "Material Tags" },
    { key: "weldedProcess", domKey: "filterWeldProcess", label: "Welding Process" },
    { key: "weldedLayer", domKey: "filterWeldLayer", label: "Welding Layer / Pass" },
    { key: "chargingMethod", domKey: "filterChargingMethod", label: "Charging Method" },
    { key: "calculationModel", domKey: "filterCalculationModel", label: "Calculation Model" },
    { key: "sampleGeometry", domKey: "filterSampleGeometry", label: "Sample Geometry" },
    { key: "surfaceCondition", domKey: "filterSurfaceCondition", label: "Surface Condition" },
    { key: "surfaceFinishDetail", domKey: "filterSurfaceFinishDetail", label: "Surface Finish Detail" },
    { key: "coated", domKey: "filterCoated", label: "Coated" },
    { key: "coatingType", domKey: "filterCoatingType", label: "Coating Type" },
    { key: "deformationHistory", domKey: "filterDeformationHistory", label: "Deformation History" },
    { key: "mechanicalLoading", domKey: "filterMechanicalLoading", label: "Mechanical Loading During Test" },
    { key: "loadingRegime", domKey: "filterLoadingRegime", label: "Loading Regime" },
    { key: "electrolyte", domKey: "filterElectrolyte", label: "Electrolyte" },
    { key: "controlMode", domKey: "filterControlMode", label: "Control Mode" },
    { key: "poisonAdditive", domKey: "filterPoisonAdditive", label: "Poison Additive" },
    { key: "gasComposition", domKey: "filterGasComposition", label: "Gas Composition" },
    { key: "gasPurity", domKey: "filterGasPurity", label: "Gas Purity" },
    { key: "tdaPeakAnalysis", domKey: "filterTdaPeak", label: "TDA Peak Analysis" },
    { key: "simsType", domKey: "filterSimsType", label: "SIMS Type" },
    { key: "devEntryElectrolyte", domKey: "filterDevEntryElectrolyte", label: "Devanathan Entry Electrolyte" },
    { key: "devExitElectrolyte", domKey: "filterDevExitElectrolyte", label: "Devanathan Exit Electrolyte" },
    { key: "reportedAs", domKey: "filterReported", label: "Reported As" },
    { key: "studiedEffects", domKey: "filterEffect", label: "Studied Effect" },
    { key: "measurementMethod", domKey: "filterMethod", label: "Measurement Method" },
    { key: "modelType", domKey: "filterModel", label: "Model Type" },
  ];
  const FILTER_MODE_LABELS = {
    source: "Source mode",
    materialClass: "Material Class mode",
    materialGrade: "Material Grade mode",
    materialMicrostructure: "Microstructure mode",
    materialPhase: "Phase mode",
    materialProcessing: "Processing mode",
    materialTags: "Material Tags mode",
    weldedProcess: "Welding Process mode",
    weldedLayer: "Welding Layer / Pass mode",
    chargingMethod: "Charging Method mode",
    calculationModel: "Calculation Model mode",
    sampleGeometry: "Sample Geometry mode",
    surfaceCondition: "Surface Condition mode",
    surfaceFinishDetail: "Surface Finish Detail mode",
    coated: "Coated mode",
    coatingType: "Coating Type mode",
    deformationHistory: "Deformation History mode",
    mechanicalLoading: "Mechanical Loading mode",
    loadingRegime: "Loading Regime mode",
    electrolyte: "Electrolyte mode",
    controlMode: "Control Mode mode",
    poisonAdditive: "Poison Additive mode",
    gasComposition: "Gas Composition mode",
    gasPurity: "Gas Purity mode",
    tdaPeakAnalysis: "TDA Peak Analysis mode",
    simsType: "SIMS Type mode",
    devEntryElectrolyte: "Devanathan Entry Electrolyte mode",
    devExitElectrolyte: "Devanathan Exit Electrolyte mode",
    reportedAs: "Reported As mode",
    studiedEffects: "Studied Effect mode",
    measurementMethod: "Measurement Method mode",
    modelType: "Model Type mode",
  };

  const mount = document.getElementById("hydrogen-explorer-app");
  if (!mount) return;

  const endpoint = mount.getAttribute("data-endpoint") || "/hdd/public_hdd_database.json";

  const dom = {
    shell: mount.querySelector(".hdd-explorer-shell"),
    status: document.getElementById("hdd-data-status"),
    legacyDbButton: document.getElementById("hdd-legacy-db-button"),
    legacyDbFile: document.getElementById("hdd-legacy-db-file"),
    search: document.getElementById("hdd-search"),
    list: document.getElementById("hdd-series-list"),
    advancedToggle: document.getElementById("hdd-advanced-toggle"),
    openSeries: document.getElementById("hdd-open-series"),
    seriesDrawer: document.getElementById("hdd-series-drawer"),
    chart: document.getElementById("hdd-chart"),
      summary: document.getElementById("hdd-selected-summary"),
      summaryModal: document.getElementById("hdd-summary-modal"),
      summaryCloseButtons: document.querySelectorAll("[data-action='close-summary']"),
      panelLeft: mount.querySelector(".hdd-panel-left"),
    refreshPlot: document.getElementById("hdd-refresh-plot"),
    citationPanel: document.getElementById("hdd-citation"),
    citationLinks: document.querySelectorAll("[data-action='open-citation']"),
    citationAnalysis: document.getElementById("hdd-citation-analysis"),
    citationDatabase: document.getElementById("hdd-citation-database"),
    citationBibtex: document.getElementById("hdd-citation-bibtex"),
    citationRis: document.getElementById("hdd-citation-ris"),
    citationPlain: document.getElementById("hdd-citation-plain"),
    unitButtons: document.querySelectorAll("[data-unit]"),
    scaleButtons: document.querySelectorAll("[data-scale]"),
    envelope: document.getElementById("hdd-envelope"),
    forceScatterband: document.getElementById("hdd-force-scatterband"),
    numbering: document.getElementById("hdd-numbering"),
    legendGroup: document.getElementById("hdd-legend-group"),
    monochrome: document.getElementById("hdd-monochrome"),
    lineThickness: document.getElementById("hdd-line-thickness"),
    lineThicknessValue: document.getElementById("hdd-line-thickness-value"),
    markerStyleButtons: document.querySelectorAll("[data-marker-style]"),
    importSettings: document.getElementById("hdd-import-settings"),
    gridX: document.getElementById("hdd-grid-x"),
    gridY: document.getElementById("hdd-grid-y"),
    axisXMin: document.getElementById("hdd-axis-x-min"),
    axisXMax: document.getElementById("hdd-axis-x-max"),
    axisXGroup: document.getElementById("hdd-axis-x-group"),
    axisYMin: document.getElementById("hdd-axis-y-min"),
    axisYMax: document.getElementById("hdd-axis-y-max"),
    axisModePanel: mount.querySelector(".hdd-axis-mode-panel"),
    axisModeStatus: document.getElementById("hdd-axis-mode-status"),
    axisReset: document.getElementById("hdd-axis-reset"),
    axisTempBehaviorButtons: document.querySelectorAll("[data-axis-temp-behavior]"),
    axisSliceGroup: document.getElementById("hdd-axis-slice-group"),
    axisSliceTitle: document.getElementById("hdd-axis-slice-title"),
    axisSliceTemp: document.getElementById("hdd-axis-slice-temp"),
    axisTempLegend: document.getElementById("hdd-axis-temp-legend"),
    axisTempLegendTitle: document.getElementById("hdd-axis-temp-legend-title"),
    axisTempLegendBar: document.getElementById("hdd-axis-temp-legend-bar"),
    axisTempLegendMin: document.getElementById("hdd-axis-temp-legend-min"),
    axisTempLegendMax: document.getElementById("hdd-axis-temp-legend-max"),
    axisTempPalette: document.getElementById("hdd-axis-temp-palette"),
    axisTempPaletteButtons: document.querySelectorAll("[data-axis-palette]"),
    envelopeRow: document.getElementById("hdd-envelope-row"),
    forceScatterbandRow: document.getElementById("hdd-force-scatterband-row"),
    tempMin: document.getElementById("hdd-temp-min"),
    tempMax: document.getElementById("hdd-temp-max"),
    tempRange: document.querySelector("[data-range='temp']"),
    tempRangeFill: document.getElementById("hdd-temp-range-fill"),
    tempHandleMin: document.getElementById("hdd-temp-handle-min"),
    tempHandleMax: document.getElementById("hdd-temp-handle-max"),
    yearMin: document.getElementById("hdd-year-min"),
    yearMax: document.getElementById("hdd-year-max"),
    yearRange: document.querySelector("[data-range='year']"),
    yearRangeFill: document.getElementById("hdd-year-range-fill"),
    yearHandleMin: document.getElementById("hdd-year-handle-min"),
    yearHandleMax: document.getElementById("hdd-year-handle-max"),
    downloadButtons: document.querySelectorAll("[data-download]"),
    clearFilters: document.getElementById("hdd-clear-filters"),
    selectAll: document.getElementById("hdd-select-all"),
    deselectAll: document.getElementById("hdd-deselect-all"),
    showAll: document.getElementById("hdd-show-all"),
    advancedFilters: document.getElementById("hdd-advanced-filters"),
    weldedMode: document.getElementById("hdd-welded-mode"),
    filterSource: document.getElementById("hdd-filter-source"),
    filterClass: document.getElementById("hdd-filter-class"),
    filterGrade: document.getElementById("hdd-filter-grade"),
    filterMicrostructure: document.getElementById("hdd-filter-microstructure"),
    filterPhase: document.getElementById("hdd-filter-phase"),
    filterProcessing: document.getElementById("hdd-filter-processing"),
    filterTags: document.getElementById("hdd-filter-tags"),
    filterWeldProcess: document.getElementById("hdd-filter-weld-process"),
    filterWeldLayer: document.getElementById("hdd-filter-weld-layer"),
    filterComposition: document.getElementById("hdd-filter-composition"),
    filterChargingMethod: document.getElementById("hdd-filter-charging-method"),
    filterCalculationModel: document.getElementById("hdd-filter-calculation-model"),
    filterSampleGeometry: document.getElementById("hdd-filter-sample-geometry"),
    filterSurfaceCondition: document.getElementById("hdd-filter-surface-condition"),
    filterSurfaceFinishDetail: document.getElementById("hdd-filter-surface-finish-detail"),
    filterCoated: document.getElementById("hdd-filter-coated"),
    filterCoatingType: document.getElementById("hdd-filter-coating-type"),
    filterDeformationHistory: document.getElementById("hdd-filter-deformation-history"),
    filterMechanicalLoading: document.getElementById("hdd-filter-mechanical-loading"),
    filterLoadingRegime: document.getElementById("hdd-filter-loading-regime"),
    filterElectrolyte: document.getElementById("hdd-filter-electrolyte"),
    filterControlMode: document.getElementById("hdd-filter-control-mode"),
    filterPoisonAdditive: document.getElementById("hdd-filter-poison-additive"),
    filterGasComposition: document.getElementById("hdd-filter-gas-composition"),
    filterGasPurity: document.getElementById("hdd-filter-gas-purity"),
    filterTdaPeak: document.getElementById("hdd-filter-tda-peak"),
    filterSimsType: document.getElementById("hdd-filter-sims-type"),
    filterDevEntryElectrolyte: document.getElementById("hdd-filter-dev-entry-electrolyte"),
    filterDevExitElectrolyte: document.getElementById("hdd-filter-dev-exit-electrolyte"),
    filterReported: document.getElementById("hdd-filter-reported"),
    filterEffect: document.getElementById("hdd-filter-effect"),
    filterMethod: document.getElementById("hdd-filter-method"),
    filterModel: document.getElementById("hdd-filter-model"),
    coreFilters: document.getElementById("hdd-core-filters"),
    coreFiltersBody: document.getElementById("hdd-core-filters-body"),
    bucketMaterial: document.getElementById("hdd-bucket-material"),
    bucketConditions: document.getElementById("hdd-bucket-conditions"),
    bucketMethod: document.getElementById("hdd-bucket-method"),
    bucketAnalysis: document.getElementById("hdd-bucket-analysis"),
    filterBlockClass: document.getElementById("hdd-filter-block-class"),
    filterBlockGrade: document.getElementById("hdd-filter-block-grade"),
    filterBlockMethod: document.getElementById("hdd-filter-block-method"),
    filterBlockTemp: document.getElementById("hdd-filter-block-temp"),
    filterBlockLiterature: document.getElementById("hdd-filter-block-literature"),
    filterBlockYear: document.getElementById("hdd-filter-block-year"),
    filterBlockSource: document.getElementById("hdd-filter-block-source"),
    includeUnconfirmed: document.getElementById("hdd-include-unconfirmed"),
    literatureMode: document.getElementById("hdd-literature-mode"),
    filterModeToggles: document.querySelectorAll("[data-filter-mode]"),
    filterMicrostructureMode: document.querySelector("[data-filter-mode='materialMicrostructure']"),
    filterUnknownComposition: document.querySelector("[data-filter-unknown='chemicalComposition']"),
    numericRangeInputs: mount.querySelectorAll("[data-range-key]"),
    resetZoom: document.getElementById("hdd-reset-zoom"),
    plotOptionPanels: mount.querySelectorAll(".hdd-plot-options"),
    heroLogo: document.querySelector(".hdd-hero-logo"),
    heroLightbox: document.getElementById("hdd-hero-lightbox"),
    heroCloseButtons: document.querySelectorAll("[data-action='close-hero']"),
    coreSection: document.getElementById("hdd-core-filters"),
    sectionHeaders: document.querySelectorAll(".hdd-filter-section-header"),
    sections: document.querySelectorAll(".hdd-filter-section"),
    summaryModalTitle: document.getElementById("hdd-summary-modal-title"),
  };

  const state = {
    dataset: null,
    seriesList: [],
    seriesById: new Map(),
    seriesByEntryId: new Map(),
    selected: new Set(),
    units: "C",
    scale: "log",
    envelope: true,
    numbering: true,
    legendBySource: true,
    monochrome: false,
    lineThickness: 1,
    markerStyle: MARKER_STYLE_FILLED,
    gridX: true,
    gridY: true,
    forceScatterband: false,
    preserveAxis: false,
    tempMin: null,
    tempMax: null,
    tempDomain: null,
    yearMin: null,
    yearMax: null,
    yearDomain: null,
    includeUnconfirmed: false,
    literatureMode: "include",
    weldedMode: "include",
    includeUnknownComposition: false,
    compositionFilters: {},
    numericFilters: {},
    filterMode: {},
    summaryExpanded: false,
    lastFilters: null,
    lastQuery: "",
    zoom: null,
    axisInputActive: false,
    selectionMode: "filtered",
    filteredList: [],
    materialClassDefaultsApplied: false,
    excludedSeries: new Set(),
    tooltipPinned: null,
    axisMode: AXIS_MODE_TEMPERATURE,
    axisConfig: null,
    axisTempBehavior: AXIS_TEMP_BEHAVIOR_DISTRIBUTION,
    axisSliceTempK: null,
    axisTempExtent: null,
    axisColorScale: "blue-red",
    additionalSelectionIds: new Set(),
    additionalSelectionEntryIds: [],
    summaryModalMode: "series",
  };

  let currentSeries = [];
  let currentCanvas = null;
  let lastPlotContext = null;
  let hoverCache = null;
  let lastZoomDragAt = 0;
  let isZoomDragging = false;

  initialize();

  async function initialize() {
    setShellState("loading");
    setStatus(`Loading dataset from ${endpoint}...`, "info");
    bindEvents();
    hydrateUiStateFromControls();

    const payload = await fetchDataset(endpoint);
    if (!payload || !Array.isArray(payload.lines)) {
      setStatus("Dataset missing or invalid.", "error");
      renderEmptyChart("Dataset missing. Export a new bundle and publish it.");
      showLegacyDatabaseErrorModal(
        "Failed to load the default database bundle.",
        ["Dataset missing or invalid at the configured endpoint."]
      );
      return;
    }

    const loaded = loadDataset(payload, { sourceLabel: endpoint, replot: true });
    if (!loaded) return;
    setShellState("ready");
  }

  function hydrateUiStateFromControls() {
    state.monochrome = dom.monochrome?.checked ?? false;
    state.gridX = dom.gridX?.checked ?? true;
    state.gridY = dom.gridY?.checked ?? true;
    state.legendBySource = dom.legendGroup?.checked ?? true;
    state.includeUnconfirmed = dom.includeUnconfirmed?.checked ?? false;
    state.literatureMode = dom.literatureMode?.value || "include";
    state.weldedMode = dom.weldedMode?.value || "include";
    setAdvancedFiltersVisible(dom.advancedToggle?.checked ?? false);
    setActiveSection(dom.coreSection);
    state.includeUnknownComposition = dom.filterUnknownComposition?.checked ?? false;
    const thickness = parseNumber(dom.lineThickness?.value);
    state.lineThickness = isFiniteNumber(thickness) ? clampValue(thickness, 0.5, 2) : 1;
    const activeMarkerButton = Array.from(dom.markerStyleButtons || []).find((btn) =>
      btn.classList.contains("is-active")
    );
    state.markerStyle = normalizeMarkerStyle(activeMarkerButton?.dataset?.markerStyle);
    updateLineThicknessLabel();
    syncMarkerStyleUi();
    initializeFilterModes();
    syncScaleButtonsUi();
    syncUnitButtonsUi();
  }

  function loadDataset(payload, options = {}) {
    const { sourceLabel = "dataset", replot = true } = options;
    if (!payload || !Array.isArray(payload.lines)) {
      setStatus("Dataset missing or invalid.", "error");
      return false;
    }

    state.dataset = payload;
    const validationIssues = validateDataset(payload);
    if (validationIssues.length) {
      reportValidationIssues(validationIssues);
    }
    const { seriesList, seriesById, seriesByEntryId } = normalizeDataset(payload);
    state.seriesList = seriesList;
    state.seriesById = seriesById;
    state.seriesByEntryId = seriesByEntryId;
    state.scatterbandIds = seriesList
      .filter((entry) => entry.sourceId === "boellinghaus_1995_scatterband")
      .map((entry) => entry.id);
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    state.materialClassDefaultsApplied = false;
    state.excludedSeries = new Set();
    state.filteredList = [];
    state.lastFilters = null;
    state.lastQuery = "";
    state.zoom = null;
    state.axisTempExtent = null;
    state.tooltipPinned = null;
    state.summaryExpanded = false;
    setSelectionMode("filtered");
    state.selected = new Set();
    updateCitationPanel(payload);

    const sourceCount = Object.keys(payload.sources || {}).length;
    setStatus(
      `Loaded ${payload.line_count || payload.lines.length} lines - ${sourceCount} sources - ${seriesList.length} series`,
      "ok"
    );

    populateFilters(payload);
    initializeTempFilter(state.seriesList);
    state.axisSliceTempK = getDefaultAxisSliceTemperature();
    initializeYearFilter(payload);
    resetAxisMode();
    setupAxisButtons();
    resetFiltersToDefaults({ replot: false, preserveManual: false });
    syncAxisModeUi();
    if (replot) {
      plotSelectedSeries(true);
    }
    updateSummary();
    if (!validationIssues.length && !state.selected.size) {
      renderEmptyChart("Select one or more series, then click Plot.");
    }
    setSummaryModalTitle("Filtered Series");
    state.summaryModalMode = "series";
    console.info(`HDD dataset loaded from ${sourceLabel}`);
    return true;
  }

  async function fetchDataset(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      setStatus(`Failed to load dataset (${error.message})`, "error");
      return null;
    }
  }

  function normalizeDataset(payload) {
    const sources = payload.sources || {};
    const seriesList = [];
    const seriesById = new Map();
    const seriesByEntryId = new Map();
    const usedIds = new Map();

    (payload.lines || []).forEach((line, index) => {
      if (!line || typeof line !== "object") return;
      const source = sources[line.source_id] || {};
      const sourceTitle =
        source.clear_name || source.title || line.source_id || "Unknown source";
      const sourceYear = Number.isFinite(Number(source.year)) ? Number(source.year) : null;

      const segments = normalizeLineModels(line);
      const meta = collectSeriesMeta(segments);
      const compositionRanges = computeCompositionRanges(segments);
      const numericRanges = computeNumericRanges(segments);
      const materialLabel = deriveMaterialLabel(meta);
      const temperatureRange = deriveLineTemperatureRange(segments);
      const { id: entryId, groupId } = normalizeLineId(line, index, usedIds);

      const entry = {
        id: entryId,
        groupId,
        seriesId: null,
        label: line.label || line.entry_id || "Line",
        seriesLabel: null,
        sourceId: line.source_id,
        sourceTitle,
        sourceYear,
        seriesKey: null,
        variantKey: null,
        variantUnit: null,
        temperatureRange,
        segments,
        meta,
        compositionRanges,
        numericRanges,
        materialLabel,
      };

      seriesList.push(entry);
      seriesById.set(entryId, entry);
      registerSeriesByEntryKey(seriesByEntryId, groupId, entryId);
      registerSeriesByEntryKey(seriesByEntryId, entryId, entryId);
    });

    return { seriesList, seriesById, seriesByEntryId };
  }

  function registerSeriesByEntryKey(map, key, seriesId) {
    if (!key) return;
    const normalized = String(key).trim();
    if (!normalized) return;
    if (!map.has(normalized)) {
      map.set(normalized, []);
    }
    map.get(normalized).push(seriesId);
  }

  function normalizeLineId(line, index, usedIds = new Map()) {
    const rawEntryId = typeof line?.entry_id === "string" ? line.entry_id.trim() : "";
    const base = rawEntryId || `${line?.source_id || "line"}::${index}`;
    const currentCount = usedIds.get(base) || 0;
    usedIds.set(base, currentCount + 1);
    const uniqueId = currentCount === 0 ? base : `${base}::dup${currentCount + 1}`;
    return {
      id: uniqueId,
      groupId: rawEntryId || base,
    };
  }

  function normalizeLineModels(line) {
    const models = Array.isArray(line.models) ? line.models : [];
    const segments = [];
    const base = {
      entry_id: line.entry_id,
      source_id: line.source_id,
      plotting: line.plotting,
      material: line.material,
      conditions: line.conditions,
      metadata: line.metadata,
      reported_as: line.conditions?.reported_as,
    };

    models.forEach((model) => {
      if (!model || typeof model !== "object") return;
      const segment = { ...base, model };
      const range = getModelTemperatureRange(model);
      if (range) {
        segment.temperature_validity_K = range;
      }
      segments.push(segment);
    });

    return segments;
  }

  function deriveLineTemperatureRange(segments) {
    let min = null;
    let max = null;
    segments.forEach((segment) => {
      const range = segment.temperature_validity_K;
      if (!Array.isArray(range) || range.length !== 2) return;
      const lo = Number(range[0]);
      const hi = Number(range[1]);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
      min = min == null ? lo : Math.min(min, lo);
      max = max == null ? hi : Math.max(max, hi);
    });
    if (min == null || max == null) return [null, null];
    return [min, max];
  }

  function getModelTemperatureRange(model) {
    if (!model || typeof model !== "object") return null;
    if (model.type === "single_point") {
      const temp = Number(model.temperature_K);
      return Number.isFinite(temp) ? [temp, temp] : null;
    }
    if (model.type === "table_points") {
      const points = Array.isArray(model.points) ? model.points : [];
      const temps = points
        .map((point) => Number(point?.temperature_K))
        .filter((value) => Number.isFinite(value));
      if (!temps.length) return null;
      return [Math.min(...temps), Math.max(...temps)];
    }
    const range = model.temperature_validity_K;
    if (!Array.isArray(range) || range.length !== 2) return null;
    const Tmin = Number(range[0]);
    const Tmax = Number(range[1]);
    if (!Number.isFinite(Tmin) || !Number.isFinite(Tmax)) return null;
    return [Tmin, Tmax];
  }

  function validateDataset(payload) {
    const issues = [];
    (payload.lines || []).forEach((line) => {
      const entryId = line.entry_id || "unknown_entry";
      const models = Array.isArray(line.models) ? line.models : [];
      if (!models.length) {
        issues.push(`Entry ${entryId} missing models.`);
        return;
      }

      models.forEach((model) => {
        const range = getModelTemperatureRange(model);
        if (!range) {
          issues.push(
            `Entry ${entryId} model ${model?.type || "unknown"} missing temperature range.`
          );
          return;
        }
        const Tmin = range[0];
        const Tmax = range[1];
        if (!isFiniteNumber(Tmin) || !isFiniteNumber(Tmax)) {
          issues.push(`Entry ${entryId} has invalid temperature values.`);
          return;
        }

        if (model.type === "single_point") {
          if (Tmin !== Tmax) {
            issues.push(
              `Single-point entry ${entryId} has a temperature range (${Tmin}–${Tmax} K). Expected [T, T].`
            );
          }
          if (!isFiniteNumber(model.diffusivity_mm2_per_s)) {
            issues.push(`Single-point entry ${entryId} missing diffusivity_mm2_per_s.`);
          }
          return;
        }

        if (model.type === "table_points") {
          const points = Array.isArray(model.points) ? model.points : [];
          if (!points.length) {
            issues.push(`Table-points entry ${entryId} missing points.`);
          }
          return;
        }

        if (!(Tmax > Tmin)) {
          issues.push(
            `Entry ${entryId} has a non-positive temperature range (${Tmin}–${Tmax} K).`
          );
        }
        if (model.type === "arrhenius") {
          if (!isFiniteNumber(model.D0_mm2_per_s) || !isFiniteNumber(model.Q_J_per_mol)) {
            issues.push(`Arrhenius entry ${entryId} missing D0_mm2_per_s or Q_J_per_mol.`);
          }
        }
        if (model.type === "power") {
          const A = model.A_mm2_per_s != null ? model.A_mm2_per_s : model.A;
          if (!isFiniteNumber(A) || !isFiniteNumber(model.n)) {
            issues.push(`Power entry ${entryId} missing A or n.`);
          }
        }
      });
    });
    return issues;
  }

  function reportValidationIssues(issues) {
    const message = `Dataset validation failed with ${issues.length} issue(s). Check console for details.`;
    setStatus(message, "error");
    console.error("HDD dataset validation issues:", issues);
    if (dom.summary) {
      const list = issues.slice(0, 12).map((item) => `<li>${item}</li>`).join("");
      const tail = issues.length > 12 ? `<li>…and ${issues.length - 12} more.</li>` : "";
      dom.summary.innerHTML = `
        <strong>Data issues detected.</strong>
        <p>${message}</p>
        <ul>${list}${tail}</ul>
      `;
    }
    renderEmptyChart("Dataset has validation errors. Fix them before plotting.");
  }

  function collectSeriesMeta(segments) {
    const meta = {
      material_class: new Set(),
      material_grade: new Set(),
      material_microstructure: new Set(),
      material_phase: new Set(),
      material_processing: new Set(),
      material_tags: new Set(),
      welded_process: new Set(),
      welded_layer: new Set(),
      chemical_composition: new Set(),
      reported_as: new Set(),
      studied_effects: new Set(),
      measurement_method: new Set(),
      model_type: new Set(),
      plotting_status: new Set(),
      welded_enabled: new Set(),
      charging_method: new Set(),
      calculation_model: new Set(),
      sample_geometry: new Set(),
      surface_condition: new Set(),
      surface_finish_detail: new Set(),
      coated: new Set(),
      coating_type: new Set(),
      deformation_history: new Set(),
      mechanical_loading: new Set(),
      loading_regime: new Set(),
      electrolyte: new Set(),
      control_mode: new Set(),
      poison_additive: new Set(),
      gas_composition: new Set(),
      gas_purity: new Set(),
      sims_type: new Set(),
      tda_peak_analysis: new Set(),
      dev_entry_electrolyte: new Set(),
      dev_exit_electrolyte: new Set(),
    };

    segments.forEach((segment) => {
      const material = segment.material || {};
      addIfPresent(meta.material_class, material.class);
      addIfPresent(meta.material_grade, material.grade);
      addIfPresent(meta.material_microstructure, material.microstructure);
      addIfPresent(meta.material_phase, material.phase);
      (material.processing || []).forEach((value) => addIfPresent(meta.material_processing, value));
      (material.tags || []).forEach((value) => addIfPresent(meta.material_tags, value));
      addIfPresent(meta.welded_process, material.welded?.process);
      addIfPresent(meta.welded_layer, material.welded?.layer);
      addIfPresent(meta.chemical_composition, formatChemicalComposition(material.chemical_composition));

      addIfPresent(meta.reported_as, segment.reported_as);
      deriveModelTypeLabels(segment).forEach((label) => addIfPresent(meta.model_type, label));
      addIfPresent(meta.plotting_status, segment.plotting?.status);

      const conditions = segment.conditions || {};
      addIfPresent(meta.measurement_method, conditions.measurement_method);
      addIfPresent(meta.charging_method, conditions.charging_method);
      addIfPresent(meta.calculation_model, conditions.calculation_model);
      addIfPresent(meta.sample_geometry, conditions.sample_geometry);
      addIfPresent(meta.surface_condition, conditions.surface_condition);
      addIfPresent(meta.surface_finish_detail, conditions.surface_finish_detail);
      addIfPresent(meta.coated, conditions.coated);
      addIfPresent(meta.coating_type, conditions.coating_type);
      addIfPresent(meta.deformation_history, conditions.deformation_history);
      addIfPresent(meta.mechanical_loading, conditions.mechanical_loading_during_test);
      addIfPresent(meta.loading_regime, conditions.loading_regime);

      const conditional = conditions.conditional_fields || {};
      const cathodic = conditional.cathodic || {};
      const electrochemical = conditional.electrochemical || {};
      const dev = conditional.electrochemical_devanathan_stachursky_cell || {};
      const gasPhase = conditional.gas_phase || {};
      const gasHigh = conditional.high_pressure_hydrogen || {};
      const gasLow = conditional.low_pressure_hydrogen || {};
      const tda = conditional.thermal_desorption_tda_tds || {};
      const sims = conditional.sims || {};

      addIfPresent(meta.electrolyte, cathodic.electrolyte);
      addIfPresent(meta.electrolyte, electrochemical.electrolyte);
      addIfPresent(meta.electrolyte, dev.electrolyte_entry_side);
      addIfPresent(meta.electrolyte, dev.electrolyte_exit_side);
      addIfPresent(meta.control_mode, electrochemical.control_mode);
      addIfPresent(meta.poison_additive, cathodic.poison_additive);
      addIfPresent(meta.poison_additive, electrochemical.poison_additive);
      addIfPresent(meta.poison_additive, dev.poison_additive);
      addIfPresent(meta.gas_composition, gasPhase.gas_composition);
      addIfPresent(meta.gas_composition, gasHigh.gas_composition);
      addIfPresent(meta.gas_composition, gasLow.gas_composition);
      addIfPresent(meta.gas_purity, gasPhase.gas_purity);
      addIfPresent(meta.sims_type, sims.sims_type);
      addIfPresent(meta.tda_peak_analysis, tda.peak_analysis_method);
      addIfPresent(meta.dev_entry_electrolyte, dev.electrolyte_entry_side);
      addIfPresent(meta.dev_exit_electrolyte, dev.electrolyte_exit_side);

      const welded = segment.material?.welded?.enabled;
      addIfPresent(meta.welded_enabled, welded);

      const metadata = segment.metadata || {};
      (metadata.studied_effects || []).forEach((value) => addIfPresent(meta.studied_effects, value));
    });

    return meta;
  }

  function computeCompositionRanges(segments) {
    const ranges = {};
    const mergeRange = (element, parsed) => {
      if (!parsed) return;
      const min = Number(parsed.min);
      const max = Number(parsed.max);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return;
      if (!ranges[element]) {
        ranges[element] = { min, max, kind: parsed.kind || "exact" };
        return;
      }
      ranges[element].min = Math.min(ranges[element].min, min);
      ranges[element].max = Math.max(ranges[element].max, max);
      if (ranges[element].kind !== parsed.kind) {
        ranges[element].kind = "interval";
      }
    };
    segments.forEach((segment) => {
      const composition = segment.material?.chemical_composition;
      if (!composition || composition.basis !== "wt_pct") return;
      const values = composition.values || {};
      Object.keys(values).forEach((key) => {
        const element = normalizeElementSymbol(key);
        if (!element) return;
        const parsed = parseCompositionValue(values[key]);
        mergeRange(element, parsed);
      });
    });
    return Object.keys(ranges).length ? ranges : null;
  }

  function parseCompositionValue(rawValue) {
    if (rawValue == null) return null;
    const asNumber = Number(rawValue);
    if (Number.isFinite(asNumber)) {
      return { min: asNumber, max: asNumber, kind: "exact" };
    }
    const text = String(rawValue).trim().replace(",", ".");
    if (!text) return null;
    const upper = text.match(/^<=?\s*([0-9]+(?:\.[0-9]+)?)$/);
    if (upper) {
      const max = Number(upper[1]);
      if (!Number.isFinite(max)) return null;
      return { min: 0, max, kind: "upper_bound" };
    }
    const lower = text.match(/^>=?\s*([0-9]+(?:\.[0-9]+)?)$/);
    if (lower) {
      const min = Number(lower[1]);
      if (!Number.isFinite(min)) return null;
      return { min, max: min, kind: "lower_bound" };
    }
    const interval = text.match(
      /^([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:\.[0-9]+)?)$/i
    );
    if (interval) {
      const min = Number(interval[1]);
      const max = Number(interval[2]);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
      return { min: Math.min(min, max), max: Math.max(min, max), kind: "interval" };
    }
    return null;
  }

  function computeNumericRanges(segments) {
    const ranges = {};
    const addRange = (key, raw, factor = 1) => {
      const value = parseNumber(raw);
      if (!Number.isFinite(value)) return;
      const scaled = value * factor;
      if (!ranges[key]) {
        ranges[key] = { min: scaled, max: scaled };
      } else {
        ranges[key].min = Math.min(ranges[key].min, scaled);
        ranges[key].max = Math.max(ranges[key].max, scaled);
      }
    };

    segments.forEach((segment) => {
      const material = segment.material || {};
      addRange("welding_t85", material.welded?.t85);

      const conditions = segment.conditions || {};
      addRange("charging_temperature_c", conditions.charging_temperature_c);
      addRange("charging_duration_h", conditions.charging_duration_h);
      addRange("characteristic_length_mm", conditions.characteristic_length_mm);
      addRange("coating_thickness_um", conditions.coating_thickness_um);
      addRange("pre_strain_percent", conditions.pre_strain_percent);
      addRange("cold_reduction_percent", conditions.cold_reduction_percent);
      addRange("applied_stress_mpa", conditions.applied_stress_mpa);
      addRange("applied_strain_percent", conditions.applied_strain_percent);

      const conditional = conditions.conditional_fields || {};
      const cathodic = conditional.cathodic || {};
      const electrochemical = conditional.electrochemical || {};
      const dev = conditional.electrochemical_devanathan_stachursky_cell || {};
      const gasPhase = conditional.gas_phase || {};
      const gasHigh = conditional.high_pressure_hydrogen || {};
      const gasLow = conditional.low_pressure_hydrogen || {};
      const tda = conditional.thermal_desorption_tda_tds || {};
      const hotExtraction = conditional.hot_extraction_cghe_gc || {};
      const isothermal = conditional.isothermal_effusion_degassing || {};

      addRange("current_density_mA_per_cm2", cathodic.current_density_mA_per_cm2);
      addRange("current_density_mA_per_cm2", electrochemical.current_density_mA_per_cm2);
      addRange("current_density_mA_per_cm2", dev.current_density_mA_per_mm2, 100);
      addRange("applied_potential_v", electrochemical.applied_potential_v);
      addRange("gas_pressure_bar", gasPhase.pressure_bar);
      addRange("gas_pressure_bar", gasHigh.pressure_bar);
      addRange("gas_pressure_bar", gasLow.pressure_bar);
      addRange("heating_rate_k_per_min", tda.heating_rate_k_per_min);
      addRange("extraction_temperature_c", hotExtraction.extraction_temperature_c);
      addRange("extraction_temperature_c", isothermal.degassing_temperature_c);
    });

    return Object.keys(ranges).length ? ranges : null;
  }

  function deriveModelTypeLabels(segment) {
    const labels = new Set();
    const modelType = segment.model?.type;
    const style = segment.plotting?.style;
    const isLineStyle = typeof style === "string" && style.toLowerCase() === "line";
    if (modelType === "arrhenius") {
      labels.add("Arrhenius");
    } else if (modelType === "single_point") {
      if (!isLineStyle) {
        labels.add("Single Points");
      }
    } else if (modelType === "power" || modelType === "table_points") {
      labels.add("Digitized/Series");
    } else if (modelType) {
      labels.add(String(modelType));
    }

    if (isLineStyle) {
      labels.add("Digitized/Series");
    }

    return Array.from(labels);
  }

  function deriveMaterialLabel(meta) {
    const classLabel = first(meta.material_class);
    const grade = first(meta.material_grade);
    if (classLabel && grade) return `${classLabel} · ${grade}`;
    return classLabel || grade || null;
  }

  function bindEvents() {
    dom.search?.addEventListener("input", () =>
      applyFilters({ preserveManual: true, replot: false })
    );
    dom.list?.addEventListener("change", handleSelectionChange);
    dom.summary?.addEventListener("click", handleSummaryToggle);
    dom.unitButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleUnits(btn))
    );
    dom.axisTempBehaviorButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        const behavior = btn.dataset.axisTempBehavior;
        state.axisTempBehavior =
          behavior === AXIS_TEMP_BEHAVIOR_SLICE
            ? AXIS_TEMP_BEHAVIOR_SLICE
            : AXIS_TEMP_BEHAVIOR_DISTRIBUTION;
        dom.axisTempBehaviorButtons.forEach((other) =>
          other.classList.toggle("is-active", other === btn)
        );
        syncAxisModeUi();
        plotSelectedSeries(true);
      });
    });
    dom.axisSliceTemp?.addEventListener("input", () => {
      if (!dom.axisSliceTemp) return;
      if (dom.axisSliceTemp.value && dom.axisSliceTemp.value.includes(",")) {
        dom.axisSliceTemp.value = dom.axisSliceTemp.value.replace(/,/g, ".");
      }
      const value = parseNumber(dom.axisSliceTemp.value);
      if (value == null) return;
      state.axisSliceTempK = toKelvinForUnits(value);
      plotSelectedSeries(true);
    });
    dom.axisReset?.addEventListener("click", () => {
      resetAxisMode();
      applyFilters({ preserveManual: true, replot: true });
    });
    dom.axisTempLegendBar?.addEventListener("click", () => {
      cycleAxisColorScale();
    });
    bindAxisLegendBoundEditor(dom.axisTempLegendMin, "min");
    bindAxisLegendBoundEditor(dom.axisTempLegendMax, "max");
    dom.axisTempPaletteButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        const scale = btn.dataset.axisPalette;
        if (!scale) return;
        setAxisColorScale(scale);
      });
    });
    dom.scaleButtons?.forEach((btn) =>
      btn.addEventListener("click", () => toggleScale(btn))
    );
    dom.resetZoom?.addEventListener("click", resetZoom);
    dom.envelope?.addEventListener("change", () => {
      state.envelope = dom.envelope.checked;
      plotSelectedSeries();
    });
    dom.forceScatterband?.addEventListener("change", () => {
      state.forceScatterband = dom.forceScatterband.checked;
      plotSelectedSeries(true);
    });
    dom.numbering?.addEventListener("change", () => {
      state.numbering = dom.numbering.checked;
      plotSelectedSeries();
    });
    dom.legendGroup?.addEventListener("change", () => {
      state.legendBySource = dom.legendGroup.checked;
      plotSelectedSeries();
    });
    dom.monochrome?.addEventListener("change", () => {
      state.monochrome = dom.monochrome.checked;
      plotSelectedSeries();
    });
    dom.gridX?.addEventListener("change", () => {
      state.gridX = dom.gridX.checked;
      plotSelectedSeries();
    });
    dom.gridY?.addEventListener("change", () => {
      state.gridY = dom.gridY.checked;
      plotSelectedSeries();
    });
    dom.lineThickness?.addEventListener("input", () => {
      const value = parseNumber(dom.lineThickness.value);
      state.lineThickness = isFiniteNumber(value) ? clampValue(value, 0.5, 2) : 1;
      updateLineThicknessLabel();
      plotSelectedSeries();
    });
    dom.markerStyleButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        state.markerStyle = normalizeMarkerStyle(button.dataset.markerStyle);
        syncMarkerStyleUi();
        plotSelectedSeries(true);
      });
    });
    [dom.axisXMin, dom.axisXMax, dom.axisYMin, dom.axisYMax].forEach((input) => {
      input?.addEventListener("focus", () => {
        state.axisInputActive = true;
      });
      input?.addEventListener("blur", () => {
        state.axisInputActive = false;
        setZoomFromInputs();
        plotSelectedSeries(true);
      });
      input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          setZoomFromInputs();
          plotSelectedSeries(true);
        }
      });
    });
    dom.filterUnknownComposition?.addEventListener("change", () => {
      state.includeUnknownComposition = dom.filterUnknownComposition.checked;
      applyFilters();
    });
    dom.weldedMode?.addEventListener("change", () => {
      state.weldedMode = dom.weldedMode.value || "include";
      applyFilters();
    });
    dom.literatureMode?.addEventListener("change", () => {
      state.literatureMode = dom.literatureMode.value || "include";
      applyFilters();
    });
    dom.advancedToggle?.addEventListener("change", () => {
      const open = dom.advancedToggle.checked;
      setAdvancedFiltersVisible(open);
    });
    dom.sections?.forEach((section) => {
      section.addEventListener("toggle", () => {
        if (!section.open) return;
        if (!dom.advancedToggle?.checked) return;
        dom.sections.forEach((other) => {
          if (other === section) return;
          other.removeAttribute("open");
        });
        if (state.lastFilters) {
          updateFilterAvailability(state.lastFilters, state.lastQuery || "");
        }
      });
    });
    dom.filterModeToggles?.forEach((toggle) => {
      toggle.addEventListener("click", (event) => event.stopPropagation());
      toggle.addEventListener("change", () => {
        const key = toggle.dataset.filterMode;
        if (!key) return;
        state.filterMode[key] = toggle.checked ? "exclude" : "include";
        applyFilters();
      });
    });
    [dom.tempMin, dom.tempMax].forEach((input) =>
      input?.addEventListener("input", () => {
        updateTempFromInputs();
      })
    );
    [dom.yearMin, dom.yearMax].forEach((input) =>
      input?.addEventListener("input", () => {
        updateYearFromInputs();
      })
    );
    bindTempRange();
    bindYearRange();
    dom.openSeries?.addEventListener("click", () => toggleSeriesDrawer(true));
    dom.refreshPlot?.addEventListener("click", resetZoom);
    dom.importSettings?.addEventListener("click", handleImportSettingsClick);
    dom.legacyDbButton?.addEventListener("click", () => {
      if (!dom.legacyDbFile) return;
      dom.legacyDbFile.value = "";
      dom.legacyDbFile.click();
    });
    dom.legacyDbFile?.addEventListener("change", handleLegacyDatabaseUpload);
    dom.downloadButtons?.forEach((button) =>
      button.addEventListener("click", () => handleDownload(button))
    );
    dom.plotOptionPanels?.forEach((panel) => {
      panel.addEventListener("toggle", () => {
        if (!panel.open) return;
        dom.plotOptionPanels.forEach((other) => {
          if (other !== panel) other.open = false;
        });
      });
    });
    dom.citationLinks?.forEach((button) =>
      button.addEventListener("click", () => {
        if (!dom.citationPanel) return;
        dom.citationPanel.open = true;
        dom.citationPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      })
    );
    dom.filterComposition?.addEventListener("input", handleCompositionInput);
    dom.clearFilters?.addEventListener("click", clearFilters);
    dom.selectAll?.addEventListener("click", selectAllVisible);
    dom.deselectAll?.addEventListener("click", deselectAllVisible);
    dom.showAll?.addEventListener("click", showAllSeriesList);
    mount.addEventListener("click", handleAxisButtonClick);
    bindHeroLightbox();
    dom.sectionHeaders?.forEach((header) => {
      header.addEventListener("click", (event) => {
        const section = event.currentTarget?.closest?.(".hdd-filter-section");
        if (!section) return;
        if (section === dom.coreSection && section?.dataset?.locked === "true") {
          event.preventDefault();
          collapseCoreFilterBlocks();
          setActiveSection(section);
          return;
        }
        setActiveSection(section);
      });
    });
      dom.includeUnconfirmed?.addEventListener("change", () => {
        state.includeUnconfirmed = dom.includeUnconfirmed.checked;
        applyFilters();
      });

      dom.summaryModal?.addEventListener("click", (event) => {
        const target = event.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-action='close-summary']") || target.classList.contains("hdd-summary-backdrop")) {
          closeSummaryModal();
        }
      });

      let resizeFrame = null;
      window.addEventListener("resize", () => {
        if (!currentSeries.length) return;
        if (resizeFrame) return;
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = null;
          if (state.axisMode === AXIS_MODE_FILTER && state.axisConfig) {
            renderAxisChart(currentSeries);
          } else {
            renderChart(currentSeries);
          }
        });
      });

    [
      dom.filterSource,
      dom.filterClass,
      dom.filterGrade,
      dom.filterMicrostructure,
      dom.filterPhase,
      dom.filterProcessing,
      dom.filterTags,
      dom.filterWeldProcess,
      dom.filterWeldLayer,
      dom.filterComposition,
      dom.filterChargingMethod,
      dom.filterCalculationModel,
      dom.filterSampleGeometry,
      dom.filterSurfaceCondition,
      dom.filterSurfaceFinishDetail,
      dom.filterCoated,
      dom.filterCoatingType,
      dom.filterDeformationHistory,
      dom.filterMechanicalLoading,
      dom.filterLoadingRegime,
      dom.filterElectrolyte,
      dom.filterControlMode,
      dom.filterPoisonAdditive,
      dom.filterGasComposition,
      dom.filterGasPurity,
      dom.filterTdaPeak,
      dom.filterSimsType,
      dom.filterDevEntryElectrolyte,
      dom.filterDevExitElectrolyte,
      dom.filterReported,
      dom.filterEffect,
      dom.filterMethod,
      dom.filterModel,
    ].forEach((listbox) => {
      if (!listbox) return;
      listbox.addEventListener("change", () => applyFilters());
    });

    dom.numericRangeInputs?.forEach((input) => {
      input.addEventListener("input", handleNumericFilterInput);
      input.addEventListener("change", handleNumericFilterInput);
    });

    if (dom.seriesDrawer) {
      dom.seriesDrawer.addEventListener("click", (event) => {
        const target = event.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-action='close-series']")) {
          toggleSeriesDrawer(false);
        }
      });
    }
  }

  function bindHeroLightbox() {
    if (!dom.heroLogo || !dom.heroLightbox) return;
    dom.heroLogo.addEventListener("click", openHeroLightbox);
    dom.heroCloseButtons.forEach((button) => {
      button.addEventListener("click", closeHeroLightbox);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeHeroLightbox();
    });
  }

  function openHeroLightbox() {
    if (!dom.heroLightbox) return;
    dom.heroLightbox.removeAttribute("hidden");
    requestAnimationFrame(() => {
      dom.heroLightbox.classList.add("is-open");
    });
  }

  function closeHeroLightbox() {
    if (!dom.heroLightbox) return;
    dom.heroLightbox.classList.remove("is-open");
    window.setTimeout(() => {
      dom.heroLightbox.setAttribute("hidden", "true");
    }, 200);
  }

  function populateFilters(payload) {
    const sources = payload.sources || {};
    const sourceOptions = Object.values(sources)
      .map((source) => ({
        value: source.source_id || "",
        label: source.clear_name || source.title || source.source_id || "Unknown source",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setSelectOptions(dom.filterSource, sourceOptions);
    setSelectOptions(dom.filterClass, toOptions(payload.filters?.material_class));
    applyDefaultMaterialClassExclusions(true);
    setSelectOptions(dom.filterGrade, toOptions(payload.filters?.material_grade));
    setSelectOptions(
      dom.filterMicrostructure,
      toOptions(collectMetaValues(state.seriesList, "material_microstructure"))
    );
    setSelectOptions(dom.filterPhase, toOptions(collectMetaValues(state.seriesList, "material_phase")));
    setSelectOptions(dom.filterProcessing, toOptions(collectMetaValues(state.seriesList, "material_processing")));
    setSelectOptions(dom.filterTags, toOptions(collectMetaValues(state.seriesList, "material_tags")));
    setSelectOptions(dom.filterWeldProcess, toOptions(collectMetaValues(state.seriesList, "welded_process")));
    setSelectOptions(dom.filterWeldLayer, toOptions(collectMetaValues(state.seriesList, "welded_layer")));
    populateCompositionFilters(state.seriesList);
    setSelectOptions(dom.filterChargingMethod, toOptions(collectMetaValues(state.seriesList, "charging_method")));
    setSelectOptions(dom.filterCalculationModel, toOptions(collectMetaValues(state.seriesList, "calculation_model")));
    setSelectOptions(dom.filterSampleGeometry, toOptions(collectMetaValues(state.seriesList, "sample_geometry")));
    setSelectOptions(dom.filterSurfaceCondition, toOptions(collectMetaValues(state.seriesList, "surface_condition")));
    setSelectOptions(dom.filterSurfaceFinishDetail, toOptions(collectMetaValues(state.seriesList, "surface_finish_detail")));
    setSelectOptions(dom.filterCoated, toOptions(collectMetaValues(state.seriesList, "coated")));
    setSelectOptions(dom.filterCoatingType, toOptions(collectMetaValues(state.seriesList, "coating_type")));
    setSelectOptions(dom.filterDeformationHistory, toOptions(collectMetaValues(state.seriesList, "deformation_history")));
    setSelectOptions(dom.filterMechanicalLoading, toOptions(collectMetaValues(state.seriesList, "mechanical_loading")));
    setSelectOptions(dom.filterLoadingRegime, toOptions(collectMetaValues(state.seriesList, "loading_regime")));
    setSelectOptions(dom.filterElectrolyte, toOptions(collectMetaValues(state.seriesList, "electrolyte")));
    setSelectOptions(dom.filterControlMode, toOptions(collectMetaValues(state.seriesList, "control_mode")));
    setSelectOptions(dom.filterPoisonAdditive, toOptions(collectMetaValues(state.seriesList, "poison_additive")));
    setSelectOptions(dom.filterGasComposition, toOptions(collectMetaValues(state.seriesList, "gas_composition")));
    setSelectOptions(dom.filterGasPurity, toOptions(collectMetaValues(state.seriesList, "gas_purity")));
    setSelectOptions(dom.filterTdaPeak, toOptions(collectMetaValues(state.seriesList, "tda_peak_analysis")));
    setSelectOptions(dom.filterSimsType, toOptions(collectMetaValues(state.seriesList, "sims_type")));
    setSelectOptions(dom.filterDevEntryElectrolyte, toOptions(collectMetaValues(state.seriesList, "dev_entry_electrolyte")));
    setSelectOptions(dom.filterDevExitElectrolyte, toOptions(collectMetaValues(state.seriesList, "dev_exit_electrolyte")));
    setSelectOptions(dom.filterReported, toOptions(payload.filters?.reported_as));
    setSelectOptions(dom.filterEffect, toOptions(payload.filters?.studied_effects));
    setSelectOptions(dom.filterMethod, toOptions(payload.filters?.measurement_method));
    setSelectOptions(dom.filterModel, toOptions(collectMetaValues(state.seriesList, "model_type")));
  }

  function normalizeFilterLabel(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u2010-\u2015-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function applyDefaultMaterialClassExclusions(force = false) {
    if (!dom.filterClass || (!force && state.materialClassDefaultsApplied)) return;
    const targets = ["stainless steel", "nickel based alloy", "nickel based alloys"];
    const items = Array.from(dom.filterClass.querySelectorAll(".hdd-filter-item"));
    if (!items.length) return;
    items.forEach((item) => {
      const checkbox = item.querySelector("input");
      const label = normalizeFilterLabel(item.querySelector("span")?.textContent || "");
      const value = normalizeFilterLabel(checkbox?.value || "");
      if (!label && !value) return;
      const isMatch = targets.some((target) => label.includes(target) || value.includes(target));
      if (!isMatch) return;
      if (checkbox) checkbox.checked = true;
    });
    state.materialClassDefaultsApplied = true;
  }

  function initializeTempFilter(seriesList) {
    if (!dom.tempMin || !dom.tempMax || !dom.tempRange || !dom.tempHandleMin || !dom.tempHandleMax) return;
    const ranges = (seriesList || [])
      .map((entry) => entry.temperatureRange || [])
      .filter((range) => Array.isArray(range) && range.length === 2)
      .map((range) => [Number(range[0]), Number(range[1])])
      .filter(([min, max]) => Number.isFinite(min) && Number.isFinite(max))
      .filter(([min, max]) => min > 0 && max > 0 && max >= min);
    if (!ranges.length) {
      [dom.tempMin, dom.tempMax, dom.tempHandleMin, dom.tempHandleMax].forEach((el) => {
        if (el) el.disabled = true;
      });
      return;
    }
    const minK = Math.min(...ranges.map((range) => range[0]));
    const maxK = Math.max(...ranges.map((range) => range[1]));
    const minC = Math.floor(minK - 273.15);
    const maxC = Math.ceil(maxK - 273.15);
    state.tempDomain = { min: minC, max: maxC };
    dom.tempMin.placeholder = String(minC);
    dom.tempMax.placeholder = String(maxC);
    dom.tempMin.value = "";
    dom.tempMax.value = "";
    setTempFilter(null, null, true);
  }

  function clampTempC(value) {
    if (!state.tempDomain || !Number.isFinite(value)) return value;
    return Math.min(state.tempDomain.max, Math.max(state.tempDomain.min, value));
  }

  function setTempFilter(minC, maxC, syncInputs = true) {
    let minValue = minC;
    let maxValue = maxC;
    if (minValue != null) minValue = clampTempC(minValue);
    if (maxValue != null) maxValue = clampTempC(maxValue);
    if (minValue != null && maxValue != null && minValue > maxValue) {
      const swap = minValue;
      minValue = maxValue;
      maxValue = swap;
    }
    state.tempMin = minValue != null ? minValue + 273.15 : null;
    state.tempMax = maxValue != null ? maxValue + 273.15 : null;
    if (!state.tempDomain) return;
    const rangeMin = minValue != null ? minValue : state.tempDomain.min;
    const rangeMax = maxValue != null ? maxValue : state.tempDomain.max;
    updateTempHandles(rangeMin, rangeMax);
    if (syncInputs) {
      dom.tempMin.value = minValue != null ? String(minValue) : "";
      dom.tempMax.value = maxValue != null ? String(maxValue) : "";
    }
  }

  function updateTempFromInputs() {
    const rawMin = dom.tempMin?.value;
    const rawMax = dom.tempMax?.value;
    let min = rawMin === "" ? null : clampTempC(parseNumber(rawMin));
    let max = rawMax === "" ? null : clampTempC(parseNumber(rawMax));
    if (Number.isNaN(min)) min = null;
    if (Number.isNaN(max)) max = null;
    setTempFilter(min, max, false);
    applyFilters();
  }

  function updateTempRangeFill(minValue, maxValue) {
    if (!state.tempDomain || !dom.tempRangeFill) return;
    const span = state.tempDomain.max - state.tempDomain.min || 1;
    const left = ((minValue - state.tempDomain.min) / span) * 100;
    const right = ((maxValue - state.tempDomain.min) / span) * 100;
    dom.tempRangeFill.style.left = `${Math.min(left, right)}%`;
    dom.tempRangeFill.style.right = `${100 - Math.max(left, right)}%`;
  }

  function updateTempHandles(minValue, maxValue) {
    if (!state.tempDomain || !dom.tempHandleMin || !dom.tempHandleMax || !dom.tempRangeFill) return;
    updateTempRangeFill(minValue, maxValue);
    const span = state.tempDomain.max - state.tempDomain.min || 1;
    const minPct = ((minValue - state.tempDomain.min) / span) * 100;
    const maxPct = ((maxValue - state.tempDomain.min) / span) * 100;
    dom.tempHandleMin.style.left = `${minPct}%`;
    dom.tempHandleMax.style.left = `${maxPct}%`;
  }

  function bindTempRange() {
    if (!dom.tempRange || !dom.tempHandleMin || !dom.tempHandleMax) return;
    const onPointer = (event, handle) => {
      if (!state.tempDomain) return;
      const rect = dom.tempRange.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const value = Math.round(state.tempDomain.min + percent * (state.tempDomain.max - state.tempDomain.min));
      let minValue = state.tempMin != null ? Math.round(state.tempMin - 273.15) : state.tempDomain.min;
      let maxValue = state.tempMax != null ? Math.round(state.tempMax - 273.15) : state.tempDomain.max;
      if (handle === "min") {
        minValue = Math.min(value, maxValue);
      } else {
        maxValue = Math.max(value, minValue);
      }
      setTempFilter(minValue, maxValue, true);
      applyFilters();
    };

    const startDrag = (handle) => (event) => {
      event.preventDefault();
      dom.tempHandleMin.classList.toggle("is-active", handle === "min");
      dom.tempHandleMax.classList.toggle("is-active", handle === "max");
      const move = (moveEvent) => onPointer(moveEvent, handle);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      onPointer(event, handle);
    };

    dom.tempHandleMin.addEventListener("pointerdown", startDrag("min"));
    dom.tempHandleMax.addEventListener("pointerdown", startDrag("max"));
    dom.tempRange.addEventListener("pointerdown", (event) => {
      const minValue = state.tempMin != null ? Math.round(state.tempMin - 273.15) : state.tempDomain.min;
      const maxValue = state.tempMax != null ? Math.round(state.tempMax - 273.15) : state.tempDomain.max;
      const rect = dom.tempRange.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const value = Math.round(state.tempDomain.min + percent * (state.tempDomain.max - state.tempDomain.min));
      const distToMin = Math.abs(value - minValue);
      const distToMax = Math.abs(value - maxValue);
      if (distToMin <= distToMax) {
        startDrag("min")(event);
      } else {
        startDrag("max")(event);
      }
    });
  }

  function initializeYearFilter(payload) {
    if (!dom.yearMin || !dom.yearMax || !dom.yearRange || !dom.yearHandleMin || !dom.yearHandleMax) return;
    const years = Object.values(payload.sources || {})
      .map((source) => Number(source.year))
      .filter((value) => Number.isFinite(value));
    if (!years.length) {
      [dom.yearMin, dom.yearMax, dom.yearHandleMin, dom.yearHandleMax].forEach((el) => {
        if (el) el.disabled = true;
      });
      return;
    }
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    state.yearDomain = { min: minYear, max: maxYear };
    dom.yearMin.placeholder = String(minYear);
    dom.yearMax.placeholder = String(maxYear);
    dom.yearMin.value = "";
    dom.yearMax.value = "";
    setYearFilter(null, null, true);
  }

  function clampYear(value) {
    if (!state.yearDomain || !Number.isFinite(value)) return value;
    return Math.min(state.yearDomain.max, Math.max(state.yearDomain.min, value));
  }

  function setYearFilter(minValue, maxValue, syncInputs = true) {
    state.yearMin = minValue;
    state.yearMax = maxValue;
    if (!state.yearDomain) return;
    const rangeMin = minValue != null ? minValue : state.yearDomain.min;
    const rangeMax = maxValue != null ? maxValue : state.yearDomain.max;
    updateYearHandles(rangeMin, rangeMax);
    if (syncInputs) {
      dom.yearMin.value = minValue != null ? String(minValue) : "";
      dom.yearMax.value = maxValue != null ? String(maxValue) : "";
    }
  }

  function updateYearFromInputs() {
    const rawMin = dom.yearMin?.value;
    const rawMax = dom.yearMax?.value;
    let min = rawMin === "" ? null : clampYear(Number(rawMin));
    let max = rawMax === "" ? null : clampYear(Number(rawMax));
    if (Number.isNaN(min)) min = null;
    if (Number.isNaN(max)) max = null;
    if (min != null && max != null && min > max) {
      const swap = min;
      min = max;
      max = swap;
    }
    setYearFilter(min, max, false);
    applyFilters();
  }

  function updateYearRangeFill(minValue, maxValue) {
    if (!state.yearDomain || !dom.yearRangeFill) return;
    const span = state.yearDomain.max - state.yearDomain.min || 1;
    const left = ((minValue - state.yearDomain.min) / span) * 100;
    const right = ((maxValue - state.yearDomain.min) / span) * 100;
    dom.yearRangeFill.style.left = `${Math.min(left, right)}%`;
    dom.yearRangeFill.style.right = `${100 - Math.max(left, right)}%`;
  }

  function updateYearHandles(minValue, maxValue) {
    if (!state.yearDomain || !dom.yearHandleMin || !dom.yearHandleMax || !dom.yearRangeFill) return;
    updateYearRangeFill(minValue, maxValue);
    const span = state.yearDomain.max - state.yearDomain.min || 1;
    const minPct = ((minValue - state.yearDomain.min) / span) * 100;
    const maxPct = ((maxValue - state.yearDomain.min) / span) * 100;
    dom.yearHandleMin.style.left = `${minPct}%`;
    dom.yearHandleMax.style.left = `${maxPct}%`;
  }

  function bindYearRange() {
    if (!dom.yearRange || !dom.yearHandleMin || !dom.yearHandleMax) return;
    const onPointer = (event, handle) => {
      if (!state.yearDomain) return;
      const rect = dom.yearRange.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const value = Math.round(state.yearDomain.min + percent * (state.yearDomain.max - state.yearDomain.min));
      let minValue = state.yearMin ?? state.yearDomain.min;
      let maxValue = state.yearMax ?? state.yearDomain.max;
      if (handle === "min") {
        minValue = Math.min(value, maxValue);
      } else {
        maxValue = Math.max(value, minValue);
      }
      setYearFilter(minValue, maxValue, true);
      applyFilters();
    };

    const startDrag = (handle) => (event) => {
      event.preventDefault();
      dom.yearHandleMin.classList.toggle("is-active", handle === "min");
      dom.yearHandleMax.classList.toggle("is-active", handle === "max");
      const move = (moveEvent) => onPointer(moveEvent, handle);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      onPointer(event, handle);
    };

    dom.yearHandleMin.addEventListener("pointerdown", startDrag("min"));
    dom.yearHandleMax.addEventListener("pointerdown", startDrag("max"));
    dom.yearRange.addEventListener("pointerdown", (event) => {
      const minValue = state.yearMin ?? state.yearDomain.min;
      const maxValue = state.yearMax ?? state.yearDomain.max;
      const rect = dom.yearRange.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const value = Math.round(state.yearDomain.min + percent * (state.yearDomain.max - state.yearDomain.min));
      const distToMin = Math.abs(value - minValue);
      const distToMax = Math.abs(value - maxValue);
      if (distToMin <= distToMax) {
        startDrag("min")(event);
      } else {
        startDrag("max")(event);
      }
    });
  }


  function setSelectOptions(listbox, options) {
    if (!listbox) return;
    listbox.innerHTML = "";
    options.forEach((option) => {
      const item = document.createElement("label");
      item.className = "hdd-filter-item";
      item.dataset.value = option.value;
      item.innerHTML = `
        <input type="checkbox" value="${escapeHtml(option.value)}" />
        <span>${escapeHtml(option.label)}</span>
      `;
      listbox.appendChild(item);
    });
    bindFilterListResize(listbox);
    requestAnimationFrame(() => adjustFilterListHeight(listbox));
  }

  function updateCitationPanel(payload) {
    if (!payload || !payload.citations) return;
    const analysis = payload.citations.analysis || {};
    const database = payload.citations.database || {};

    if (dom.citationAnalysis) {
      dom.citationAnalysis.innerHTML = formatCitation(analysis);
    }
    if (dom.citationDatabase) {
      dom.citationDatabase.innerHTML = "";
      dom.citationDatabase.style.display = "none";
    }
    updateCitationDownloads(database);
  }

  function normalizeDoiValue(value) {
    if (typeof value !== "string") return "";
    let doi = value.trim();
    if (!doi) return "";
    doi = doi.replace(/^doi:\s*/i, "");
    doi = doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
    doi = doi.replace(/^doi\.org\//i, "");
    return doi.trim();
  }

  function toDoiUrl(value) {
    const normalized = normalizeDoiValue(value);
    if (!normalized) return "";
    return `https://doi.org/${normalized}`;
  }

  function formatCitation(item) {
    if (!item || typeof item !== "object") return "Citation unavailable.";
    const lines = [];
    const doiUrl = toDoiUrl(item.doi);
    if (item.authors && item.authors.length) lines.push(escapeHtml(item.authors.join(", ")));
    if (item.title) lines.push(escapeHtml(item.title));
    if (doiUrl) {
      const safeUrl = escapeHtml(doiUrl);
      lines.push(`DOI: <a class="hdd-inline-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>`);
    } else if (item.doi) {
      lines.push(`DOI: ${escapeHtml(item.doi)}`);
    }
    if (item.institution || item.year) {
      const tail = [item.institution, item.year].filter(Boolean).join(", ");
      if (tail) lines.push(escapeHtml(tail));
    }
    if (item.url) {
      const url = String(item.url).trim();
      const safeUrl = escapeHtml(url);
      lines.push(
        `<a class="hdd-inline-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>`
      );
    }
    return lines.filter(Boolean).join("<br/>");
  }

  function updateCitationDownloads(database) {
    if (!database || typeof database !== "object") return;
    const doiRaw = typeof database.doi === "string" ? database.doi.trim() : "";
    const doi = normalizeDoiValue(doiRaw);
    const doiUrl = toDoiUrl(doiRaw);
    const doiExport = doiUrl || doi;
    const url = typeof database.url === "string" ? database.url.trim() : "";
    const citationUrl = url || doiUrl || "https://czeskleba.com/hydrogen-diffusion-database/";
    const authors =
      Array.isArray(database.authors) && database.authors.length ? database.authors.join(" and ") : "";
    const title = typeof database.title === "string" ? database.title.trim() : "";

    const plainText = `D. Czeskleba, Hydrogen Diffusion Database (HDD.B), ${
      doiExport || "[DOI]"
    }, ${citationUrl}`;

    const bibtexLines = [
      "@misc{hdd_b,",
      authors ? `  author = {${authors}},` : null,
      title ? `  title = {${title}},` : null,
      doiExport ? `  doi = {${doiExport}},` : null,
      citationUrl ? `  url = {${citationUrl}},` : null,
      "}",
    ].filter(Boolean);
    const bibtex = bibtexLines.join("\n");

    const risLines = [
      "TY  - DATA",
      authors
        ? authors.split(" and ").map((author) => `AU  - ${author}`).join("\n")
        : null,
      title ? `TI  - ${title}` : null,
      doiExport ? `DO  - ${doiExport}` : null,
      citationUrl ? `UR  - ${citationUrl}` : null,
      "ER  -",
    ].filter(Boolean);
    const ris = risLines.join("\n");

    setCitationDownload(dom.citationPlain, "hdd-citation.txt", "text/plain", plainText);
    setCitationDownload(dom.citationBibtex, "hdd-citation.bib", "text/x-bibtex", bibtex);
    setCitationDownload(dom.citationRis, "hdd-citation.ris", "application/x-research-info-systems", ris);
  }

  function setCitationDownload(element, filename, mimeType, content) {
    if (!element) return;
    if (element.dataset?.objectUrl) {
      URL.revokeObjectURL(element.dataset.objectUrl);
    }
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const objectUrl = URL.createObjectURL(blob);
    element.href = objectUrl;
    element.download = filename;
    element.dataset.objectUrl = objectUrl;
  }

  function getDatabaseFooterLine() {
    const database = state.dataset?.citations?.database || {};
    const doi = typeof database.doi === "string" ? database.doi.trim() : "";
    const url = typeof database.url === "string" ? database.url.trim() : "";
    let host = "";
    if (url) {
      try {
        host = new URL(url).hostname.replace(/^www\./, "");
      } catch (error) {
        host = url.replace(/^https?:\/\//, "").split("/")[0];
      }
    }
    if (!host) host = "czeskleba.com";
    if (doi) return `HDD.B — ${host} — ${doi}`;
    return `HDD.B — ${host}`;
  }

  function renderExportFooter(ctx, width, height) {
    const footerLine = getDatabaseFooterLine();
    if (!footerLine) return;
    ctx.save();
    ctx.font = `11px ${lastPlotContext?.theme?.font || "Calibri, Times New Roman, Arial, sans-serif"}`;
    ctx.fillStyle = lastPlotContext?.theme?.muted || "#64748b";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(footerLine, 12, height - 10);
    ctx.restore();
  }

  function populateCompositionFilters(seriesList) {
    if (!dom.filterComposition) return;
    const elements = new Set();
    seriesList.forEach((entry) => {
      const ranges = entry.compositionRanges;
      if (!ranges) return;
      Object.keys(ranges).forEach((element) => elements.add(normalizeElementSymbol(element)));
    });
    const priorityOrder = [
      "C",
      "Si",
      "Mn",
      "P",
      "S",
      "Cr",
      "Ni",
      "Mo",
      "V",
      "Nb",
      "Ti",
      "Al",
      "B",
      "N",
      "Cu",
    ];
    const priorityIndex = new Map(priorityOrder.map((symbol, idx) => [symbol, idx]));
    const sorted = Array.from(elements)
      .filter(Boolean)
      .sort((a, b) => {
        const aIdx = priorityIndex.has(a) ? priorityIndex.get(a) : Number.POSITIVE_INFINITY;
        const bIdx = priorityIndex.has(b) ? priorityIndex.get(b) : Number.POSITIVE_INFINITY;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.localeCompare(b);
      });
    dom.filterComposition.innerHTML = "";
    sorted.forEach((element) => {
      const row = document.createElement("div");
      row.className = "hdd-comp-row";
      row.innerHTML = `
        <label>${escapeHtml(element)}</label>
        <input type="number" lang="en" data-comp-element="${escapeHtml(element)}" data-comp-bound="min" placeholder="min" step="0.01" min="0" />
        <input type="number" lang="en" data-comp-element="${escapeHtml(element)}" data-comp-bound="max" placeholder="max" step="0.01" min="0" />
        <button type="button" class="hdd-axis-filter-button hdd-axis-filter-button-comp" data-axis-trigger-kind="composition" data-axis-element="${escapeHtml(element)}" data-axis-label="${escapeHtml(
        `${element} [wt%]`
      )}" title="Make this composition element the X-axis.">Make X-Axis</button>
      `;
      dom.filterComposition.appendChild(row);
    });
    state.compositionFilters = {};
  }

  function setupAxisButtons() {
    mount.querySelectorAll(".hdd-axis-filter-button-block").forEach((button) => button.remove());
    const blocks = mount.querySelectorAll(".hdd-filter-block");
    blocks.forEach((block) => {
      if (!(block instanceof HTMLElement)) return;
      if (AXIS_DISABLED_BLOCK_IDS.has(block.id)) return;
      const summary = block.querySelector(":scope > summary");
      if (!summary) return;
      const listbox = block.querySelector(":scope > .hdd-filter-list");
      if (listbox?.id) {
        const def = AXIS_CATEGORICAL_DEFS[listbox.id];
        if (!def) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hdd-axis-filter-button hdd-axis-filter-button-block";
        button.textContent = "Make X-Axis";
        button.title = "Make this filter the X-axis.";
        button.dataset.axisTriggerKind = "categorical";
        button.dataset.axisListboxId = listbox.id;
        button.dataset.axisLabel = def.label;
        block.insertBefore(button, listbox);
        return;
      }
      if (block.id === "hdd-filter-block-year") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hdd-axis-filter-button hdd-axis-filter-button-block";
        button.textContent = "Make X-Axis";
        button.title = "Make year the X-axis.";
        button.dataset.axisTriggerKind = "numeric";
        button.dataset.axisRangeKey = "year";
        button.dataset.axisLabel = AXIS_NUMERIC_LABELS.year;
        const anchor = block.querySelector(".hdd-range-dual") || summary;
        if (anchor?.parentNode) {
          anchor.parentNode.insertBefore(button, anchor);
        } else {
          block.appendChild(button);
        }
        return;
      }
      const rangeInput = block.querySelector("input[data-range-key]");
      if (!rangeInput) return;
      const rangeKey = rangeInput.dataset.rangeKey;
      if (!rangeKey) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hdd-axis-filter-button hdd-axis-filter-button-block";
      button.textContent = "Make X-Axis";
      button.title = "Make this numeric filter the X-axis.";
      button.dataset.axisTriggerKind = "numeric";
      button.dataset.axisRangeKey = rangeKey;
      button.dataset.axisLabel = AXIS_NUMERIC_LABELS[rangeKey] || summary.textContent?.trim() || rangeKey;
      const toggleGroup = block.querySelector(".hdd-toggle-group");
      if (toggleGroup?.parentNode) {
        toggleGroup.parentNode.insertBefore(button, toggleGroup);
      } else {
        block.appendChild(button);
      }
    });
    syncAxisButtonsState();
  }

  function handleAxisButtonClick(event) {
    const button = event.target?.closest?.(".hdd-axis-filter-button");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    if (isAxisButtonActive(button)) {
      resetAxisMode();
      applyFilters({ preserveManual: true, replot: true });
      return;
    }
    const kind = button.dataset.axisTriggerKind;
    if (kind === "categorical") {
      const listboxId = button.dataset.axisListboxId;
      if (!listboxId) return;
      activateCategoricalAxis(listboxId);
      return;
    }
    if (kind === "numeric") {
      const rangeKey = button.dataset.axisRangeKey;
      if (!rangeKey) return;
      activateNumericAxis(rangeKey, button.dataset.axisLabel || AXIS_NUMERIC_LABELS[rangeKey] || rangeKey);
      return;
    }
    if (kind === "composition") {
      const element = button.dataset.axisElement;
      if (!element) return;
      activateCompositionAxis(element, button.dataset.axisLabel || `${element} [wt%]`);
    }
  }

  function isAxisButtonActive(button) {
    if (!button || state.axisMode !== AXIS_MODE_FILTER || !state.axisConfig) return false;
    const active = state.axisConfig;
    const kind = button.dataset.axisTriggerKind;
    if (kind === "categorical" && active.kind === "categorical") {
      return button.dataset.axisListboxId === active.listboxId;
    }
    if (kind === "numeric" && active.kind === "numeric") {
      return button.dataset.axisRangeKey === active.rangeKey;
    }
    if (kind === "composition" && active.kind === "composition") {
      return (button.dataset.axisElement || "").toLowerCase() === (active.element || "").toLowerCase();
    }
    return false;
  }

  function activateCategoricalAxis(listboxId, options = {}) {
    const { preserveManual = true, replot = true } = options;
    const def = AXIS_CATEGORICAL_DEFS[listboxId];
    const listbox = document.getElementById(listboxId);
    if (!def || !listbox) return;
    const mode = state.filterMode?.[def.modeKey] || "include";
    const selected = selectedValues(listbox);
    if (!selected.length && mode !== "exclude") {
      const available = getAvailableListboxValues(listbox);
      listbox.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.checked = available.includes(input.value);
      });
    }
    state.axisMode = AXIS_MODE_FILTER;
    state.axisConfig = {
      kind: "categorical",
      axisKey: def.axisKey,
      label: def.label,
      listboxId,
      filterKey: def.filterKey,
      modeKey: def.modeKey,
      metaKey: def.metaKey,
    };
    state.zoom = null;
    syncAxisModeUi();
    applyFilters({ preserveManual, replot });
  }

  function activateNumericAxis(rangeKey, label, options = {}) {
    const { preserveManual = true, replot = true } = options;
    state.axisMode = AXIS_MODE_FILTER;
    state.axisConfig = {
      kind: "numeric",
      axisKey: rangeKey,
      label: label || AXIS_NUMERIC_LABELS[rangeKey] || rangeKey,
      rangeKey,
    };
    state.zoom = null;
    syncAxisModeUi();
    applyFilters({ preserveManual, replot });
  }

  function activateCompositionAxis(element, label, options = {}) {
    const { preserveManual = true, replot = true } = options;
    const normalized = normalizeElementSymbol(element);
    if (!normalized) return;
    state.axisMode = AXIS_MODE_FILTER;
    state.axisConfig = {
      kind: "composition",
      axisKey: `composition_${normalized.toLowerCase()}`,
      label: label || `${normalized} [wt%]`,
      element: normalized,
    };
    state.zoom = null;
    syncAxisModeUi();
    applyFilters({ preserveManual, replot });
  }

  function resetAxisMode() {
    state.axisMode = AXIS_MODE_TEMPERATURE;
    state.axisConfig = null;
    state.axisTempExtent = null;
    state.axisSliceTempK = getDefaultAxisSliceTemperature();
    state.zoom = null;
    syncAxisModeUi();
  }

  function getAvailableListboxValues(listbox) {
    if (!listbox) return [];
    return Array.from(listbox.querySelectorAll(".hdd-filter-item"))
      .map((item) => {
        const input = item.querySelector("input[type='checkbox']");
        if (!input) return null;
        if (input.disabled && !input.checked) return null;
        if (item.classList.contains("is-hidden") && !input.checked) return null;
        return input.value;
      })
      .filter(Boolean);
  }

  function getDefaultAxisSliceTemperature() {
    const min = state.tempMin != null ? state.tempMin : state.tempDomain?.min;
    const max = state.tempMax != null ? state.tempMax : state.tempDomain?.max;
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      return min + (max - min) * 0.5;
    }
    return 293.15;
  }

  function toDisplayTemperature(tempK) {
    if (!Number.isFinite(tempK)) return null;
    return state.units === "C" ? tempK - 273.15 : tempK;
  }

  function toKelvinForUnits(value) {
    if (!Number.isFinite(value)) return null;
    return state.units === "C" ? value + 273.15 : value;
  }

  function formatTemperatureForUnits(tempK, decimals = 1) {
    const value = toDisplayTemperature(tempK);
    if (!Number.isFinite(value)) return "";
    const suffix = state.units === "C" ? "C" : "K";
    return `${value.toFixed(decimals)} ${suffix}`;
  }

  function formatTemperatureValueForUnits(tempK, decimals = 0) {
    const value = toDisplayTemperature(tempK);
    if (!Number.isFinite(value)) return "";
    return value.toFixed(decimals);
  }

  function formatTemperatureValueC(tempK, decimals = 0) {
    if (!Number.isFinite(tempK)) return "";
    return (tempK - 273.15).toFixed(decimals);
  }

  function getActiveTempBoundsC() {
    const domain = state.tempDomain || null;
    const minC =
      state.tempMin != null
        ? state.tempMin - 273.15
        : domain && Number.isFinite(domain.min)
          ? domain.min
          : null;
    const maxC =
      state.tempMax != null
        ? state.tempMax - 273.15
        : domain && Number.isFinite(domain.max)
          ? domain.max
          : null;
    return { minC, maxC };
  }

  function parseAxisLegendTempC(rawValue) {
    if (rawValue == null) return null;
    const normalized = String(rawValue)
      .trim()
      .replace(/,/g, ".")
      .replace(/[^\d.+\-eE]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function commitAxisLegendBoundEdit(which) {
    const target = which === "min" ? dom.axisTempLegendMin : dom.axisTempLegendMax;
    if (!target) return;
    const parsed = parseAxisLegendTempC(target.textContent);
    if (parsed == null) {
      updateAxisTemperatureLegend();
      return;
    }
    const bounds = getActiveTempBoundsC();
    const nextMin = which === "min" ? parsed : bounds.minC;
    const nextMax = which === "max" ? parsed : bounds.maxC;
    setTempFilter(nextMin, nextMax, true);
    applyFilters();
  }

  function bindAxisLegendBoundEditor(element, which) {
    if (!element) return;
    element.setAttribute("contenteditable", "plaintext-only");
    element.setAttribute("spellcheck", "false");
    element.classList.add("is-editable");
    let beforeEdit = "";
    element.addEventListener("focus", () => {
      beforeEdit = element.textContent || "";
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        element.blur();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        element.textContent = beforeEdit;
        element.blur();
      }
    });
    element.addEventListener("blur", () => {
      commitAxisLegendBoundEdit(which);
    });
  }

  function syncAxisButtonsState() {
    const active = state.axisMode === AXIS_MODE_FILTER ? state.axisConfig : null;
    mount.querySelectorAll(".hdd-axis-filter-button").forEach((button) => {
      button.classList.remove("is-active");
      if (!active) return;
      const kind = button.dataset.axisTriggerKind;
      if (kind === "categorical" && active.kind === "categorical") {
        if (button.dataset.axisListboxId === active.listboxId) {
          button.classList.add("is-active");
        }
        return;
      }
      if (kind === "numeric" && active.kind === "numeric") {
        if (button.dataset.axisRangeKey === active.rangeKey) {
          button.classList.add("is-active");
        }
        return;
      }
      if (kind === "composition" && active.kind === "composition") {
        if ((button.dataset.axisElement || "").toLowerCase() === (active.element || "").toLowerCase()) {
          button.classList.add("is-active");
        }
      }
    });
  }

  function syncAxisModeUi() {
    const axisActive = state.axisMode === AXIS_MODE_FILTER && state.axisConfig;
    if (dom.axisModePanel) {
      dom.axisModePanel.hidden = !axisActive;
    }
    if (dom.axisModeStatus) {
      dom.axisModeStatus.textContent = axisActive
        ? `X-axis: ${state.axisConfig.label}`
        : "X-axis: Temperature";
    }
    if (dom.axisReset) {
      dom.axisReset.hidden = !axisActive;
    }
    if (dom.axisSliceGroup) {
      const showSlice = axisActive && state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_SLICE;
      dom.axisSliceGroup.hidden = !showSlice;
    }
    if (dom.axisSliceTemp) {
      const temp = Number.isFinite(state.axisSliceTempK)
        ? state.axisSliceTempK
        : getDefaultAxisSliceTemperature();
      if (!Number.isFinite(state.axisSliceTempK)) {
        state.axisSliceTempK = temp;
      }
      const display = toDisplayTemperature(temp);
      dom.axisSliceTemp.value = Number.isFinite(display) ? display.toFixed(1) : "";
      dom.axisSliceTemp.disabled = !axisActive;
    }
    if (dom.axisSliceTitle) {
      dom.axisSliceTitle.textContent = `Slice Temperature [${state.units === "C" ? "°C" : "K"}]`;
    }
    if (dom.axisTempBehaviorButtons) {
      dom.axisTempBehaviorButtons.forEach((button) => {
        const isActive =
          (button.dataset.axisTempBehavior || AXIS_TEMP_BEHAVIOR_DISTRIBUTION) ===
          state.axisTempBehavior;
        button.classList.toggle("is-active", isActive);
        button.disabled = !axisActive;
      });
    }
    if (dom.axisTempBehaviorButtons?.length) {
      const behaviorGroup = dom.axisTempBehaviorButtons[0]?.closest(".hdd-toggle-group");
      if (behaviorGroup) behaviorGroup.hidden = !axisActive;
    }
    const isCategoricalAxis = axisActive && state.axisConfig.kind === "categorical";
    if (dom.axisXGroup) {
      dom.axisXGroup.classList.toggle("is-disabled", isCategoricalAxis);
      dom.axisXGroup.setAttribute("aria-disabled", isCategoricalAxis ? "true" : "false");
      dom.axisXGroup.hidden = isCategoricalAxis;
    }
    if (isCategoricalAxis && dom.axisXMin && dom.axisXMax && !state.zoom) {
      dom.axisXMin.value = "";
      dom.axisXMax.value = "";
    }
    if (dom.envelope) {
      dom.envelope.disabled = !!axisActive;
    }
    if (dom.forceScatterband) {
      dom.forceScatterband.disabled = !!axisActive;
    }
    if (dom.envelopeRow) {
      dom.envelopeRow.classList.toggle("is-disabled", !!axisActive);
      dom.envelopeRow.hidden = !!axisActive;
    }
    if (dom.forceScatterbandRow) {
      dom.forceScatterbandRow.classList.toggle("is-disabled", !!axisActive);
      dom.forceScatterbandRow.hidden = !!axisActive;
    }
    const showTempMapControls =
      !!axisActive && state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION;
    if (dom.axisTempPalette) {
      dom.axisTempPalette.hidden = !showTempMapControls;
    }
    syncAxisPaletteUi(showTempMapControls);
    syncAxisButtonsState();
    updateAxisTemperatureLegend();
  }

  function syncAxisPaletteUi(enabled = false) {
    const scaleName = getAxisColorScaleName(state.axisColorScale);
    dom.axisTempPaletteButtons?.forEach((button) => {
      const name = button.dataset.axisPalette;
      const isActive = name === scaleName;
      button.classList.toggle("is-active", isActive);
      button.disabled = !enabled;
      if (name) {
        button.style.setProperty("--hdd-palette-gradient", buildScaleGradient(name, "90deg"));
      }
    });
    if (dom.axisTempLegendBar) {
      dom.axisTempLegendBar.style.setProperty(
        "--hdd-palette-gradient",
        buildScaleGradient(scaleName, "90deg")
      );
      dom.axisTempLegendBar.disabled = !enabled;
      const scaleLabel = AXIS_COLOR_SCALES[scaleName]?.label || scaleName;
      dom.axisTempLegendBar.title = enabled
        ? `Temperature colormap: ${scaleLabel}. Click to cycle.`
        : `Temperature colormap: ${scaleLabel}`;
    }
  }

  function setAxisColorScale(name) {
    const normalized = getAxisColorScaleName(name);
    if (state.axisColorScale === normalized) return;
    state.axisColorScale = normalized;
    syncAxisPaletteUi(
      state.axisMode === AXIS_MODE_FILTER && state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION
    );
    updateAxisTemperatureLegend();
    if (state.axisMode === AXIS_MODE_FILTER && state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION) {
      plotSelectedSeries(true);
    }
  }

  function cycleAxisColorScale() {
    const keys = Object.keys(AXIS_COLOR_SCALES);
    if (!keys.length) return;
    const current = getAxisColorScaleName(state.axisColorScale);
    const index = keys.indexOf(current);
    const next = keys[(index + 1) % keys.length];
    setAxisColorScale(next);
  }

  function updateAxisTemperatureLegend() {
    if (!dom.axisTempLegend || !dom.axisTempLegendMin || !dom.axisTempLegendMax) return;
    const show =
      state.axisMode === AXIS_MODE_FILTER &&
      state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
      state.axisTempExtent &&
      Number.isFinite(state.axisTempExtent.min) &&
      Number.isFinite(state.axisTempExtent.max);
    dom.axisTempLegend.hidden = !show;
    if (!show) return;
    if (dom.axisTempLegendTitle) {
      dom.axisTempLegendTitle.textContent = "Temperature [°C]";
    }
    dom.axisTempLegendMin.textContent = formatTemperatureValueC(state.axisTempExtent.min, 0);
    dom.axisTempLegendMax.textContent = formatTemperatureValueC(state.axisTempExtent.max, 0);
    syncAxisPaletteUi(true);
  }

  function initializeFilterModes() {
    state.filterMode = {};
    dom.filterModeToggles?.forEach((toggle) => {
      const key = toggle.dataset.filterMode;
      if (!key) return;
      state.filterMode[key] = toggle.checked ? "exclude" : "include";
    });
    if (dom.filterMicrostructureMode && state.filterMode.materialMicrostructure == null) {
      state.filterMode.materialMicrostructure = dom.filterMicrostructureMode.checked ? "exclude" : "include";
    }
  }

  function toOptions(values = []) {
    return values
      .filter(Boolean)
      .map((value) => ({ value, label: String(value) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function collectMetaValues(seriesList, key) {
    const values = new Set();
    seriesList.forEach((entry) => {
      const set = entry.meta?.[key];
      if (!set) return;
      set.forEach((value) => {
        if (value == null) return;
        values.add(String(value));
      });
    });
    return Array.from(values);
  }

  function formatChemicalComposition(composition) {
    if (!composition || typeof composition !== "object") return null;
    const basis = composition.basis || "unknown";
    const values = composition.values || {};
    const parts = Object.keys(values)
      .sort()
      .map((key) => {
        const value = values[key];
        if (value == null || value === "") return null;
        const number = Number(value);
        const display = Number.isFinite(number) ? number.toPrecision(4) : String(value);
        return `${key}=${display}`;
      })
      .filter(Boolean);
    if (!parts.length) return null;
    return `${basis}: ${parts.join(", ")}`;
  }

  function clearFilters() {
    resetFiltersToDefaults({ replot: true, preserveManual: false });
  }

  function resetFiltersToDefaults(options = {}) {
    const { replot = true, preserveManual = false } = options;
    [
      dom.filterSource,
      dom.filterClass,
      dom.filterGrade,
      dom.filterMicrostructure,
      dom.filterPhase,
      dom.filterProcessing,
      dom.filterTags,
      dom.filterWeldProcess,
      dom.filterWeldLayer,
      dom.filterComposition,
      dom.filterChargingMethod,
      dom.filterCalculationModel,
      dom.filterSampleGeometry,
      dom.filterSurfaceCondition,
      dom.filterSurfaceFinishDetail,
      dom.filterCoated,
      dom.filterCoatingType,
      dom.filterDeformationHistory,
      dom.filterMechanicalLoading,
      dom.filterLoadingRegime,
      dom.filterElectrolyte,
      dom.filterControlMode,
      dom.filterPoisonAdditive,
      dom.filterGasComposition,
      dom.filterGasPurity,
      dom.filterTdaPeak,
      dom.filterSimsType,
      dom.filterDevEntryElectrolyte,
      dom.filterDevExitElectrolyte,
      dom.filterReported,
      dom.filterEffect,
      dom.filterMethod,
      dom.filterModel,
    ]
      .forEach((listbox) => {
        if (!listbox) return;
        listbox.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
          checkbox.checked = false;
        });
      });
    dom.filterModeToggles?.forEach((toggle) => {
      toggle.checked = true;
      const key = toggle.dataset.filterMode;
      if (key) state.filterMode[key] = "exclude";
    });
    if (dom.filterUnknownComposition) {
      dom.filterUnknownComposition.checked = false;
      state.includeUnknownComposition = false;
    }
    if (dom.literatureMode) {
      dom.literatureMode.value = "include";
      state.literatureMode = "include";
    }
    if (dom.weldedMode) {
      dom.weldedMode.value = "include";
      state.weldedMode = "include";
    }
    if (dom.filterComposition) {
      dom.filterComposition.querySelectorAll("input[type='number']").forEach((input) => {
        input.value = "";
      });
    }
    if (dom.numericRangeInputs) {
      dom.numericRangeInputs.forEach((input) => {
        input.value = "";
      });
    }
    state.compositionFilters = {};
    state.numericFilters = {};
    if (dom.search) dom.search.value = "";
    if (dom.tempMin) dom.tempMin.value = "";
    if (dom.tempMax) dom.tempMax.value = "";
    state.tempMin = null;
    state.tempMax = null;
    if (state.tempDomain) {
      updateTempHandles(state.tempDomain.min, state.tempDomain.max);
    }
    if (dom.yearMin) dom.yearMin.value = "";
    if (dom.yearMax) dom.yearMax.value = "";
    state.yearMin = null;
    state.yearMax = null;
    if (state.yearDomain) {
      updateYearHandles(state.yearDomain.min, state.yearDomain.max);
    }
    resetAxisMode();
    state.excludedSeries = new Set();
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    applyDefaultMaterialClassExclusions(true);
    applyFilters({ preserveManual, replot });
  }

  function applyFilters(options = {}) {
    const { preserveManual = false, replot = true } = options;
    const previousScrollTop = dom.panelLeft ? dom.panelLeft.scrollTop : null;
    const selectScroll = captureSelectScroll();
    const query = dom.search?.value.trim().toLowerCase() || "";
    const filters = {
      source: selectedValues(dom.filterSource),
      materialClass: selectedValues(dom.filterClass),
      materialGrade: selectedValues(dom.filterGrade),
      materialMicrostructure: selectedValues(dom.filterMicrostructure),
      materialPhase: selectedValues(dom.filterPhase),
      materialProcessing: selectedValues(dom.filterProcessing),
      materialTags: selectedValues(dom.filterTags),
      weldedProcess: selectedValues(dom.filterWeldProcess),
      weldedLayer: selectedValues(dom.filterWeldLayer),
      chemicalComposition: state.compositionFilters,
      chargingMethod: selectedValues(dom.filterChargingMethod),
      calculationModel: selectedValues(dom.filterCalculationModel),
      sampleGeometry: selectedValues(dom.filterSampleGeometry),
      surfaceCondition: selectedValues(dom.filterSurfaceCondition),
      surfaceFinishDetail: selectedValues(dom.filterSurfaceFinishDetail),
      coated: selectedValues(dom.filterCoated),
      coatingType: selectedValues(dom.filterCoatingType),
      deformationHistory: selectedValues(dom.filterDeformationHistory),
      mechanicalLoading: selectedValues(dom.filterMechanicalLoading),
      loadingRegime: selectedValues(dom.filterLoadingRegime),
      electrolyte: selectedValues(dom.filterElectrolyte),
      controlMode: selectedValues(dom.filterControlMode),
      poisonAdditive: selectedValues(dom.filterPoisonAdditive),
      gasComposition: selectedValues(dom.filterGasComposition),
      gasPurity: selectedValues(dom.filterGasPurity),
      tdaPeakAnalysis: selectedValues(dom.filterTdaPeak),
      simsType: selectedValues(dom.filterSimsType),
      devEntryElectrolyte: selectedValues(dom.filterDevEntryElectrolyte),
      devExitElectrolyte: selectedValues(dom.filterDevExitElectrolyte),
      reportedAs: selectedValues(dom.filterReported),
      studiedEffects: selectedValues(dom.filterEffect),
      measurementMethod: selectedValues(dom.filterMethod),
      modelType: selectedValues(dom.filterModel),
      tempMin: state.tempMin,
      tempMax: state.tempMax,
      yearMin: state.yearMin,
      yearMax: state.yearMax,
      includeUnconfirmed: state.includeUnconfirmed,
      literatureMode: state.literatureMode,
      weldedMode: state.weldedMode,
      includeUnknownComposition: state.includeUnknownComposition,
      numeric: state.numericFilters,
      mode: state.filterMode,
    };

    const filtered = state.seriesList.filter((entry) =>
      entryMatchesFilters(entry, filters, "")
    );
    const visible = query
      ? filtered.filter((entry) => entryMatchesFilters(entry, filters, query))
      : filtered;
    state.filteredList = filtered;
    state.lastFilters = filters;
    state.lastQuery = query;
    if (!preserveManual) {
      setSelectionMode("filtered");
    }
    if (state.selectionMode === "filtered") {
      const filteredIds = filtered.map((entry) => entry.id);
      const additional = Array.from(state.additionalSelectionIds || []).filter((id) =>
        state.seriesById.has(id)
      );
      state.additionalSelectionIds = new Set(additional);
      state.selected = new Set(filteredIds.concat(additional));
    }

    syncSelectionToVisible(filtered);
    renderSeriesList(visible);
    updateFilterAvailability(filters, "");
    syncAxisButtonsState();
    updateSummary(currentSeries);
    if (replot) {
      plotSelectedSeries(true);
    }
    restoreSelectScroll(selectScroll);
    if (dom.panelLeft && previousScrollTop != null) {
      requestAnimationFrame(() => {
        dom.panelLeft.scrollTop = previousScrollTop;
      });
    }
  }

  function setAdvancedFiltersVisible(open) {
    if (!dom.advancedFilters) return;
    if (open) {
      moveCoreFiltersToBuckets();
      dom.advancedFilters.removeAttribute("hidden");
      setCoreCollapsible(true);
    } else {
      dom.advancedFilters.setAttribute("hidden", "true");
      moveCoreFiltersToCore();
      setCoreCollapsible(false);
      setActiveSection(dom.coreSection);
    }
  }

  function moveCoreFiltersToBuckets() {
    if (!dom.bucketMaterial || !dom.bucketConditions || !dom.bucketMethod || !dom.bucketAnalysis) return;
    if (dom.filterBlockClass) dom.bucketMaterial.appendChild(dom.filterBlockClass);
    if (dom.filterBlockGrade) dom.bucketMaterial.appendChild(dom.filterBlockGrade);
    if (dom.filterBlockMethod) dom.bucketConditions.appendChild(dom.filterBlockMethod);
    if (dom.filterBlockYear) dom.bucketAnalysis.appendChild(dom.filterBlockYear);
    if (dom.filterBlockSource) dom.bucketAnalysis.appendChild(dom.filterBlockSource);
  }

  function moveCoreFiltersToCore() {
    if (!dom.coreFiltersBody) return;
    const ordered = [
      dom.filterBlockClass,
      dom.filterBlockGrade,
      dom.filterBlockMethod,
      dom.filterBlockTemp,
      dom.filterBlockLiterature,
      dom.filterBlockYear,
      dom.filterBlockSource,
    ];
    ordered.forEach((block) => {
      if (block) dom.coreFiltersBody.appendChild(block);
    });
  }

  function setCoreCollapsible(enabled) {
    if (!dom.coreSection) return;
    if (enabled) {
      dom.coreSection.dataset.locked = "false";
      return;
    }
    dom.coreSection.dataset.locked = "true";
    dom.coreSection.setAttribute("open", "true");
  }

  function setActiveSection(section) {
    if (!section || !dom.sections) return;
    dom.sections.forEach((item) => item.classList.remove("is-active"));
    section.classList.add("is-active");
  }

  function collapseCoreFilterBlocks() {
    const root = dom.coreFiltersBody || dom.coreSection;
    if (!root) return;
    root.querySelectorAll(".hdd-filter-block[open]").forEach((block) => {
      block.removeAttribute("open");
    });
  }

  function captureSelectScroll() {
    const map = new Map();
    [
      dom.filterSource,
      dom.filterClass,
      dom.filterGrade,
      dom.filterMicrostructure,
      dom.filterPhase,
      dom.filterProcessing,
      dom.filterTags,
      dom.filterWeldProcess,
      dom.filterWeldLayer,
      dom.filterComposition,
      dom.filterChargingMethod,
      dom.filterCalculationModel,
      dom.filterSampleGeometry,
      dom.filterSurfaceCondition,
      dom.filterSurfaceFinishDetail,
      dom.filterCoated,
      dom.filterCoatingType,
      dom.filterDeformationHistory,
      dom.filterMechanicalLoading,
      dom.filterLoadingRegime,
      dom.filterElectrolyte,
      dom.filterControlMode,
      dom.filterPoisonAdditive,
      dom.filterGasComposition,
      dom.filterGasPurity,
      dom.filterTdaPeak,
      dom.filterSimsType,
      dom.filterDevEntryElectrolyte,
      dom.filterDevExitElectrolyte,
      dom.filterReported,
      dom.filterEffect,
      dom.filterMethod,
      dom.filterModel,
    ].forEach((listbox) => {
      if (!listbox) return;
      map.set(listbox, listbox.scrollTop);
    });
    return map;
  }

  function restoreSelectScroll(map) {
    if (!map) return;
    map.forEach((scrollTop, listbox) => {
      if (!listbox) return;
      requestAnimationFrame(() => {
        listbox.scrollTop = scrollTop;
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function syncSelectionToVisible(visibleList) {
    const visibleIds = new Set(visibleList.map((entry) => entry.id));
    const keepIds =
      state.selectionMode === "filtered"
        ? new Set([...visibleIds, ...Array.from(state.additionalSelectionIds || [])])
        : visibleIds;
    let changed = false;
    state.selected.forEach((id) => {
      if (state.selectionMode === "filtered" && state.additionalSelectionIds?.has(id)) {
        return;
      }
      if (!visibleIds.has(id)) {
        state.selected.delete(id);
        changed = true;
      }
    });
    if (changed) {
      currentSeries = currentSeries.filter((series) => keepIds.has(series.id));
    }
  }

  function entryMatchesFilters(entry, filters, query, ignoreKey = null) {
    const mode = filters.mode || {};
    const microMode =
      mode.materialMicrostructure ||
      (dom.filterMicrostructureMode?.checked ? "exclude" : "include");
    if (state.excludedSeries?.has(entry.id)) return false;
    if (ignoreKey !== "plottingStatus" && !isPlottingAllowed(entry, filters.includeUnconfirmed)) return false;
    if (filters.literatureMode === "exclude" && hasLiteratureCompilation(entry)) return false;
    if (filters.literatureMode === "only" && !hasLiteratureCompilation(entry)) return false;
    if (filters.weldedMode === "exclude" && hasWeldedMaterial(entry)) return false;
    if (filters.weldedMode === "only" && !hasWeldedMaterial(entry)) return false;
    if (ignoreKey !== "source" && !matchesValue(filters.source, entry.sourceId, mode.source)) return false;
    if (ignoreKey !== "materialClass" && !matchesSet(filters.materialClass, entry.meta.material_class, mode.materialClass)) return false;
    if (ignoreKey !== "materialGrade" && !matchesSet(filters.materialGrade, entry.meta.material_grade, mode.materialGrade)) return false;
    if (ignoreKey !== "materialMicrostructure" && !matchesSet(filters.materialMicrostructure, entry.meta.material_microstructure, microMode)) return false;
    if (ignoreKey !== "materialPhase" && !matchesSet(filters.materialPhase, entry.meta.material_phase, mode.materialPhase)) return false;
    if (ignoreKey !== "materialProcessing" && !matchesSet(filters.materialProcessing, entry.meta.material_processing, mode.materialProcessing)) return false;
    if (ignoreKey !== "materialTags" && !matchesSet(filters.materialTags, entry.meta.material_tags, mode.materialTags)) return false;
    if (ignoreKey !== "weldedProcess" && !matchesSet(filters.weldedProcess, entry.meta.welded_process, mode.weldedProcess)) return false;
    if (ignoreKey !== "weldedLayer" && !matchesSet(filters.weldedLayer, entry.meta.welded_layer, mode.weldedLayer)) return false;
    if (ignoreKey !== "chemicalComposition" && !matchesComposition(filters.chemicalComposition, entry.compositionRanges, filters.includeUnknownComposition)) return false;
    if (ignoreKey !== "chargingMethod" && !matchesSet(filters.chargingMethod, entry.meta.charging_method, mode.chargingMethod)) return false;
    if (ignoreKey !== "calculationModel" && !matchesSet(filters.calculationModel, entry.meta.calculation_model, mode.calculationModel)) return false;
    if (ignoreKey !== "sampleGeometry" && !matchesSet(filters.sampleGeometry, entry.meta.sample_geometry, mode.sampleGeometry)) return false;
    if (ignoreKey !== "surfaceCondition" && !matchesSet(filters.surfaceCondition, entry.meta.surface_condition, mode.surfaceCondition)) return false;
    if (ignoreKey !== "surfaceFinishDetail" && !matchesSet(filters.surfaceFinishDetail, entry.meta.surface_finish_detail, mode.surfaceFinishDetail)) return false;
    if (ignoreKey !== "coated" && !matchesSet(filters.coated, entry.meta.coated, mode.coated)) return false;
    if (ignoreKey !== "coatingType" && !matchesSet(filters.coatingType, entry.meta.coating_type, mode.coatingType)) return false;
    if (ignoreKey !== "deformationHistory" && !matchesSet(filters.deformationHistory, entry.meta.deformation_history, mode.deformationHistory)) return false;
    if (ignoreKey !== "mechanicalLoading" && !matchesSet(filters.mechanicalLoading, entry.meta.mechanical_loading, mode.mechanicalLoading)) return false;
    if (ignoreKey !== "loadingRegime" && !matchesSet(filters.loadingRegime, entry.meta.loading_regime, mode.loadingRegime)) return false;
    if (ignoreKey !== "electrolyte" && !matchesSet(filters.electrolyte, entry.meta.electrolyte, mode.electrolyte)) return false;
    if (ignoreKey !== "controlMode" && !matchesSet(filters.controlMode, entry.meta.control_mode, mode.controlMode)) return false;
    if (ignoreKey !== "poisonAdditive" && !matchesSet(filters.poisonAdditive, entry.meta.poison_additive, mode.poisonAdditive)) return false;
    if (ignoreKey !== "gasComposition" && !matchesSet(filters.gasComposition, entry.meta.gas_composition, mode.gasComposition)) return false;
    if (ignoreKey !== "gasPurity" && !matchesSet(filters.gasPurity, entry.meta.gas_purity, mode.gasPurity)) return false;
    if (ignoreKey !== "tdaPeakAnalysis" && !matchesSet(filters.tdaPeakAnalysis, entry.meta.tda_peak_analysis, mode.tdaPeakAnalysis)) return false;
    if (ignoreKey !== "simsType" && !matchesSet(filters.simsType, entry.meta.sims_type, mode.simsType)) return false;
    if (ignoreKey !== "devEntryElectrolyte" && !matchesSet(filters.devEntryElectrolyte, entry.meta.dev_entry_electrolyte, mode.devEntryElectrolyte)) return false;
    if (ignoreKey !== "devExitElectrolyte" && !matchesSet(filters.devExitElectrolyte, entry.meta.dev_exit_electrolyte, mode.devExitElectrolyte)) return false;
    if (ignoreKey !== "reportedAs" && !matchesSet(filters.reportedAs, entry.meta.reported_as, mode.reportedAs)) return false;
    if (ignoreKey !== "studiedEffects" && !matchesSet(filters.studiedEffects, entry.meta.studied_effects, mode.studiedEffects)) return false;
    if (ignoreKey !== "measurementMethod" && !matchesSet(filters.measurementMethod, entry.meta.measurement_method, mode.measurementMethod)) return false;
    if (ignoreKey !== "modelType" && !matchesSet(filters.modelType, entry.meta.model_type, mode.modelType)) return false;
    if (ignoreKey !== "tempRange" && !matchesTemperatureRange(entry, filters.tempMin, filters.tempMax)) return false;
    if (ignoreKey !== "yearRange" && !matchesYearRange(entry, filters.yearMin, filters.yearMax)) return false;
    if (ignoreKey !== "chargingTemperature" && !matchesNumericRange(entry.numericRanges?.charging_temperature_c, filters.numeric?.charging_temperature_c?.min, filters.numeric?.charging_temperature_c?.max)) return false;
    if (ignoreKey !== "chargingDuration" && !matchesNumericRange(entry.numericRanges?.charging_duration_h, filters.numeric?.charging_duration_h?.min, filters.numeric?.charging_duration_h?.max)) return false;
    if (ignoreKey !== "characteristicLength" && !matchesNumericRange(entry.numericRanges?.characteristic_length_mm, filters.numeric?.characteristic_length_mm?.min, filters.numeric?.characteristic_length_mm?.max)) return false;
    if (ignoreKey !== "coatingThickness" && !matchesNumericRange(entry.numericRanges?.coating_thickness_um, filters.numeric?.coating_thickness_um?.min, filters.numeric?.coating_thickness_um?.max)) return false;
    if (ignoreKey !== "preStrain" && !matchesNumericRange(entry.numericRanges?.pre_strain_percent, filters.numeric?.pre_strain_percent?.min, filters.numeric?.pre_strain_percent?.max)) return false;
    if (ignoreKey !== "coldReduction" && !matchesNumericRange(entry.numericRanges?.cold_reduction_percent, filters.numeric?.cold_reduction_percent?.min, filters.numeric?.cold_reduction_percent?.max)) return false;
    if (ignoreKey !== "appliedStress" && !matchesNumericRange(entry.numericRanges?.applied_stress_mpa, filters.numeric?.applied_stress_mpa?.min, filters.numeric?.applied_stress_mpa?.max)) return false;
    if (ignoreKey !== "appliedStrain" && !matchesNumericRange(entry.numericRanges?.applied_strain_percent, filters.numeric?.applied_strain_percent?.min, filters.numeric?.applied_strain_percent?.max)) return false;
    if (ignoreKey !== "weldingT85" && !matchesNumericRange(entry.numericRanges?.welding_t85, filters.numeric?.welding_t85?.min, filters.numeric?.welding_t85?.max)) return false;
    if (ignoreKey !== "currentDensity" && !matchesNumericRange(entry.numericRanges?.current_density_mA_per_cm2, filters.numeric?.current_density_mA_per_cm2?.min, filters.numeric?.current_density_mA_per_cm2?.max)) return false;
    if (ignoreKey !== "appliedPotential" && !matchesNumericRange(entry.numericRanges?.applied_potential_v, filters.numeric?.applied_potential_v?.min, filters.numeric?.applied_potential_v?.max)) return false;
    if (ignoreKey !== "gasPressure" && !matchesNumericRange(entry.numericRanges?.gas_pressure_bar, filters.numeric?.gas_pressure_bar?.min, filters.numeric?.gas_pressure_bar?.max)) return false;
    if (ignoreKey !== "heatingRate" && !matchesNumericRange(entry.numericRanges?.heating_rate_k_per_min, filters.numeric?.heating_rate_k_per_min?.min, filters.numeric?.heating_rate_k_per_min?.max)) return false;
    if (ignoreKey !== "extractionTemperature" && !matchesNumericRange(entry.numericRanges?.extraction_temperature_c, filters.numeric?.extraction_temperature_c?.min, filters.numeric?.extraction_temperature_c?.max)) return false;

    if (query) {
      const haystack = [
        entry.label,
        entry.groupId,
        entry.seriesLabel,
        entry.seriesKey,
        entry.sourceTitle,
        entry.materialLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  }

  function isPlottingAllowed(entry, includeUnconfirmed) {
    if (includeUnconfirmed) return true;
    const statuses = entry.meta?.plotting_status;
    if (!statuses || !statuses.size) return true;
    for (const status of statuses) {
      if (String(status).toLowerCase() !== "plot") return false;
    }
    return true;
  }

  function matchesTemperatureRange(entry, min, max) {
    if (min == null && max == null) return true;
    const segments = entry.segments || [];
    for (const segment of segments) {
      const range = segment.temperature_validity_K || [];
      if (range.length !== 2) continue;
      const segMin = Number(range[0]);
      const segMax = Number(range[1]);
      if (!Number.isFinite(segMin) || !Number.isFinite(segMax)) continue;
      if (min != null && segMax < min) continue;
      if (max != null && segMin > max) continue;
      return true;
    }
    return false;
  }

  function matchesYearRange(entry, min, max) {
    if (min == null && max == null) return true;
    const year = entry.sourceYear;
    if (!Number.isFinite(year)) return false;
    if (min != null && year < min) return false;
    if (max != null && year > max) return false;
    return true;
  }

  function matchesNumericRange(range, min, max) {
    if (min == null && max == null) return true;
    if (!range) return false;
    if (min != null && range.max < min) return false;
    if (max != null && range.min > max) return false;
    return true;
  }

  function evaluateEntryFilterFailures(entry, filters, query) {
    const failedKeys = [];
    const mode = filters.mode || {};
    const microMode =
      mode.materialMicrostructure ||
      (dom.filterMicrostructureMode?.checked ? "exclude" : "include");

    if (!isPlottingAllowed(entry, filters.includeUnconfirmed)) {
      return { globalOk: false, failedKeys };
    }
    if (filters.literatureMode === "exclude" && hasLiteratureCompilation(entry)) {
      return { globalOk: false, failedKeys };
    }
    if (filters.literatureMode === "only" && !hasLiteratureCompilation(entry)) {
      return { globalOk: false, failedKeys };
    }
    if (filters.weldedMode === "exclude" && hasWeldedMaterial(entry)) {
      return { globalOk: false, failedKeys };
    }
    if (filters.weldedMode === "only" && !hasWeldedMaterial(entry)) {
      return { globalOk: false, failedKeys };
    }

    if (!matchesValue(filters.source, entry.sourceId, mode.source)) failedKeys.push("source");
    if (!matchesSet(filters.materialClass, entry.meta.material_class, mode.materialClass)) failedKeys.push("materialClass");
    if (!matchesSet(filters.materialGrade, entry.meta.material_grade, mode.materialGrade)) failedKeys.push("materialGrade");
    if (!matchesSet(filters.materialMicrostructure, entry.meta.material_microstructure, microMode)) failedKeys.push("materialMicrostructure");
    if (!matchesSet(filters.materialPhase, entry.meta.material_phase, mode.materialPhase)) failedKeys.push("materialPhase");
    if (!matchesSet(filters.materialProcessing, entry.meta.material_processing, mode.materialProcessing)) failedKeys.push("materialProcessing");
    if (!matchesSet(filters.materialTags, entry.meta.material_tags, mode.materialTags)) failedKeys.push("materialTags");
    if (!matchesSet(filters.weldedProcess, entry.meta.welded_process, mode.weldedProcess)) failedKeys.push("weldedProcess");
    if (!matchesSet(filters.weldedLayer, entry.meta.welded_layer, mode.weldedLayer)) failedKeys.push("weldedLayer");
    if (!matchesComposition(filters.chemicalComposition, entry.compositionRanges, filters.includeUnknownComposition)) failedKeys.push("chemicalComposition");
    if (!matchesSet(filters.chargingMethod, entry.meta.charging_method, mode.chargingMethod)) failedKeys.push("chargingMethod");
    if (!matchesSet(filters.calculationModel, entry.meta.calculation_model, mode.calculationModel)) failedKeys.push("calculationModel");
    if (!matchesSet(filters.sampleGeometry, entry.meta.sample_geometry, mode.sampleGeometry)) failedKeys.push("sampleGeometry");
    if (!matchesSet(filters.surfaceCondition, entry.meta.surface_condition, mode.surfaceCondition)) failedKeys.push("surfaceCondition");
    if (!matchesSet(filters.surfaceFinishDetail, entry.meta.surface_finish_detail, mode.surfaceFinishDetail)) failedKeys.push("surfaceFinishDetail");
    if (!matchesSet(filters.coated, entry.meta.coated, mode.coated)) failedKeys.push("coated");
    if (!matchesSet(filters.coatingType, entry.meta.coating_type, mode.coatingType)) failedKeys.push("coatingType");
    if (!matchesSet(filters.deformationHistory, entry.meta.deformation_history, mode.deformationHistory)) failedKeys.push("deformationHistory");
    if (!matchesSet(filters.mechanicalLoading, entry.meta.mechanical_loading, mode.mechanicalLoading)) failedKeys.push("mechanicalLoading");
    if (!matchesSet(filters.loadingRegime, entry.meta.loading_regime, mode.loadingRegime)) failedKeys.push("loadingRegime");
    if (!matchesSet(filters.electrolyte, entry.meta.electrolyte, mode.electrolyte)) failedKeys.push("electrolyte");
    if (!matchesSet(filters.controlMode, entry.meta.control_mode, mode.controlMode)) failedKeys.push("controlMode");
    if (!matchesSet(filters.poisonAdditive, entry.meta.poison_additive, mode.poisonAdditive)) failedKeys.push("poisonAdditive");
    if (!matchesSet(filters.gasComposition, entry.meta.gas_composition, mode.gasComposition)) failedKeys.push("gasComposition");
    if (!matchesSet(filters.gasPurity, entry.meta.gas_purity, mode.gasPurity)) failedKeys.push("gasPurity");
    if (!matchesSet(filters.tdaPeakAnalysis, entry.meta.tda_peak_analysis, mode.tdaPeakAnalysis)) failedKeys.push("tdaPeakAnalysis");
    if (!matchesSet(filters.simsType, entry.meta.sims_type, mode.simsType)) failedKeys.push("simsType");
    if (!matchesSet(filters.devEntryElectrolyte, entry.meta.dev_entry_electrolyte, mode.devEntryElectrolyte)) failedKeys.push("devEntryElectrolyte");
    if (!matchesSet(filters.devExitElectrolyte, entry.meta.dev_exit_electrolyte, mode.devExitElectrolyte)) failedKeys.push("devExitElectrolyte");
    if (!matchesSet(filters.reportedAs, entry.meta.reported_as, mode.reportedAs)) failedKeys.push("reportedAs");
    if (!matchesSet(filters.studiedEffects, entry.meta.studied_effects, mode.studiedEffects)) failedKeys.push("studiedEffects");
    if (!matchesSet(filters.measurementMethod, entry.meta.measurement_method, mode.measurementMethod)) failedKeys.push("measurementMethod");
    if (!matchesSet(filters.modelType, entry.meta.model_type, mode.modelType)) failedKeys.push("modelType");

    if (!matchesTemperatureRange(entry, filters.tempMin, filters.tempMax)) return { globalOk: false, failedKeys };
    if (!matchesYearRange(entry, filters.yearMin, filters.yearMax)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.charging_temperature_c, filters.numeric?.charging_temperature_c?.min, filters.numeric?.charging_temperature_c?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.charging_duration_h, filters.numeric?.charging_duration_h?.min, filters.numeric?.charging_duration_h?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.characteristic_length_mm, filters.numeric?.characteristic_length_mm?.min, filters.numeric?.characteristic_length_mm?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.coating_thickness_um, filters.numeric?.coating_thickness_um?.min, filters.numeric?.coating_thickness_um?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.pre_strain_percent, filters.numeric?.pre_strain_percent?.min, filters.numeric?.pre_strain_percent?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.cold_reduction_percent, filters.numeric?.cold_reduction_percent?.min, filters.numeric?.cold_reduction_percent?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.applied_stress_mpa, filters.numeric?.applied_stress_mpa?.min, filters.numeric?.applied_stress_mpa?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.applied_strain_percent, filters.numeric?.applied_strain_percent?.min, filters.numeric?.applied_strain_percent?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.welding_t85, filters.numeric?.welding_t85?.min, filters.numeric?.welding_t85?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.current_density_mA_per_cm2, filters.numeric?.current_density_mA_per_cm2?.min, filters.numeric?.current_density_mA_per_cm2?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.applied_potential_v, filters.numeric?.applied_potential_v?.min, filters.numeric?.applied_potential_v?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.gas_pressure_bar, filters.numeric?.gas_pressure_bar?.min, filters.numeric?.gas_pressure_bar?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.heating_rate_k_per_min, filters.numeric?.heating_rate_k_per_min?.min, filters.numeric?.heating_rate_k_per_min?.max)) return { globalOk: false, failedKeys };
    if (!matchesNumericRange(entry.numericRanges?.extraction_temperature_c, filters.numeric?.extraction_temperature_c?.min, filters.numeric?.extraction_temperature_c?.max)) return { globalOk: false, failedKeys };

    if (query) {
      const haystack = [
        entry.label,
        entry.groupId,
        entry.seriesLabel,
        entry.seriesKey,
        entry.sourceTitle,
        entry.materialLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return { globalOk: false, failedKeys };
    }

    return { globalOk: true, failedKeys };
  }

  function updateFilterAvailability(filters, query) {
    const availability = {
      source: new Set(),
      materialClass: new Set(),
      materialGrade: new Set(),
      materialMicrostructure: new Set(),
      materialPhase: new Set(),
      materialProcessing: new Set(),
      materialTags: new Set(),
      weldedProcess: new Set(),
      weldedLayer: new Set(),
      chemicalComposition: new Set(),
      chargingMethod: new Set(),
      calculationModel: new Set(),
      sampleGeometry: new Set(),
      surfaceCondition: new Set(),
      surfaceFinishDetail: new Set(),
      coated: new Set(),
      coatingType: new Set(),
      deformationHistory: new Set(),
      mechanicalLoading: new Set(),
      loadingRegime: new Set(),
      electrolyte: new Set(),
      controlMode: new Set(),
      poisonAdditive: new Set(),
      gasComposition: new Set(),
      gasPurity: new Set(),
      tdaPeakAnalysis: new Set(),
      simsType: new Set(),
      devEntryElectrolyte: new Set(),
      devExitElectrolyte: new Set(),
      reportedAs: new Set(),
      studiedEffects: new Set(),
      measurementMethod: new Set(),
      modelType: new Set(),
    };

    const addValues = (key, values) => {
      if (!values || !values.length) return;
      const bucket = availability[key];
      if (!bucket) return;
      values.forEach((value) => bucket.add(String(value)));
    };

    const valuesFromSet = (set) => {
      if (!set || !set.size) return [];
      return Array.from(set).map((value) => String(value));
    };

    const buildEntryValues = (entry) => ({
      source: entry.sourceId ? [String(entry.sourceId)] : [],
      materialClass: valuesFromSet(entry.meta.material_class),
      materialGrade: valuesFromSet(entry.meta.material_grade),
      materialMicrostructure: valuesFromSet(entry.meta.material_microstructure),
      materialPhase: valuesFromSet(entry.meta.material_phase),
      materialProcessing: valuesFromSet(entry.meta.material_processing),
      materialTags: valuesFromSet(entry.meta.material_tags),
      weldedProcess: valuesFromSet(entry.meta.welded_process),
      weldedLayer: valuesFromSet(entry.meta.welded_layer),
      chemicalComposition: valuesFromSet(entry.meta.chemical_composition),
      chargingMethod: valuesFromSet(entry.meta.charging_method),
      calculationModel: valuesFromSet(entry.meta.calculation_model),
      sampleGeometry: valuesFromSet(entry.meta.sample_geometry),
      surfaceCondition: valuesFromSet(entry.meta.surface_condition),
      surfaceFinishDetail: valuesFromSet(entry.meta.surface_finish_detail),
      coated: valuesFromSet(entry.meta.coated),
      coatingType: valuesFromSet(entry.meta.coating_type),
      deformationHistory: valuesFromSet(entry.meta.deformation_history),
      mechanicalLoading: valuesFromSet(entry.meta.mechanical_loading),
      loadingRegime: valuesFromSet(entry.meta.loading_regime),
      electrolyte: valuesFromSet(entry.meta.electrolyte),
      controlMode: valuesFromSet(entry.meta.control_mode),
      poisonAdditive: valuesFromSet(entry.meta.poison_additive),
      gasComposition: valuesFromSet(entry.meta.gas_composition),
      gasPurity: valuesFromSet(entry.meta.gas_purity),
      tdaPeakAnalysis: valuesFromSet(entry.meta.tda_peak_analysis),
      simsType: valuesFromSet(entry.meta.sims_type),
      devEntryElectrolyte: valuesFromSet(entry.meta.dev_entry_electrolyte),
      devExitElectrolyte: valuesFromSet(entry.meta.dev_exit_electrolyte),
      reportedAs: valuesFromSet(entry.meta.reported_as),
      studiedEffects: valuesFromSet(entry.meta.studied_effects),
      measurementMethod: valuesFromSet(entry.meta.measurement_method),
      modelType: valuesFromSet(entry.meta.model_type),
    });

    state.seriesList.forEach((entry) => {
      const check = evaluateEntryFilterFailures(entry, filters, query);
      if (!check.globalOk) return;
      const values = buildEntryValues(entry);
      if (!check.failedKeys.length) {
        Object.keys(values).forEach((key) => addValues(key, values[key]));
        return;
      }
      if (check.failedKeys.length === 1) {
        const key = check.failedKeys[0];
        addValues(key, values[key]);
      }
    });

    const applyAvailabilityIfVisible = (listbox, values) => {
      if (!listbox) return;
      updateSelectAvailability(listbox, values);
    };

    applyAvailabilityIfVisible(dom.filterSource, availability.source);
    applyAvailabilityIfVisible(dom.filterClass, availability.materialClass);
    applyAvailabilityIfVisible(dom.filterGrade, availability.materialGrade);
    applyAvailabilityIfVisible(dom.filterMicrostructure, availability.materialMicrostructure);
    applyAvailabilityIfVisible(dom.filterPhase, availability.materialPhase);
    applyAvailabilityIfVisible(dom.filterProcessing, availability.materialProcessing);
    applyAvailabilityIfVisible(dom.filterTags, availability.materialTags);
    applyAvailabilityIfVisible(dom.filterWeldProcess, availability.weldedProcess);
    applyAvailabilityIfVisible(dom.filterWeldLayer, availability.weldedLayer);
    applyAvailabilityIfVisible(dom.filterChargingMethod, availability.chargingMethod);
    applyAvailabilityIfVisible(dom.filterCalculationModel, availability.calculationModel);
    applyAvailabilityIfVisible(dom.filterSampleGeometry, availability.sampleGeometry);
    applyAvailabilityIfVisible(dom.filterSurfaceCondition, availability.surfaceCondition);
    applyAvailabilityIfVisible(dom.filterSurfaceFinishDetail, availability.surfaceFinishDetail);
    applyAvailabilityIfVisible(dom.filterCoated, availability.coated);
    applyAvailabilityIfVisible(dom.filterCoatingType, availability.coatingType);
    applyAvailabilityIfVisible(dom.filterDeformationHistory, availability.deformationHistory);
    applyAvailabilityIfVisible(dom.filterMechanicalLoading, availability.mechanicalLoading);
    applyAvailabilityIfVisible(dom.filterLoadingRegime, availability.loadingRegime);
    applyAvailabilityIfVisible(dom.filterElectrolyte, availability.electrolyte);
    applyAvailabilityIfVisible(dom.filterControlMode, availability.controlMode);
    applyAvailabilityIfVisible(dom.filterPoisonAdditive, availability.poisonAdditive);
    applyAvailabilityIfVisible(dom.filterGasComposition, availability.gasComposition);
    applyAvailabilityIfVisible(dom.filterGasPurity, availability.gasPurity);
    applyAvailabilityIfVisible(dom.filterTdaPeak, availability.tdaPeakAnalysis);
    applyAvailabilityIfVisible(dom.filterSimsType, availability.simsType);
    applyAvailabilityIfVisible(dom.filterDevEntryElectrolyte, availability.devEntryElectrolyte);
    applyAvailabilityIfVisible(dom.filterDevExitElectrolyte, availability.devExitElectrolyte);
    applyAvailabilityIfVisible(dom.filterReported, availability.reportedAs);
    applyAvailabilityIfVisible(dom.filterEffect, availability.studiedEffects);
    applyAvailabilityIfVisible(dom.filterMethod, availability.measurementMethod);
    applyAvailabilityIfVisible(dom.filterModel, availability.modelType);
  }

  function updateSelectAvailability(listbox, available) {
    if (!listbox) return;
    const items = listbox.querySelectorAll(".hdd-filter-item");
    let checkedCount = 0;
    items.forEach((item) => {
      const checkbox = item.querySelector("input");
      if (!checkbox) return;
      if (checkbox.checked) {
        checkedCount += 1;
        checkbox.disabled = false;
        item.classList.remove("is-disabled", "is-hidden");
        return;
      }
      const isAvailable = available.size ? available.has(checkbox.value) : false;
      checkbox.disabled = !isAvailable;
      item.classList.toggle("is-disabled", !isAvailable);
      item.classList.toggle("is-hidden", !isAvailable);
    });
    const emptyMessage = listbox.querySelector(".hdd-filter-empty");
    const shouldShowEmpty = available.size === 0 && checkedCount === 0;
    if (shouldShowEmpty) {
      if (!emptyMessage) {
        const message = document.createElement("div");
        message.className = "hdd-filter-empty";
        message.textContent = "No options match current filters.";
        listbox.appendChild(message);
      }
    } else if (emptyMessage) {
      emptyMessage.remove();
    }
    adjustFilterListHeight(listbox);
  }

  function clampNonNegativeNumberInput(input) {
    if (!input) return null;
    if (input.value && input.value.includes(",")) {
      input.value = input.value.replace(/,/g, ".");
    }
    const value = parseNumber(input.value);
    if (value == null) return null;
    if (value < 0) {
      input.value = "0";
      return 0;
    }
    return value;
  }

  function handleCompositionInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const element = input.dataset.compElement;
    if (!element) return;
    const esc = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(element) : element.replace(/["\\]/g, "\\$&");
    const minInput = dom.filterComposition?.querySelector(
      `input[data-comp-element="${esc}"][data-comp-bound="min"]`
    );
    const maxInput = dom.filterComposition?.querySelector(
      `input[data-comp-element="${esc}"][data-comp-bound="max"]`
    );
    let minVal = clampNonNegativeNumberInput(minInput);
    let maxVal = clampNonNegativeNumberInput(maxInput);
    if (minVal != null && maxVal != null && minVal > maxVal) {
      if (input.dataset.compBound === "min") {
        maxVal = minVal;
        if (maxInput) maxInput.value = String(maxVal);
      } else if (input.dataset.compBound === "max") {
        minVal = maxVal;
        if (minInput) minInput.value = String(minVal);
      }
    }
    if (minVal == null && maxVal == null) {
      delete state.compositionFilters[element];
    } else {
      state.compositionFilters[element] = { min: minVal, max: maxVal };
    }
    applyFilters();
  }

  function handleNumericFilterInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const key = input.dataset.rangeKey;
    const bound = input.dataset.rangeBound;
    if (!key || !bound) return;
    if (input.value && input.value.includes(",")) {
      input.value = input.value.replace(/,/g, ".");
    }
    let value = parseNumber(input.value);
    if (value != null && NON_NEGATIVE_RANGE_KEYS.has(key) && value < 0) {
      value = 0;
      input.value = "0";
    }
    if (!state.numericFilters[key]) {
      state.numericFilters[key] = { min: null, max: null };
    }
    state.numericFilters[key][bound] = value;
    const current = state.numericFilters[key];
    if (current.min != null && current.max != null && current.min > current.max) {
      const swap = current.min;
      current.min = current.max;
      current.max = swap;
      const minInput = dom.numericRangeInputs
        ? Array.from(dom.numericRangeInputs).find(
            (el) => el.dataset.rangeKey === key && el.dataset.rangeBound === "min"
          )
        : null;
      const maxInput = dom.numericRangeInputs
        ? Array.from(dom.numericRangeInputs).find(
            (el) => el.dataset.rangeKey === key && el.dataset.rangeBound === "max"
          )
        : null;
      if (minInput) minInput.value = current.min;
      if (maxInput) maxInput.value = current.max;
    }
    applyFilters();
  }

  function bindFilterListResize(listbox) {
    if (!listbox || listbox.dataset.resizeBound) return;
    listbox.dataset.resizeBound = "true";
    listbox.addEventListener("pointerup", () => {
      listbox.dataset.userResized = "true";
    });
  }

  function adjustFilterListHeight(listbox) {
    if (!listbox || listbox.dataset.userResized === "true") return;
    const items = Array.from(listbox.querySelectorAll(".hdd-filter-item:not(.is-hidden)"));
    const style = getComputedStyle(listbox);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const gap = parseFloat(style.rowGap || style.gap) || 0;
    if (!items.length) {
      listbox.style.height = `${FILTER_LIST_MIN_HEIGHT}px`;
      return;
    }
    const itemHeight = items[0].getBoundingClientRect().height || 0;
    const total =
      items.length * itemHeight + Math.max(0, items.length - 1) * gap + paddingTop + paddingBottom;
    const clamped = Math.min(FILTER_LIST_DEFAULT_HEIGHT, Math.max(FILTER_LIST_MIN_HEIGHT, total));
    listbox.style.height = `${Math.round(clamped)}px`;
  }

  function renderSeriesList(list) {
    if (!dom.list) return;
    dom.list.innerHTML = "";
    if (!list.length) {
      dom.list.innerHTML = '<p class="hdd-empty">No series found.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach((entry) => {
      const option = document.createElement("label");
      option.className = "hdd-group-option";
      const inputId = `hdd-series-${entry.id}`;
      option.setAttribute("for", inputId);
      option.innerHTML = `
        <input type="checkbox" id="${inputId}" value="${entry.id}" ${
        state.selected.has(entry.id) ? "checked" : ""
      } />
        <div>
          <strong>${entry.label}</strong>
          <div class="hdd-group-meta">
            ${entry.sourceTitle}
            ${entry.seriesLabel ? ` · ${entry.seriesLabel}` : ""}
            ${formatRange(entry.temperatureRange)}
            ${entry.materialLabel ? ` · ${entry.materialLabel}` : ""}
          </div>
        </div>
      `;
      fragment.appendChild(option);
    });
    dom.list.appendChild(fragment);
  }

  function selectAllVisible() {
    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
    if (!checkboxes || !checkboxes.length) return;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      state.selected.add(checkbox.value);
    });
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    setSelectionMode("manual");
    updateSummary();
    plotSelectedSeries(true);
  }

  function deselectAllVisible() {
    const checkboxes = dom.list?.querySelectorAll("input[type='checkbox']");
    if (checkboxes && checkboxes.length) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        state.selected.delete(checkbox.value);
      });
    }
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    setSelectionMode("manual");
    plotSelectedSeries(true);
  }

  function showAllSeriesList() {
    if (dom.search) dom.search.value = "";
    renderSeriesList(state.seriesList);
  }

  function handleSelectionChange(event) {
    if (!event.target || !event.target.matches("input[type='checkbox']")) return;
    const id = event.target.value;
    if (event.target.checked) {
      state.selected.add(id);
    } else {
      state.selected.delete(id);
    }
    if (state.selectionMode !== "manual") {
      setSelectionMode("manual");
    }
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    updateSummary();
    plotSelectedSeries(true);
  }

  function handleSummaryToggle(event) {
    const button = event.target?.closest?.(".hdd-summary-toggle");
    if (!button) return;
    event.preventDefault();
    state.summaryExpanded = !state.summaryExpanded;
    updateSummary();
  }

  function getFilteredSelectionEntries() {
    const map = new Map();
    (state.filteredList || []).forEach((entry) => {
      if (!entry?.id) return;
      map.set(entry.id, entry);
    });
    (state.additionalSelectionIds || new Set()).forEach((id) => {
      if (map.has(id)) return;
      const entry = state.seriesById.get(id);
      if (!entry) return;
      map.set(id, entry);
    });
    return Array.from(map.values());
  }

  function updateSummary(seriesList = null) {
    if (!dom.summary) return;
    if (state.summaryModalMode === "report" && dom.summaryModal?.classList?.contains("is-open")) {
      return;
    }
    if (state.selectionMode === "manual") {
      if (!state.selected.size) {
        state.summaryExpanded = false;
        dom.summary.innerHTML =
          "<strong>No series selected.</strong><p>Use Select Series to choose datasets for plotting.</p>";
        return;
      }
    }
    const allItems =
      state.selectionMode === "manual"
        ? Array.from(state.selected)
            .map((id) => state.seriesById.get(id))
            .filter(Boolean)
        : getFilteredSelectionEntries();
    if (!allItems.length) {
      state.summaryExpanded = false;
      dom.summary.innerHTML =
        "<strong>No series match the filters.</strong><p>Adjust filters or use Select Series to override.</p>";
      return;
    }
    const plottedSeries = seriesList && seriesList.length ? seriesList : currentSeries;
    const seriesOrder = plottedSeries.length
      ? plottedSeries.map((series, index) => ({ id: series.id, index }))
      : allItems.map((series, index) => ({ id: series.id, index }));
    const orderMap = new Map(seriesOrder.map((item) => [item.id, item.index]));

    const orderedItems = allItems
      .map((series, fallbackIndex) => ({
        series,
        index: orderMap.has(series.id) ? orderMap.get(series.id) : fallbackIndex,
        fallbackIndex,
      }))
      .sort((a, b) => a.index - b.index);

    const previewLimit = 6;
    const maxPreview = state.summaryExpanded ? orderedItems.length : previewLimit;
    const previewItems = orderedItems.slice(0, maxPreview);
    const allItemLines = previewItems.map((item) => {
      const series = item.series;
      const range = formatRangeValueForUnits(series.temperatureRange, state.units) || "range unknown";
      const ordinal = orderMap.has(series.id) ? orderMap.get(series.id) + 1 : item.fallbackIndex + 1;
      const sourceMeta = state.dataset?.sources?.[series.sourceId] || null;
      const citation = buildCitation(sourceMeta, series);
      const groupLabel = series.label || series.groupId || "Series";
      const titleSource = series.sourceTitle || "Source";
      const titleLabel = series.label || groupLabel;
      const titleText = `${titleSource} - ${titleLabel}`;
      const metaText = range;
      return `
        <li class="hdd-summary-item">
          <div class="hdd-summary-title">
            <span class="hdd-ordinal">${ordinal}.</span>
            <strong>${escapeHtml(titleText)}</strong>
          </div>
          <div class="hdd-summary-meta">${escapeHtml(metaText)}</div>
          <div class="hdd-summary-cite">${escapeHtml(cleanCsvField(citation))}</div>
        </li>
      `;
    });
    const selectedCount = allItems.length;
    const plottedCount = plottedSeries.length;
    const needsToggle = selectedCount > previewLimit;
    const toggleLabel = state.summaryExpanded ? "Show less" : `Show all (${selectedCount})`;
    const toggleButton = needsToggle
      ? `<button type="button" class="hdd-summary-toggle">${toggleLabel}</button>`
      : "";
    const hasAdditionalSelections =
      state.selectionMode === "filtered" && (state.additionalSelectionIds?.size || 0) > 0;
    const modeLabel =
      state.selectionMode === "manual"
        ? "selection"
        : hasAdditionalSelections
          ? "filters + additional selections"
          : "filters";
    const statusLine =
      plottedCount && plottedCount !== selectedCount
        ? `<p>${plottedCount} plotted from current ${modeLabel}.</p>`
        : `<p>${selectedCount} series ${
            state.selectionMode === "manual"
              ? "selected"
              : hasAdditionalSelections
                ? "match filters or imported additions"
                : "match filters"
          }.</p>`;

    dom.summary.innerHTML = `
      <div class="hdd-summary-header">
        <strong>${state.selectionMode === "manual" ? "Selected Series" : "Filtered Series"}</strong>
        ${toggleButton}
      </div>
      ${statusLine}
      <ul>${allItemLines.join("")}</ul>
    `;
    if (state.summaryModalMode === "series") {
      setSummaryModalTitle(state.selectionMode === "manual" ? "Selected Series" : "Filtered Series");
    }
  }

  function toggleScale(button) {
    state.scale = button.dataset.scale === "linear" ? "linear" : "log";
    syncScaleButtonsUi();
    state.zoom = null;
    plotSelectedSeries();
  }

  function toggleUnits(button) {
    state.units = button.dataset.unit === "C" ? "C" : "K";
    syncUnitButtonsUi();
    syncAxisModeUi();
    state.zoom = null;
    plotSelectedSeries();
  }

  function syncScaleButtonsUi() {
    dom.scaleButtons?.forEach((btn) => {
      const scale = btn.dataset.scale === "linear" ? "linear" : "log";
      btn.classList.toggle("is-active", scale === state.scale);
    });
  }

  function syncUnitButtonsUi() {
    dom.unitButtons?.forEach((btn) => {
      const unit = btn.dataset.unit === "K" ? "K" : "C";
      btn.classList.toggle("is-active", unit === state.units);
    });
  }

  function setSelectionMode(mode) {
    state.selectionMode = mode === "manual" ? "manual" : "filtered";
  }

  function toggleSeriesDrawer(open) {
    if (!dom.seriesDrawer) return;
    dom.seriesDrawer.classList.toggle("is-open", open);
    dom.seriesDrawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      applyFilters({ preserveManual: true, replot: false });
    }
  }

  function plotSelectedSeries(force = false) {
    const axisFilterMode = state.axisMode === AXIS_MODE_FILTER && state.axisConfig;
    const useManual = state.selectionMode === "manual";
    const baseIds = useManual
      ? Array.from(state.selected)
      : Array.from(
          new Set(
            (state.filteredList || [])
              .map((entry) => entry.id)
              .concat(Array.from(state.additionalSelectionIds || []))
          )
        );
    const scatterbandIds =
      !axisFilterMode && state.forceScatterband && Array.isArray(state.scatterbandIds)
        ? state.scatterbandIds
        : [];
    const ids = Array.from(new Set(baseIds.concat(scatterbandIds)));
    if (!ids.length) {
      renderEmptyChart(
        useManual
          ? "Select at least one series."
          : "No series match the current filters."
      );
      currentSeries = [];
      updateSummary();
      return;
    }
    state.preserveAxis =
      !axisFilterMode && state.forceScatterband && !state.zoom && !!lastPlotContext;
    const series = axisFilterMode ? prepareAxisSeries(ids) : prepareSeries(ids);
    if (!series.length) {
      renderEmptyChart("No valid samples within the requested range.");
      currentSeries = [];
      updateSummary();
      return;
    }
    currentSeries = series;
    if (axisFilterMode) {
      renderAxisChart(series);
    } else {
      renderChart(series);
    }
    updateSummary(series);
    if (force) setStatus("Plot refreshed.", "ok");
  }

  function prepareSeries(seriesIds) {
    const clampMin = state.tempMin;
    const clampMax = state.tempMax;
    const result = [];
    const legendOrder = new Map();
    let legendCount = 0;

    seriesIds.forEach((seriesId, index) => {
      const entry = state.seriesById.get(seriesId);
      if (!entry) return;
      const sourceKey = entry.sourceId || entry.sourceTitle || entry.groupId || entry.id;
      const legendKey = state.legendBySource ? sourceKey : entry.id;
      let legendIndex = legendOrder.get(legendKey);
      if (legendIndex == null) {
        legendIndex = legendCount;
        legendOrder.set(legendKey, legendCount);
        legendCount += 1;
      }
      const samples = sampleSeries(entry, clampMin, clampMax);
      const lineSegments = Array.isArray(samples.lineSegments) ? samples.lineSegments : [];
      const pointSamples = Array.isArray(samples.points) ? samples.points : [];
      if (!lineSegments.length && !pointSamples.length) return;

      const axisLineSegments = lineSegments.map((segment) =>
        segment.map((sample) => ({
          temperature_K: sample.temperature_K,
          temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
          x_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
          diffusivity: sample.diffusivity,
        }))
      );

      const axisLine = axisLineSegments.flat();

      const axisPoints = pointSamples.map((sample) => ({
        temperature_K: sample.temperature_K,
        temperature_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
        x_axis: state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K,
        diffusivity: sample.diffusivity,
      }));

      const color = state.monochrome ? "#111111" : COLORS[legendIndex % COLORS.length];
      const legendLabel = state.legendBySource
        ? entry.sourceTitle || entry.label || entry.groupId || "Source"
        : buildSourceLabel(entry);
      result.push({
        id: entry.id,
        label: entry.label,
        seriesLabel: entry.seriesLabel,
        color,
        legendKey,
        legendLabel,
        legendIndex,
        axisLine,
        axisLineSegments,
        axisPoints,
        descriptor: entry,
      });
    });

    return result;
  }

  function prepareAxisSeries(seriesIds) {
    const axisConfig = state.axisConfig;
    if (!axisConfig) return [];
    const clampMin = state.tempMin;
    const clampMax = state.tempMax;
    const result = [];
    const legendOrder = new Map();
    let legendCount = 0;
    const bucketInfo =
      axisConfig.kind === "categorical" ? resolveCategoricalAxisBuckets(axisConfig) : null;
    const behavior = state.axisTempBehavior || AXIS_TEMP_BEHAVIOR_DISTRIBUTION;

    seriesIds.forEach((seriesId) => {
      const entry = state.seriesById.get(seriesId);
      if (!entry) return;
      const assignments = resolveAxisAssignments(entry, axisConfig, bucketInfo);
      if (!assignments.length) return;
      const sourceKey = entry.sourceId || entry.sourceTitle || entry.groupId || entry.id;
      const legendKey = state.legendBySource ? sourceKey : entry.id;
      let legendIndex = legendOrder.get(legendKey);
      if (legendIndex == null) {
        legendIndex = legendCount;
        legendOrder.set(legendKey, legendCount);
        legendCount += 1;
      }
      const color = state.monochrome ? "#111111" : COLORS[legendIndex % COLORS.length];
      const legendLabel = state.legendBySource
        ? entry.sourceTitle || entry.label || entry.groupId || "Source"
        : buildSourceLabel(entry);

      assignments.forEach((assignment, idx) => {
        const samples =
          behavior === AXIS_TEMP_BEHAVIOR_SLICE
            ? sampleAxisSlice(entry, state.axisSliceTempK)
            : sampleAxisDistribution(entry, clampMin, clampMax);
        if (!samples.length) return;
        const mapped = samples
          .map((sample) => {
            const xBase = assignment.xValue;
            if (!Number.isFinite(xBase)) return null;
            return {
              x_axis: xBase,
              temperature_axis: xBase,
              temperature_K: sample.temperature_K,
              diffusivity: sample.diffusivity,
              axis_value: assignment.label,
              axis_value_numeric: assignment.xValue,
              axis_range_min: assignment.xMin,
              axis_range_max: assignment.xMax,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.temperature_K - b.temperature_K);
        if (!mapped.length) return;
        const traceId = `${entry.id}::${assignment.key || assignment.label || idx}`;
        const axisLineSegments =
          behavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION && mapped.length > 1
            ? [mapped]
            : [];
        result.push({
          id: entry.id,
          traceId,
          label: entry.label,
          seriesLabel: entry.seriesLabel,
          color,
          legendKey,
          legendLabel,
          legendIndex,
          axisLine: mapped,
          axisLineSegments,
          axisPoints: mapped,
          descriptor: entry,
          axisBucket: assignment.bucket,
          axisBase: assignment.xValue,
        });
      });
    });

    if (axisConfig.kind === "categorical") {
      applyCategoricalAxisJitter(result, bucketInfo);
    }

    return result;
  }

  function resolveCategoricalAxisBuckets(axisConfig) {
    const listbox = document.getElementById(axisConfig.listboxId);
    const allValues = getAvailableListboxValues(listbox);
    const selected = selectedValues(listbox);
    const mode = state.filterMode?.[axisConfig.modeKey] || "include";
    let buckets;
    if (mode === "exclude") {
      if (!selected.length) {
        buckets = allValues.slice();
      } else {
        const selectedSet = new Set(selected);
        buckets = allValues.filter((value) => !selectedSet.has(value));
      }
    } else {
      buckets = selected.length ? selected.slice() : allValues.slice();
    }
    const normalized = Array.from(new Set(buckets.filter(Boolean)));
    return {
      values: normalized,
      indexByValue: new Map(normalized.map((value, index) => [value, index])),
    };
  }

  function resolveAxisAssignments(entry, axisConfig, bucketInfo) {
    if (axisConfig.kind === "categorical") {
      const values = valuesFromMetaSet(entry.meta?.[axisConfig.metaKey]);
      if (!values.length || !bucketInfo?.values?.length) return [];
      const assignments = [];
      values.forEach((value) => {
        const bucketIndex = bucketInfo.indexByValue.get(value);
        if (!Number.isFinite(bucketIndex)) return;
        assignments.push({
          key: value,
          label: value,
          bucket: value,
          xValue: bucketIndex,
          xMin: bucketIndex,
          xMax: bucketIndex,
        });
      });
      return assignments;
    }
    if (axisConfig.kind === "numeric") {
      const range = resolveNumericAxisRange(entry, axisConfig.rangeKey);
      if (!range) return [];
      const scalar = rangeToAxisScalar(range, range.kind);
      const hasVisualRange = range.kind === "interval";
      return [
        {
          key: axisConfig.rangeKey,
          label: formatAxisNumericValue(scalar, axisConfig.label),
          bucket: null,
          xValue: scalar,
          xMin: hasVisualRange ? range.min : scalar,
          xMax: hasVisualRange ? range.max : scalar,
        },
      ];
    }
    if (axisConfig.kind === "composition") {
      const range = resolveCompositionAxisRange(entry, axisConfig.element);
      if (!range) return [];
      const scalar = rangeToAxisScalar(range, range.kind);
      const hasVisualRange = range.kind === "interval";
      return [
        {
          key: axisConfig.element,
          label: formatAxisNumericValue(scalar, axisConfig.label),
          bucket: null,
          xValue: scalar,
          xMin: hasVisualRange ? range.min : scalar,
          xMax: hasVisualRange ? range.max : scalar,
        },
      ];
    }
    return [];
  }

  function valuesFromMetaSet(set) {
    if (!set || !set.size) return [];
    return Array.from(set).map((value) => String(value));
  }

  function resolveNumericAxisRange(entry, rangeKey) {
    if (rangeKey === "year") {
      if (!Number.isFinite(entry.sourceYear)) return null;
      const year = Number(entry.sourceYear);
      return { min: year, max: year, kind: "exact" };
    }
    const range = entry.numericRanges?.[rangeKey];
    if (!range) return null;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max, kind: min !== max ? "interval" : "exact" };
  }

  function resolveCompositionAxisRange(entry, element) {
    if (!entry.compositionRanges || !element) return null;
    const key = Object.keys(entry.compositionRanges).find(
      (name) => normalizeElementSymbol(name) === normalizeElementSymbol(element)
    );
    if (!key) return null;
    const range = entry.compositionRanges[key];
    if (!range) return null;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return {
      min,
      max,
      kind: range.kind || (min !== max ? "interval" : "exact"),
    };
  }

  function rangeToAxisScalar(range, kind = "exact") {
    if (!range) return null;
    if (kind === "upper_bound") return range.max;
    if (kind === "lower_bound") return range.min;
    if (range.min === range.max) return range.min;
    return (range.min + range.max) * 0.5;
  }

  function formatAxisNumericValue(value, label) {
    if (!Number.isFinite(value)) return label || "";
    const abs = Math.abs(value);
    if (abs >= 100) return value.toFixed(1);
    if (abs >= 10) return value.toFixed(2);
    if (abs >= 1) return value.toFixed(3);
    return value.toFixed(4);
  }

  function sampleAxisDistribution(entry, clampMin, clampMax) {
    const samples = [];
    entry.segments.forEach((segment) => {
      const model = segment.model || {};
      if (model.type === "single_point") {
        const temperature = resolveSinglePointTemperature(segment);
        const diffusivity = Number(model.diffusivity_mm2_per_s);
        if (!Number.isFinite(temperature) || !Number.isFinite(diffusivity) || diffusivity <= 0) return;
        if (!isWithinClamp(temperature, clampMin, clampMax)) return;
        samples.push({ temperature_K: temperature, diffusivity });
        return;
      }
      if (model.type === "table_points") {
        normalizeTablePoints(model.points, clampMin, clampMax).forEach((point) => {
          samples.push({ temperature_K: point.temperature_K, diffusivity: point.diffusivity });
        });
        return;
      }
      const segMin = clampTemperature(segment.temperature_validity_K?.[0], clampMin);
      const segMax = clampTemperature(segment.temperature_validity_K?.[1], clampMax, true);
      if (!(segMax > segMin)) return;
      const steps = Math.max(2, AXIS_DISTRIBUTION_SAMPLES);
      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const temperature = segMin + (segMax - segMin) * ratio;
        const diffusivity = evaluateModel(model, temperature);
        if (diffusivity && diffusivity > 0) {
          samples.push({ temperature_K: temperature, diffusivity });
        }
      }
    });
    return samples.sort((a, b) => a.temperature_K - b.temperature_K);
  }

  function sampleAxisSlice(entry, requestedTempK) {
    const temperature =
      Number.isFinite(requestedTempK) ? requestedTempK : getDefaultAxisSliceTemperature();
    let best = null;
    entry.segments.forEach((segment) => {
      if (best) return;
      const model = segment.model || {};
      if (model.type === "single_point") {
        const pointTemp = resolveSinglePointTemperature(segment);
        const diffusivity = Number(model.diffusivity_mm2_per_s);
        if (!Number.isFinite(pointTemp) || !Number.isFinite(diffusivity) || diffusivity <= 0) return;
        if (Math.abs(pointTemp - temperature) > AXIS_SINGLE_POINT_EPSILON_K) return;
        best = { temperature_K: pointTemp, diffusivity };
        return;
      }
      const range = segment.temperature_validity_K || [];
      if (range.length !== 2) return;
      if (!(temperature >= range[0] && temperature <= range[1])) return;
      const diffusivity = evaluateModel(model, temperature);
      if (!Number.isFinite(diffusivity) || diffusivity <= 0) return;
      best = { temperature_K: temperature, diffusivity };
    });
    return best ? [best] : [];
  }

  function applyCategoricalAxisJitter(series, bucketInfo) {
    if (!Array.isArray(series) || !series.length || !bucketInfo?.values?.length) return;
    const grouped = new Map();
    series.forEach((item) => {
      if (!item.axisBucket) return;
      if (!grouped.has(item.axisBucket)) grouped.set(item.axisBucket, []);
      grouped.get(item.axisBucket).push(item);
    });
    grouped.forEach((items) => {
      items.sort((a, b) => {
        const keyA = `${a.legendIndex}:${a.id}:${a.traceId || ""}`;
        const keyB = `${b.legendIndex}:${b.id}:${b.traceId || ""}`;
        return keyA.localeCompare(keyB);
      });
      const count = items.length;
      items.forEach((item, index) => {
        const offset =
          count <= 1
            ? 0
            : ((index / (count - 1)) * 2 - 1) * (AXIS_BUCKET_JITTER_SPAN * 0.5);
        item.axisLine.forEach((sample) => {
          sample.x_axis = sample.x_axis + offset;
          sample.temperature_axis = sample.x_axis;
        });
      });
    });
  }

  function sampleSeries(entry, clampMin, clampMax) {
    const lineSegments = [];
    const linePoints = [];
    const points = [];
    let usedSinglePointAsLine = false;

    entry.segments.forEach((segment, idx) => {
      const model = segment.model || {};
      const plottingStyle = segment.plotting?.style?.toLowerCase?.() || "";
      if (model.type === "single_point") {
        const temperature = resolveSinglePointTemperature(segment);
        if (temperature == null) return;
        if (!isWithinClamp(temperature, clampMin, clampMax)) return;
        if (plottingStyle === "line") {
          usedSinglePointAsLine = true;
        }
        const target = plottingStyle === "line" ? linePoints : points;
        target.push({ temperature_K: temperature, diffusivity: model.diffusivity_mm2_per_s });
        return;
      }
      if (model.type === "table_points") {
        const tablePoints = normalizeTablePoints(model.points, clampMin, clampMax);
        if (!tablePoints.length) return;
        if (plottingStyle === "line") {
          lineSegments.push(tablePoints);
        } else {
          points.push(...tablePoints);
        }
        return;
      }

      const segMin = clampTemperature(segment.temperature_validity_K?.[0], clampMin);
      const segMax = clampTemperature(segment.temperature_validity_K?.[1], clampMax, true);
      if (!(segMax > segMin)) return;
      const steps = Math.max(2, SAMPLES_PER_SEGMENT);
      const segmentLine = [];
      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const temperature = segMin + (segMax - segMin) * ratio;
        const diffusivity = evaluateModel(model, temperature);
        if (diffusivity && diffusivity > 0) {
          segmentLine.push({ temperature_K: temperature, diffusivity });
        }
      }
      if (segmentLine.length) {
        lineSegments.push(segmentLine);
      }
    });

    if (usedSinglePointAsLine && linePoints.length > 1) {
      linePoints.sort((a, b) => a.temperature_K - b.temperature_K);
    }

    if (linePoints.length) {
      lineSegments.push(linePoints);
    }

    return { lineSegments, points };
  }

  function resolveSinglePointTemperature(segment) {
    const range = segment.temperature_validity_K;
    if (Array.isArray(range) && range.length === 2 && isFiniteNumber(range[0]) && isFiniteNumber(range[1])) {
      if (range[0] === range[1]) return range[0];
      failLoudly(
        `Single-point entry ${segment.entry_id} has a temperature range (${range[0]}–${range[1]} K). ` +
          "Expected [T, T] for single_point entries."
      );
      return null;
    }
    const modelTemp = segment.model?.temperature_K;
    if (isFiniteNumber(modelTemp)) return Number(modelTemp);
    failLoudly(`Single-point entry ${segment.entry_id} is missing temperature information.`);
    return null;
  }

  function normalizeTablePoints(points, clampMin, clampMax) {
    if (!Array.isArray(points)) return [];
    return points
      .map((point) => ({
        temperature_K: Number(point?.temperature_K),
        diffusivity: Number(point?.diffusivity_mm2_per_s),
      }))
      .filter(
        (point) =>
          isFiniteNumber(point.temperature_K) &&
          isFiniteNumber(point.diffusivity) &&
          point.diffusivity > 0 &&
          isWithinClamp(point.temperature_K, clampMin, clampMax)
      )
      .sort((a, b) => a.temperature_K - b.temperature_K);
  }

  function evaluateModel(model, temperature_K) {
    if (!model) return null;
    if (model.type === "arrhenius") {
      const D0 = model.D0_mm2_per_s;
      const Q = model.Q_J_per_mol;
      const R = model.R_J_per_molK || R_DEFAULT;
      return D0 * Math.exp(-Q / (R * temperature_K));
    }
    if (model.type === "power") {
      if (model.input !== "theta_C") return null;
      const theta_C = temperature_K - 273.15;
      const A = model.A_mm2_per_s != null ? model.A_mm2_per_s : model.A;
      if (!isFiniteNumber(A) || !isFiniteNumber(model.n)) return null;
      return A * Math.pow(theta_C, model.n);
    }
    if (model.type === "table_points") {
      const points = Array.isArray(model.points) ? model.points : [];
      const normalized = points
        .map((point) => ({
          temperature_K: Number(point?.temperature_K),
          diffusivity: Number(point?.diffusivity_mm2_per_s),
        }))
        .filter(
          (point) =>
            isFiniteNumber(point.temperature_K) &&
            isFiniteNumber(point.diffusivity) &&
            point.diffusivity > 0
        )
        .sort((a, b) => a.temperature_K - b.temperature_K);
      if (normalized.length < 2) return null;
      const minT = normalized[0].temperature_K;
      const maxT = normalized[normalized.length - 1].temperature_K;
      if (temperature_K < minT || temperature_K > maxT) return null;
      for (let i = 0; i < normalized.length - 1; i++) {
        const a = normalized[i];
        const b = normalized[i + 1];
        if (temperature_K === a.temperature_K) return a.diffusivity;
        if (temperature_K === b.temperature_K) return b.diffusivity;
        if (temperature_K > a.temperature_K && temperature_K < b.temperature_K) {
          const t = (temperature_K - a.temperature_K) / (b.temperature_K - a.temperature_K);
          const logA = Math.log10(a.diffusivity);
          const logB = Math.log10(b.diffusivity);
          return Math.pow(10, logA + t * (logB - logA));
        }
      }
      return null;
    }
    return null;
  }

  function renderEmptyChart(message) {
    if (!dom.chart) return;
    dom.chart.innerHTML = `<div>${message}</div>`;
    currentCanvas = null;
    hoverCache = null;
    state.axisTempExtent = null;
    updateAxisTemperatureLegend();
  }

  function renderChart(series) {
    if (!dom.chart) return;
    const temps = series.flatMap((s) => s.axisLine.map((p) => p.temperature_axis).concat(s.axisPoints.map((p) => p.temperature_axis)));
    const values = series.flatMap((s) => s.axisLine.map((p) => p.diffusivity).concat(s.axisPoints.map((p) => p.diffusivity)));

    if (!temps.length || !values.length) {
      renderEmptyChart("No samples available for plotting.");
      return;
    }

    const canvas = document.createElement("canvas");
    const chartStyles = getComputedStyle(dom.chart);
    const paddingX =
      (parseFloat(chartStyles.paddingLeft) || 0) +
      (parseFloat(chartStyles.paddingRight) || 0);
    const paddingY =
      (parseFloat(chartStyles.paddingTop) || 0) +
      (parseFloat(chartStyles.paddingBottom) || 0);
    // Use clientWidth to avoid border inflation causing incremental growth.
    const containerWidth = dom.chart.clientWidth || 960;
    const width = Math.max(320, Math.round(containerWidth - paddingX));
    const isNarrow = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
    const layoutScale = Math.max(0.85, Math.min(1, width / 860));
    const baseRatio = isNarrow ? 0.75 : 0.5;
    let height = Math.round(width * baseRatio);
    const minHeight = isNarrow ? 300 : 240;
    height = Math.max(minHeight, height);
    if (isNarrow) {
      const containerHeight = dom.chart.clientHeight || 0;
      const available = Math.max(0, Math.round(containerHeight - paddingY));
      if (available > height) {
        height = available;
      }
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    dom.chart.innerHTML = "";
    dom.chart.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    currentCanvas = canvas;
    const theme = getThemeColors();

    const dataMinX = Math.min(...temps);
    const dataMaxX = Math.max(...temps);
    const positiveValues = values.filter((v) => v > 0);
    const dataMinY = Math.min(...positiveValues);
    const dataMaxY = Math.max(...positiveValues);

    let axisMinX = dataMinX;
    let axisMaxX = dataMaxX;
    let axisMinY = dataMinY;
    let axisMaxY = dataMaxY;

    if (state.zoom) {
      axisMinX = Number.isFinite(state.zoom.xMin) ? state.zoom.xMin : dataMinX;
      axisMaxX = Number.isFinite(state.zoom.xMax) ? state.zoom.xMax : dataMaxX;
      axisMinY = Number.isFinite(state.zoom.yMin) ? state.zoom.yMin : dataMinY;
      axisMaxY = Number.isFinite(state.zoom.yMax) ? state.zoom.yMax : dataMaxY;
      if (!(axisMaxX > axisMinX) || !(axisMaxY > axisMinY)) {
        state.zoom = null;
        axisMinX = dataMinX;
        axisMaxX = dataMaxX;
        axisMinY = dataMinY;
        axisMaxY = dataMaxY;
      }
    } else if (state.preserveAxis && lastPlotContext) {
      axisMinX = lastPlotContext.axisMinX;
      axisMaxX = lastPlotContext.axisMaxX;
      axisMinY = lastPlotContext.axisMinY;
      axisMaxY = lastPlotContext.axisMaxY;
    }
    const logMin = Math.log10(axisMinY);
    const logMax = Math.log10(axisMaxY);

    const labelScale = Math.max(0.85, Math.min(1.25, width / 760));
    const fontAxis = Math.round(16 * labelScale);
    const fontTick = Math.round(12 * layoutScale);
    const fontLegend = Math.round(11 * layoutScale);
    const fontLabel = Math.round(11 * layoutScale);
    const legendMaxLines = isNarrow ? 3 : null;
    const legendLineHeight = Math.round(16 * layoutScale);
    const legendHeight =
      legendMaxLines != null ? legendLineHeight * legendMaxLines + Math.round(12 * layoutScale) : 0;
    const legendWidth = isNarrow ? 0 : estimateLegendWidth(ctx, series, width, theme, layoutScale);
    const margin = {
      top: Math.round(26 * layoutScale),
      right: isNarrow ? Math.round(14 * layoutScale) : legendWidth,
      bottom: Math.round(64 * layoutScale) + legendHeight,
      left: Math.round(70 * layoutScale),
    };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    function xToPx(value) {
      return (
        margin.left +
        ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotWidth
      );
    }

    function yToPx(value) {
      if (state.scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top);
    ctx.lineTo(margin.left, margin.top);
    ctx.stroke();

    ctx.fillStyle = theme.ink;
    ctx.font = `${fontAxis}px ${theme.font}`;
    ctx.textAlign = "center";
    const tempUnitLabel = state.units === "C" ? "°C" : "°K";
    const axisLabelOffset = Math.round(36 * labelScale);
    const axisLabelXOffset = Math.round(15 * labelScale);
    ctx.fillText(
      `Temperature [${tempUnitLabel}]`,
      margin.left + plotWidth / 2,
      margin.top + plotHeight + axisLabelOffset
    );
    ctx.save();
    ctx.translate(axisLabelXOffset, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Diffusivity [mm²/s]", 0, 0);
    ctx.restore();

    drawXTicks(
      ctx,
      axisMinX,
      axisMaxX,
      margin,
      plotWidth,
      plotHeight,
      xToPx,
      theme,
      state.gridX,
      fontTick,
      layoutScale
    );
    drawYTicks(
      ctx,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
      yToPx,
      theme,
      state.gridY,
      fontTick,
      layoutScale
    );

    // Redraw axis box so grid lines never wash out the plot border.
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.clip();

    fillEnvelopes(series, xToPx, yToPx);

    const seriesCount = series.length;
    let densityScale = 1;
    if (seriesCount > 120) densityScale = 0.45;
    else if (seriesCount > 80) densityScale = 0.6;
    else if (seriesCount > 40) densityScale = 0.75;
    else if (seriesCount > 20) densityScale = 0.9;
    const thickness = clampValue(state.lineThickness || 1, 0.5, 2);
    const seriesLineWidth = Math.max(0.7, 2.4 * layoutScale * densityScale * thickness);
    const pointRadius = Math.max(1.2, Math.round(3.6 * layoutScale * densityScale * thickness));

    ctx.lineWidth = seriesLineWidth;
    series.forEach((item, index) => {
      if (item.axisLineSegments?.length) {
        ctx.strokeStyle = item.color;
        item.axisLineSegments.forEach((segment) => {
          if (segment.length < 2) return;
          ctx.beginPath();
          segment.forEach((point, pointIndex) => {
            const x = xToPx(point.temperature_axis);
            const y = yToPx(point.diffusivity);
            if (pointIndex === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        });
      }

      if (item.axisPoints.length) {
        const pointRadiusValue = pointRadius;
        item.axisPoints.forEach((point) => {
          drawMarker(
            ctx,
            xToPx(point.temperature_axis),
            yToPx(point.diffusivity),
            pointRadiusValue,
            item.color,
            state.markerStyle
          );
        });
      }

      if (state.numbering) {
        const lastPoint = item.axisLine[item.axisLine.length - 1] || item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          ctx.fillStyle = item.color;
          ctx.font = `${fontLabel}px ${theme.font}`;
          ctx.textAlign = "left";
          const labelIndex = Number.isFinite(item.legendIndex) ? item.legendIndex + 1 : index + 1;
          ctx.fillText(
            `${labelIndex}`,
            xToPx(lastPoint.temperature_axis) + Math.round(4 * layoutScale),
            yToPx(lastPoint.diffusivity)
          );
        }
      }
    });

    ctx.restore();

    const legendInfo = drawLegend(
      ctx,
      series,
      margin,
      plotWidth,
      theme,
      plotHeight,
      fontLegend,
      layoutScale,
      isNarrow ? "bottom" : "side",
      legendMaxLines,
      axisLabelOffset
    );

    hoverCache = {
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotDataWidth: plotWidth,
      plotHeight,
      scale: state.scale,
      units: state.units,
      series,
      xToPx,
      yToPx,
      legendMoreRect: legendInfo?.moreRect || null,
    };

    lastPlotContext = {
      width,
      height,
      margin,
      plotWidth,
      plotDataWidth: plotWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      fontAxis,
      fontTick,
      fontLegend,
      fontLabel,
      axisLabelOffset,
      axisLabelXOffset,
      lineWidth: seriesLineWidth,
      pointRadius,
      markerStyle: state.markerStyle,
      units: state.units,
      scale: state.scale,
      gridX: state.gridX,
      gridY: state.gridY,
      numbering: state.numbering,
      legendBySource: state.legendBySource,
      envelope: state.envelope,
      monochrome: state.monochrome,
      series,
    };

    state.preserveAxis = false;

    if (dom.refreshPlot) {
      dom.refreshPlot.disabled = !state.zoom;
    }
    syncZoomInputs();
    populateAxisDefaults(axisMinX, axisMaxX, axisMinY, axisMaxY);

    setupZoomSelection(canvas, ctx, {
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
    });

    setupHoverTooltip(canvas);
  }

  function renderAxisChart(series) {
    if (!dom.chart) return;
    const axisConfig = state.axisConfig;
    if (!axisConfig) {
      renderEmptyChart("Axis mode is not configured.");
      return;
    }
    const points = series.flatMap((item) => item.axisPoints || []);
    const xs = points.map((point) => Number(point.x_axis)).filter((value) => Number.isFinite(value));
    const values = points
      .map((point) => Number(point.diffusivity))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!xs.length || !values.length) {
      renderEmptyChart("No samples available for the selected axis.");
      return;
    }

    const canvas = document.createElement("canvas");
    const chartStyles = getComputedStyle(dom.chart);
    const paddingX =
      (parseFloat(chartStyles.paddingLeft) || 0) +
      (parseFloat(chartStyles.paddingRight) || 0);
    const paddingY =
      (parseFloat(chartStyles.paddingTop) || 0) +
      (parseFloat(chartStyles.paddingBottom) || 0);
    const containerWidth = dom.chart.clientWidth || 960;
    const width = Math.max(320, Math.round(containerWidth - paddingX));
    const isNarrow = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
    const layoutScale = Math.max(0.85, Math.min(1, width / 860));
    const baseRatio = isNarrow ? 0.75 : 0.5;
    let height = Math.round(width * baseRatio);
    const minHeight = isNarrow ? 300 : 240;
    height = Math.max(minHeight, height);
    if (isNarrow) {
      const containerHeight = dom.chart.clientHeight || 0;
      const available = Math.max(0, Math.round(containerHeight - paddingY));
      if (available > height) height = available;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    dom.chart.innerHTML = "";
    dom.chart.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    currentCanvas = canvas;
    const theme = getThemeColors();

    const dataMinX = Math.min(...xs);
    const dataMaxX = Math.max(...xs);
    const dataMinY = Math.min(...values);
    const dataMaxY = Math.max(...values);
    const categoricalBuckets =
      axisConfig.kind === "categorical" ? resolveCategoricalAxisBuckets(axisConfig).values : [];
    const preferred = getAxisPreferredBounds(axisConfig);

    let axisMinX = dataMinX;
    let axisMaxX = dataMaxX;
    if (axisConfig.kind === "categorical") {
      axisMinX = -0.6;
      axisMaxX = Math.max(0.6, categoricalBuckets.length - 0.4);
    } else if (!state.zoom && preferred) {
      if (Number.isFinite(preferred.min)) axisMinX = preferred.min;
      if (Number.isFinite(preferred.max)) axisMaxX = preferred.max;
      if (!(axisMaxX > axisMinX)) {
        axisMinX = dataMinX;
        axisMaxX = dataMaxX;
      }
    }
    let axisMinY = dataMinY;
    let axisMaxY = dataMaxY;

    if (state.zoom) {
      axisMinX = Number.isFinite(state.zoom.xMin) ? state.zoom.xMin : axisMinX;
      axisMaxX = Number.isFinite(state.zoom.xMax) ? state.zoom.xMax : axisMaxX;
      axisMinY = Number.isFinite(state.zoom.yMin) ? state.zoom.yMin : axisMinY;
      axisMaxY = Number.isFinite(state.zoom.yMax) ? state.zoom.yMax : axisMaxY;
      if (!(axisMaxX > axisMinX) || !(axisMaxY > axisMinY)) {
        state.zoom = null;
        axisMinX = dataMinX;
        axisMaxX = dataMaxX;
        axisMinY = dataMinY;
        axisMaxY = dataMaxY;
      }
    } else if (state.preserveAxis && lastPlotContext) {
      axisMinX = lastPlotContext.axisMinX;
      axisMaxX = lastPlotContext.axisMaxX;
      axisMinY = lastPlotContext.axisMinY;
      axisMaxY = lastPlotContext.axisMaxY;
    }

    const logMin = Math.log10(axisMinY);
    const logMax = Math.log10(axisMaxY);
    const labelScale = Math.max(0.85, Math.min(1.25, width / 760));
    const fontAxis = Math.round(16 * labelScale);
    const fontTick = Math.round(12 * layoutScale);
    const fontLegend = Math.round(11 * layoutScale);
    const fontLabel = Math.round(11 * layoutScale);
    const legendMaxLines = isNarrow ? 3 : null;
    const legendLineHeight = Math.round(16 * layoutScale);
    const legendHeight =
      legendMaxLines != null ? legendLineHeight * legendMaxLines + Math.round(12 * layoutScale) : 0;
    const legendWidth = isNarrow ? 0 : estimateLegendWidth(ctx, series, width, theme, layoutScale);
    const showAxisTempScale =
      state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION && !state.monochrome;
    const tempScaleInset = showAxisTempScale ? getAxisTempScaleMetrics(layoutScale).inset : 0;
    const margin = {
      top: Math.round(26 * layoutScale),
      right: isNarrow ? Math.round(14 * layoutScale) : legendWidth,
      bottom: Math.round(64 * layoutScale) + legendHeight,
      left: Math.round(70 * layoutScale),
    };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const plotDataWidth = Math.max(40, plotWidth - tempScaleInset);

    function xToPx(value) {
      return margin.left + ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotDataWidth;
    }

    function yToPx(value) {
      if (state.scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top);
    ctx.lineTo(margin.left, margin.top);
    ctx.stroke();

    const axisLabelOffset =
      axisConfig.kind === "categorical"
        ? Math.round(50 * labelScale)
        : Math.round(36 * labelScale);
    const axisLabelXOffset = Math.round(15 * labelScale);
    ctx.fillStyle = theme.ink;
    ctx.font = `${fontAxis}px ${theme.font}`;
    ctx.textAlign = "center";
    ctx.fillText(axisConfig.label || "Axis", margin.left + plotWidth / 2, margin.top + plotHeight + axisLabelOffset);
    ctx.save();
    ctx.translate(axisLabelXOffset, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Diffusivity [mm2/s]", 0, 0);
    ctx.restore();

    if (axisConfig.kind === "categorical") {
      drawCategoricalXTicks(
        ctx,
        categoricalBuckets,
        margin,
        plotDataWidth,
        plotHeight,
        xToPx,
        theme,
        state.gridX,
        fontTick,
        layoutScale
      );
    } else {
      drawXTicks(
        ctx,
        axisMinX,
        axisMaxX,
        margin,
        plotDataWidth,
        plotHeight,
        xToPx,
        theme,
        state.gridX,
        fontTick,
        layoutScale
      );
    }
    drawYTicks(
      ctx,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
      yToPx,
      theme,
      state.gridY,
      fontTick,
      layoutScale
    );

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.stroke();

    const temperatureValues = points
      .map((point) => Number(point.temperature_K))
      .filter((value) => Number.isFinite(value));
    const tempMin = temperatureValues.length ? Math.min(...temperatureValues) : null;
    const tempMax = temperatureValues.length ? Math.max(...temperatureValues) : null;
    state.axisTempExtent =
      Number.isFinite(tempMin) && Number.isFinite(tempMax) ? { min: tempMin, max: tempMax } : null;
    updateAxisTemperatureLegend();

    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.clip();

    const thickness = clampValue(state.lineThickness || 1, 0.5, 2);
    const pointRadius = Math.max(1.2, Math.round(3.6 * layoutScale * thickness));
    const lineWidth = Math.max(0.75, 1.8 * layoutScale * thickness);

    series.forEach((item, index) => {
      if (state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION && item.axisLineSegments?.length) {
        item.axisLineSegments.forEach((segment) => {
          if (!Array.isArray(segment) || segment.length < 2) return;
          for (let i = 0; i < segment.length - 1; i++) {
            const a = segment[i];
            const b = segment[i + 1];
            const ta = Number(a.temperature_K);
            const tb = Number(b.temperature_K);
            const temperatureMid = Number.isFinite(ta) && Number.isFinite(tb) ? (ta + tb) * 0.5 : ta;
            ctx.strokeStyle =
              !state.monochrome && Number.isFinite(temperatureMid) && Number.isFinite(tempMin) && Number.isFinite(tempMax)
                ? temperatureToColor(temperatureMid, tempMin, tempMax, state.axisColorScale)
                : item.color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(xToPx(a.x_axis), yToPx(a.diffusivity));
            ctx.lineTo(xToPx(b.x_axis), yToPx(b.diffusivity));
            ctx.stroke();
          }
        });
      }

      item.axisPoints.forEach((point) => {
        const temperature = Number(point.temperature_K);
        const pointColor =
          state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
          !state.monochrome &&
          Number.isFinite(temperature) &&
          Number.isFinite(tempMin) &&
          Number.isFinite(tempMax)
            ? temperatureToColor(temperature, tempMin, tempMax, state.axisColorScale)
            : item.color;
        const x = xToPx(point.x_axis);
        const y = yToPx(point.diffusivity);
        drawMarker(ctx, x, y, pointRadius, pointColor, state.markerStyle);

        const minX = Number(point.axis_range_min);
        const maxX = Number(point.axis_range_max);
        if (
          state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_SLICE &&
          axisConfig.kind !== "categorical" &&
          Number.isFinite(minX) &&
          Number.isFinite(maxX) &&
          maxX > minX
        ) {
          ctx.strokeStyle = item.color;
          ctx.lineWidth = Math.max(1, lineWidth * 0.8);
          ctx.beginPath();
          ctx.moveTo(xToPx(minX), y);
          ctx.lineTo(xToPx(maxX), y);
          ctx.stroke();
        }
      });

      if (state.numbering) {
        const lastPoint = item.axisLine[item.axisLine.length - 1] || item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          const labelIndex = Number.isFinite(item.legendIndex) ? item.legendIndex + 1 : index + 1;
          ctx.fillStyle = item.color;
          ctx.font = `${fontLabel}px ${theme.font}`;
          ctx.textAlign = "left";
          ctx.fillText(`${labelIndex}`, xToPx(lastPoint.x_axis) + 4, yToPx(lastPoint.diffusivity));
        }
      }
    });

    ctx.restore();

    const legendInfo = drawLegend(
      ctx,
      series,
      margin,
      plotWidth,
      theme,
      plotHeight,
      fontLegend,
      layoutScale,
      isNarrow ? "bottom" : "side",
      legendMaxLines,
      axisLabelOffset
    );

    let axisTempScaleRect = null;
    if (
      state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
      !state.monochrome &&
      Number.isFinite(tempMin) &&
      Number.isFinite(tempMax)
    ) {
      axisTempScaleRect = drawAxisTemperatureScale(
        ctx,
        margin,
        plotWidth,
        plotDataWidth,
        plotHeight,
        tempMin,
        tempMax,
        theme,
        layoutScale,
        state.axisColorScale
      );
    }

    hoverCache = {
      mode: "axis",
      axisLabel: axisConfig.label || "Axis",
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth,
      plotHeight,
      scale: state.scale,
      units: state.units,
      series,
      xToPx,
      yToPx,
      categoricalBuckets,
      legendMoreRect: legendInfo?.moreRect || null,
      axisTempScaleRect,
    };

    lastPlotContext = {
      mode: "axis",
      width,
      height,
      margin,
      plotWidth,
      plotDataWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      fontAxis,
      fontTick,
      fontLegend,
      fontLabel,
      axisLabelOffset,
      axisLabelXOffset,
      lineWidth,
      pointRadius,
      markerStyle: state.markerStyle,
      units: state.units,
      scale: state.scale,
      gridX: state.gridX,
      gridY: state.gridY,
      numbering: state.numbering,
      legendBySource: state.legendBySource,
      envelope: false,
      monochrome: state.monochrome,
      series,
      axisConfig: { ...axisConfig },
      axisTempBehavior: state.axisTempBehavior,
      axisLabel: axisConfig.label || "Axis",
      axisColorScale: state.axisColorScale,
      axisTempExtent: state.axisTempExtent ? { ...state.axisTempExtent } : null,
      categoricalBuckets: Array.isArray(categoricalBuckets) ? categoricalBuckets.slice() : [],
    };

    state.preserveAxis = false;
    if (dom.refreshPlot) {
      dom.refreshPlot.disabled = !state.zoom;
    }
    syncZoomInputs();
    populateAxisDefaults(axisMinX, axisMaxX, axisMinY, axisMaxY);

    setupZoomSelection(canvas, ctx, {
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      margin,
      plotWidth: plotDataWidth,
      plotHeight,
    });

    setupHoverTooltip(canvas);
  }

  function drawCategoricalXTicks(
    ctx,
    labels,
    margin,
    width,
    height,
    xToPx,
    theme,
    drawGrid,
    fontSize,
    scale = 1
  ) {
    if (!Array.isArray(labels) || !labels.length) return;
    ctx.fillStyle = theme.ink;
    ctx.font = `${fontSize}px ${theme.font}`;
    const tickLen = Math.max(4, Math.round(5 * scale));
    const labelOffset = Math.max(16, Math.round(10 * scale));
    const boundaryCount = labels.length + 1;
    const maxLabelChars = 16;
    const slotWidth = width / Math.max(1, labels.length);
    const compactLabels = labels.map((label) => {
      const text = String(label || "");
      return text.length > maxLabelChars ? `${text.slice(0, maxLabelChars - 3)}...` : text;
    });
    const hasLongLabels = compactLabels.some((text) => text.length >= 14 || ctx.measureText(text).width > slotWidth * 0.95);
    const rotation = hasLongLabels ? -Math.PI / 7.5 : -Math.PI / 7;
    const labelY = margin.top + height + labelOffset;
    const anchorNudgeX = 0;

    if (drawGrid) {
      ctx.save();
      ctx.strokeStyle = theme.line;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 0.8;
      for (let i = 1; i < boundaryCount - 1; i++) {
        const boundaryX = xToPx(i - 0.5);
        ctx.beginPath();
        ctx.moveTo(boundaryX, margin.top);
        ctx.lineTo(boundaryX, margin.top + height);
        ctx.stroke();
      }
      const lastBoundaryX = xToPx(labels.length - 0.5);
      ctx.beginPath();
      ctx.moveTo(lastBoundaryX, margin.top);
      ctx.lineTo(lastBoundaryX, margin.top + height);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < boundaryCount; i++) {
      const boundaryX = xToPx(i - 0.5);
      ctx.strokeStyle = theme.ink;
      ctx.beginPath();
      ctx.moveTo(boundaryX, margin.top + height);
      ctx.lineTo(boundaryX, margin.top + height + tickLen);
      ctx.stroke();
    }

    labels.forEach((label, index) => {
      const x = xToPx(index);
      const compact = compactLabels[index];
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.translate(x + anchorNudgeX, labelY);
      ctx.rotate(rotation);
      ctx.fillText(compact, 0, 0);
      ctx.restore();
    });
  }

  function drawAxisTemperatureScale(
    ctx,
    margin,
    plotWidth,
    plotDataWidth,
    plotHeight,
    minTemp,
    maxTemp,
    theme,
    scale = 1,
    colorScaleName = "blue-red"
  ) {
    const metrics = getAxisTempScaleMetrics(scale);
    const barWidth = metrics.barWidth;
    const barHeight = Math.max(90, Math.round(plotHeight * 0.45));
    const stripStartX = margin.left + (Number.isFinite(plotDataWidth) ? plotDataWidth : plotWidth);
    const stripWidth = Math.max(0, plotWidth - (Number.isFinite(plotDataWidth) ? plotDataWidth : plotWidth));
    const laneOffset = stripWidth > metrics.inset ? (stripWidth - metrics.inset) * 0.5 : 0;
    const x =
      stripWidth > barWidth
        ? stripStartX + laneOffset + metrics.leftPad
        : margin.left + plotWidth - barWidth - Math.round(16 * scale);
    const y = margin.top + Math.round(22 * scale);
    const gradient = ctx.createLinearGradient(0, y + barHeight, 0, y);
    getAxisColorStops(colorScaleName).forEach((stop) => {
      gradient.addColorStop(stop.t, stop.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.fillStyle = theme.ink;
    ctx.font = `${metrics.titleFont}px ${theme.font}`;
    ctx.textAlign = "center";
    ctx.fillText(formatTemperatureValueForUnits(maxTemp, 0), x + barWidth * 0.5, y - 4);
    ctx.fillText(formatTemperatureValueForUnits(minTemp, 0), x + barWidth * 0.5, y + barHeight + 15);
    ctx.save();
    ctx.translate(x + barWidth + metrics.titleGap, y + barHeight * 0.5);
    ctx.rotate(Math.PI / 2);
    const unitLabel = state.units === "C" ? "\u00B0C" : "K";
    ctx.fillText(`Temperature [${unitLabel}]`, 0, 0);
    ctx.restore();
    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
    };
  }

  function getAxisTempScaleMetrics(scale = 1) {
    const barWidth = Math.max(8, Math.round(20 * scale));
    const titleFont = Math.max(16, Math.round(4 * scale));
    const titleGap = Math.max(10, Math.round(12 * scale));
    const leftPad = Math.max(6, Math.round(6 * scale));
    const rightPad = Math.max(8, Math.round(8 * scale));
    const inset = leftPad + barWidth + titleGap + titleFont + rightPad;
    return { barWidth, titleFont, titleGap, leftPad, rightPad, inset };
  }

  function getAxisColorScaleName(name) {
    if (name && AXIS_COLOR_SCALES[name]) return name;
    return "blue-red";
  }

  function getAxisColorStops(name) {
    const key = getAxisColorScaleName(name);
    return AXIS_COLOR_SCALES[key].stops;
  }

  function hexToRgb(hex) {
    const value = String(hex || "").replace("#", "").trim();
    if (value.length !== 6) return null;
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    if (![r, g, b].every((channel) => Number.isFinite(channel))) return null;
    return { r, g, b };
  }

  function interpolateScaleColor(stops, ratio) {
    if (!Array.isArray(stops) || !stops.length) return "#1e5eff";
    const clamped = clampValue(ratio, 0, 1);
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (clamped >= a.t && clamped <= b.t) {
        lower = a;
        upper = b;
        break;
      }
    }
    const lowRgb = hexToRgb(lower.color);
    const highRgb = hexToRgb(upper.color);
    if (!lowRgb || !highRgb) return lower.color || "#1e5eff";
    const span = upper.t - lower.t || 1;
    const local = clampValue((clamped - lower.t) / span, 0, 1);
    const r = Math.round(lowRgb.r + (highRgb.r - lowRgb.r) * local);
    const g = Math.round(lowRgb.g + (highRgb.g - lowRgb.g) * local);
    const b = Math.round(lowRgb.b + (highRgb.b - lowRgb.b) * local);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function buildScaleGradient(name, direction = "90deg") {
    const stops = getAxisColorStops(name);
    const parts = stops.map((stop) => `${stop.color} ${(stop.t * 100).toFixed(1)}%`);
    return `linear-gradient(${direction}, ${parts.join(", ")})`;
  }

  function temperatureToColor(tempK, minTempK, maxTempK, colorScaleName = "blue-red") {
    if (!Number.isFinite(tempK) || !Number.isFinite(minTempK) || !Number.isFinite(maxTempK)) {
      return "#1e5eff";
    }
    if (maxTempK <= minTempK) return "#1e5eff";
    const ratio = clampValue((tempK - minTempK) / (maxTempK - minTempK), 0, 1);
    return interpolateScaleColor(getAxisColorStops(colorScaleName), ratio);
  }

  function getAxisPreferredBounds(axisConfig) {
    if (!axisConfig) return null;
    if (axisConfig.kind === "numeric") {
      if (axisConfig.rangeKey === "year") {
        return {
          min: state.yearMin,
          max: state.yearMax,
        };
      }
      const range = state.numericFilters?.[axisConfig.rangeKey];
      if (!range) return null;
      return {
        min: range.min,
        max: range.max,
      };
    }
    if (axisConfig.kind === "composition") {
      const range = state.compositionFilters?.[axisConfig.element];
      if (!range) return null;
      return {
        min: range.min,
        max: range.max,
      };
    }
    return null;
  }

  function setupZoomSelection(canvas, ctx, config) {
    if (!canvas) return;
    const baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let dragStart = null;
    let dragCurrent = null;

    const plotLeft = config.margin.left;
    const plotTop = config.margin.top;
    const plotRight = plotLeft + config.plotWidth;
    const plotBottom = plotTop + config.plotHeight;

    function getOffset(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function isInsidePlot(x, y) {
      return x >= plotLeft && x <= plotRight && y >= plotTop && y <= plotBottom;
    }

    function clampPoint(x, y) {
      return {
        x: clampValue(x, plotLeft, plotRight),
        y: clampValue(y, plotTop, plotBottom),
      };
    }

    function pxToAxisX(x) {
      const ratio = (x - plotLeft) / (config.plotWidth || 1);
      return config.axisMinX + ratio * (config.axisMaxX - config.axisMinX);
    }

    function pxToAxisY(y) {
      const ratio = (y - plotTop) / (config.plotHeight || 1);
      if (state.scale === "linear") {
        return config.axisMaxY - ratio * (config.axisMaxY - config.axisMinY);
      }
      const logValue = config.logMax - ratio * (config.logMax - config.logMin);
      return Math.pow(10, logValue);
    }

    function drawSelection() {
      if (!dragStart || !dragCurrent) return;
      const start = clampPoint(dragStart.x, dragStart.y);
      const end = clampPoint(dragCurrent.x, dragCurrent.y);
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      ctx.putImageData(baseImage, 0, 0);
      ctx.save();
      ctx.strokeStyle = "#0f766e";
      ctx.fillStyle = "rgba(15,118,110,0.15)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      ctx.fillRect(x, y, width, height);
      ctx.restore();
    }

    function clearSelection() {
      ctx.putImageData(baseImage, 0, 0);
    }

    canvas.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      const start = getOffset(event);
      if (!isInsidePlot(start.x, start.y)) return;
      isZoomDragging = true;
      dragStart = { x: start.x, y: start.y };
      dragCurrent = { x: start.x, y: start.y };
      drawSelection();

      const onMouseUp = (eventUp) => {
        const endPoint = getOffset(eventUp);
        const end = clampPoint(endPoint.x, endPoint.y);
        const startPoint = clampPoint(dragStart.x, dragStart.y);
        const width = Math.abs(end.x - startPoint.x);
        const height = Math.abs(end.y - startPoint.y);
        dragStart = null;
        dragCurrent = null;

        if (width < 6 || height < 6) {
          clearSelection();
          window.removeEventListener("mouseup", onMouseUp);
          isZoomDragging = false;
          return;
        }

        const xMin = pxToAxisX(Math.min(startPoint.x, end.x));
        const xMax = pxToAxisX(Math.max(startPoint.x, end.x));
        const yMin = pxToAxisY(Math.max(startPoint.y, end.y));
        const yMax = pxToAxisY(Math.min(startPoint.y, end.y));
        state.zoom = { xMin, xMax, yMin, yMax };
        window.removeEventListener("mouseup", onMouseUp);
        isZoomDragging = false;
        lastZoomDragAt = Date.now();
        plotSelectedSeries();
      };

      window.addEventListener("mouseup", onMouseUp);
    });

    canvas.addEventListener("mousemove", (event) => {
      const pos = getOffset(event);
      canvas.style.cursor = isInsidePlot(pos.x, pos.y) ? "crosshair" : "default";
      if (!dragStart) return;
      dragCurrent = { x: pos.x, y: pos.y };
      drawSelection();
    });
  }

  function resetZoom() {
    if (!state.zoom) return;
    state.zoom = null;
    plotSelectedSeries();
  }

  function setZoomFromInputs() {
    const xMin = parseNumber(dom.axisXMin?.value);
    const xMax = parseNumber(dom.axisXMax?.value);
    const yMin = parseNumber(dom.axisYMin?.value);
    const yMax = parseNumber(dom.axisYMax?.value);
    const anyValue =
      Number.isFinite(xMin) ||
      Number.isFinite(xMax) ||
      Number.isFinite(yMin) ||
      Number.isFinite(yMax);
    if (!anyValue) {
      state.zoom = null;
      return;
    }
    const invalid =
      (Number.isFinite(xMin) && Number.isFinite(xMax) && !(xMax > xMin)) ||
      (Number.isFinite(yMin) && Number.isFinite(yMax) && !(yMax > yMin));
    if (invalid) return;
    state.zoom = { xMin, xMax, yMin, yMax };
  }

  function syncZoomInputs() {
    if (state.axisInputActive) return;
    if (!dom.axisXMin || !dom.axisXMax || !dom.axisYMin || !dom.axisYMax) return;
    if (!state.zoom) {
      dom.axisXMin.value = "";
      dom.axisXMax.value = "";
      dom.axisYMin.value = "";
      dom.axisYMax.value = "";
      return;
    }
    dom.axisXMin.value = Number.isFinite(state.zoom.xMin)
      ? state.zoom.xMin.toFixed(2)
      : "";
    dom.axisXMax.value = Number.isFinite(state.zoom.xMax)
      ? state.zoom.xMax.toFixed(2)
      : "";
    dom.axisYMin.value = Number.isFinite(state.zoom.yMin)
      ? state.zoom.yMin.toExponential(3)
      : "";
    dom.axisYMax.value = Number.isFinite(state.zoom.yMax)
      ? state.zoom.yMax.toExponential(3)
      : "";
  }

  function populateAxisDefaults(axisMinX, axisMaxX, axisMinY, axisMaxY) {
    if (state.axisInputActive) return;
    if (!dom.axisXMin || !dom.axisXMax || !dom.axisYMin || !dom.axisYMax) return;
    if (state.zoom) return;
    if (state.axisMode === AXIS_MODE_FILTER && state.axisConfig?.kind === "categorical") {
      dom.axisXMin.value = "";
      dom.axisXMax.value = "";
      if (!dom.axisYMin.value && Number.isFinite(axisMinY)) {
        dom.axisYMin.value = axisMinY.toExponential(3);
      }
      if (!dom.axisYMax.value && Number.isFinite(axisMaxY)) {
        dom.axisYMax.value = axisMaxY.toExponential(3);
      }
      return;
    }
    if (
      dom.axisXMin.value ||
      dom.axisXMax.value ||
      dom.axisYMin.value ||
      dom.axisYMax.value
    ) {
      return;
    }
    dom.axisXMin.value = Number.isFinite(axisMinX) ? axisMinX.toFixed(2) : "";
    dom.axisXMax.value = Number.isFinite(axisMaxX) ? axisMaxX.toFixed(2) : "";
    dom.axisYMin.value = Number.isFinite(axisMinY) ? axisMinY.toExponential(3) : "";
    dom.axisYMax.value = Number.isFinite(axisMaxY) ? axisMaxY.toExponential(3) : "";
  }

  function fillEnvelopes(series, xToPx, yToPx) {
    if (!state.envelope) return;
    const buckets = {};
    series.forEach((item) => {
      const band = inferBand(item.descriptor);
      if (!band) return;
      const baseId = stripBand(item.descriptor.groupId);
      const key = `${baseId}::${item.seriesLabel}`;
      buckets[key] = buckets[key] || {};
      buckets[key][band] = item;
    });

    Object.values(buckets).forEach((bucket) => {
      if (!bucket.min || !bucket.max) return;
      const overlap = computeOverlap(bucket.min, bucket.max);
      if (!overlap.temps.length) return;
      const ctx = currentCanvas.getContext("2d");
      ctx.fillStyle = state.monochrome
        ? "rgba(60, 60, 60, 0.18)"
        : "rgba(15,118,110,0.18)";
      ctx.beginPath();
      overlap.temps.forEach((temperature, idx) => {
        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
        const y = yToPx(overlap.maxVals[idx]);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      for (let i = overlap.temps.length - 1; i >= 0; i--) {
        const temperature = overlap.temps[i];
        const x = xToPx(state.units === "C" ? temperature - 273.15 : temperature);
        const y = yToPx(overlap.minVals[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
  }

  function computeOverlap(minSeries, maxSeries) {
    const temps = [];
    const minVals = [];
    const maxVals = [];
    const start = Math.max(
      minSeries.descriptor.temperatureRange?.[0] || -Infinity,
      maxSeries.descriptor.temperatureRange?.[0] || -Infinity
    );
    const end = Math.min(
      minSeries.descriptor.temperatureRange?.[1] || Infinity,
      maxSeries.descriptor.temperatureRange?.[1] || Infinity
    );
    if (!(end > start)) return { temps, minVals, maxVals };
    const steps = 160;
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const T = start + (end - start) * ratio;
      const minVal = evaluateSeriesAtTemp(minSeries.descriptor, T);
      const maxVal = evaluateSeriesAtTemp(maxSeries.descriptor, T);
      if (minVal && maxVal) {
        temps.push(T);
        minVals.push(minVal);
        maxVals.push(maxVal);
      }
    }
    return { temps, minVals, maxVals };
  }

  function evaluateSeriesAtTemp(descriptor, temperature) {
    for (const segment of descriptor.segments) {
      const range = segment.temperature_validity_K || [];
      if (range.length === 2 && temperature >= range[0] && temperature <= range[1]) {
        if (segment.model?.type === "single_point") return null;
        return evaluateModel(segment.model, temperature);
      }
    }
    return null;
  }

  function inferBand(descriptor) {
    const raw = descriptor.segments?.[0]?.plotting?.envelope_fill;
    if (raw && raw !== "not_reported") {
      const token = String(raw).toLowerCase();
      if (token === "avg") return "mean";
      if (token === "min" || token === "max" || token === "mean") return token;
    }
    const legacyBand = descriptor.segments?.[0]?.metadata?.band;
    if (legacyBand) return legacyBand;
    const candidate = String(descriptor.groupId || descriptor.label || descriptor.id || "");
    if (!candidate) return null;
    const match = candidate.match(/(?:^|_)(mean|avg|min|max)(?:_|$)/i);
    if (!match) return null;
    const token = match[1].toLowerCase();
    if (token === "avg") return "mean";
    return token;
  }

  function stripBand(groupId) {
    if (!groupId) return "";
    return String(groupId)
      .replace(/_(mean|avg|min|max|lower_envelope|upper_envelope|lower|upper)(?=_|$)/gi, "")
      .replace(/__+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function drawXTicks(
    ctx,
    min,
    max,
    margin,
    width,
    height,
    xToPx,
    theme,
    drawGrid,
    fontSize,
    scale = 1
  ) {
    const steps = 5;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.font = `${fontSize}px ${theme.font}`;
    const tickLen = Math.max(4, Math.round(5 * scale));
    const labelOffset = Math.max(12, Math.round(16 * scale));
    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const x = xToPx(value);
      if (drawGrid) {
        ctx.save();
        ctx.strokeStyle = theme.line;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + height);
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = theme.ink;
      ctx.beginPath();
      ctx.moveTo(x, margin.top + height);
      ctx.lineTo(x, margin.top + height + tickLen);
      ctx.stroke();
      ctx.fillText(formatXAxisTick(value, min, max), x, margin.top + height + labelOffset);
    }
  }

  function formatXAxisTick(value, min, max) {
    if (!Number.isFinite(value)) return "";
    const span = Math.abs(max - min);
    if (span <= 1) return value.toFixed(3);
    if (span <= 10) return value.toFixed(2);
    if (span <= 100) return value.toFixed(1);
    return value.toFixed(0);
  }

  function drawYTicks(
    ctx,
    axisMinY,
    axisMaxY,
    logMin,
    logMax,
    margin,
    width,
    height,
    yToPx,
    theme,
    drawGrid,
    fontSize,
    scale = 1
  ) {
    ctx.textAlign = "right";
    ctx.fillStyle = theme.ink;
    ctx.font = `${fontSize}px ${theme.font}`;
    const tickLenMajor = Math.max(4, Math.round(6 * scale));
    const tickLenMinor = Math.max(3, Math.round(3 * scale));
    const labelOffsetX = Math.max(6, Math.round(8 * scale));
    const labelOffsetY = Math.max(2, Math.round(3 * scale));
    if (state.scale === "linear") {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        if (drawGrid) {
          ctx.save();
          ctx.strokeStyle = theme.line;
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = theme.ink;
        ctx.beginPath();
        ctx.moveTo(margin.left - tickLenMajor, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        ctx.fillText(value.toExponential(1), margin.left - labelOffsetX, y + labelOffsetY);
      }
      return;
    }
    const steps = Math.max(2, Math.round(logMax - logMin));
    const decadeMin = Math.floor(logMin);
    const decadeMax = Math.ceil(logMax);
    const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let decade = decadeMin; decade <= decadeMax; decade++) {
      for (const factor of factors) {
        const value = factor * Math.pow(10, decade);
        if (value < axisMinY || value > axisMaxY) continue;
        const y = yToPx(value);
        if (drawGrid) {
          ctx.save();
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = factor === 1 ? 1 : 0.8;
          ctx.globalAlpha = factor === 1 ? 0.85 : 0.6;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + width, y);
          ctx.stroke();
          ctx.restore();
        }
        const tickLen = factor === 1 ? tickLenMajor : tickLenMinor;
        ctx.strokeStyle = theme.ink;
        ctx.beginPath();
        ctx.moveTo(margin.left - tickLen, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        if (factor === 1) {
          ctx.fillText(value.toExponential(1), margin.left - labelOffsetX, y + labelOffsetY);
        }
      }
    }
  }

  function estimateLegendWidth(ctx, series, chartWidth, theme, scale = 1) {
    if (!ctx || !Array.isArray(series) || !series.length) return 140;
    const items = buildLegendItems(series);
    if (!items.length) return 140;
    ctx.save();
    const fontSize = Math.round(11 * scale);
    ctx.font = `${fontSize}px ${theme?.font || "Calibri, Times New Roman, Arial, sans-serif"}`;
    let maxLabel = 0;
    items.forEach((item) => {
      const label = `${item.index + 1}. ${item.label}`;
      const width = ctx.measureText(label).width;
      if (width > maxLabel) maxLabel = width;
    });
    ctx.restore();
    const swatch = state.monochrome ? 0 : Math.round(14 * scale);
    const padding = Math.round(28 * scale);
    const target = maxLabel + swatch + padding;
    const maxWidth = Math.min(
      Math.round(240 * scale),
      Math.round(chartWidth * (scale < 1 ? 0.35 : 0.3))
    );
    const minWidth = Math.max(90, Math.round(120 * scale));
    return Math.min(maxWidth, Math.max(minWidth, Math.round(target)));
  }

  function buildLegendItems(series) {
    const legendItems = [];
    const seen = new Set();
    const dedupeByKey = state.axisMode === AXIS_MODE_FILTER || state.legendBySource;
    series.forEach((item, index) => {
      const key = item.legendKey || item.id || String(index);
      if (dedupeByKey) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      legendItems.push({
        color: item.color,
        label: item.legendLabel || seriesDisplayLabel(item.descriptor),
        index: Number.isFinite(item.legendIndex) ? item.legendIndex : legendItems.length,
      });
    });
    return legendItems.sort((a, b) => a.index - b.index);
  }

  function getLegendHeader() {
    const modeLabel = state.selectionMode === "manual" ? "Selected" : "Filtered";
    const scopeLabel = state.legendBySource ? "Sources" : "Series";
    return `${modeLabel} ${scopeLabel}`;
  }

  function setupHoverTooltip(canvas) {
    if (!canvas) return;
    const tooltip = ensureTooltip();
    const radius = 6;
    const lineRadius = 5;
    const pinDistance = 120;
    const useAxisMode = hoverCache?.mode === "axis";
    const sampleX = (point) => {
      if (!point) return null;
      if (Number.isFinite(point.x_axis)) return point.x_axis;
      return point.temperature_axis;
    };

    function findNearest(x, y) {
      if (!hoverCache) return null;
      let best = null;
      let bestDist = radius * radius;
      hoverCache.series.forEach((series) => {
        series.axisPoints.forEach((point) => {
          const px = hoverCache.xToPx(sampleX(point));
          const py = hoverCache.yToPx(point.diffusivity);
          const dx = px - x;
          const dy = py - y;
          const dist = dx * dx + dy * dy;
          if (dist <= bestDist) {
            bestDist = dist;
            best = { series, point, px, py };
          }
        });
        series.axisLineSegments?.forEach((segment) => {
          for (let i = 0; i < segment.length - 1; i++) {
            const a = segment[i];
            const b = segment[i + 1];
            const ax = hoverCache.xToPx(sampleX(a));
            const ay = hoverCache.yToPx(a.diffusivity);
            const bx = hoverCache.xToPx(sampleX(b));
            const by = hoverCache.yToPx(b.diffusivity);
            const dist = pointToSegmentDistanceSq(x, y, ax, ay, bx, by);
            if (dist <= lineRadius * lineRadius && dist <= bestDist) {
              bestDist = dist;
              best = { series, point: a, px: ax, py: ay };
            }
          }
        });
      });
      return best;
    }

    function renderTooltipContent(target, pinned = false) {
      const label = seriesDisplayLabel(target.series.descriptor);
      const ordinal = Number.isFinite(target.series.legendIndex) ? target.series.legendIndex + 1 : "";
      const prefix = ordinal ? `${ordinal}. ` : "";
      const header = `<strong>${escapeHtml(prefix + label)}</strong>`;
      const sourceTitle = target.series.descriptor.sourceTitle || "Source";
      let meta = "";
      if (useAxisMode) {
        const axisLabel = hoverCache?.axisLabel || state.axisConfig?.label || "Axis";
        const axisValue = target.point?.axis_value ?? "";
        const tempText = formatTemperatureForUnits(target.point?.temperature_K, 1);
        const diffText = Number(target.point?.diffusivity).toExponential(3);
        meta = `<div>${escapeHtml(`${sourceTitle} | ${axisLabel}: ${axisValue}`)}</div><div>${escapeHtml(
          `${tempText} | D=${diffText} mm2/s`
        )}</div>`;
      } else {
        const range = formatRangeValueForUnits(target.series.descriptor.temperatureRange, state.units) || "";
        const metaText = range ? `${sourceTitle} - ${range}` : sourceTitle;
        meta = `<div>${escapeHtml(metaText)}</div>`;
      }
      let details = "";
      if (pinned) {
        const sourceMeta = state.dataset?.sources?.[target.series.descriptor.sourceId] || null;
        const citation = buildCitation(sourceMeta, target.series.descriptor);
        if (citation) {
          details = `<div class="hdd-tooltip-cite">${escapeHtml(cleanCsvField(citation))}</div>`;
        }
      }
      const actions = pinned
        ? `<div class="hdd-tooltip-actions">
            <button type="button" data-action="tooltip-exclude">Exclude</button>
          </div>`
        : "";
      return `${header}${meta}${details}${actions}`;
    }

    function handleMove(event) {
      if (state.tooltipPinned) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dx = x - state.tooltipPinned.px;
        const dy = y - state.tooltipPinned.py;
        if (dx * dx + dy * dy > pinDistance * pinDistance) {
          state.tooltipPinned = null;
          tooltip.classList.remove("is-pinned");
          tooltip.style.opacity = "0";
        }
        return;
      }
      if (!hoverCache) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const legendRect = hoverCache.legendMoreRect;
      if (legendRect) {
        const insideLegend =
          x >= legendRect.x &&
          x <= legendRect.x + legendRect.width &&
          y >= legendRect.y &&
          y <= legendRect.y + legendRect.height;
        if (insideLegend) {
          canvas.style.cursor = "pointer";
          tooltip.style.opacity = "0";
          return;
        }
      }
      const scaleRect = hoverCache.axisTempScaleRect;
      if (
        useAxisMode &&
        scaleRect &&
        x >= scaleRect.x &&
        x <= scaleRect.x + scaleRect.width &&
        y >= scaleRect.y &&
        y <= scaleRect.y + scaleRect.height
      ) {
        canvas.style.cursor = "pointer";
        if (!state.tooltipPinned) {
          tooltip.style.opacity = "0";
        }
        return;
      }
      const plotLeft = hoverCache.margin.left;
      const plotTop = hoverCache.margin.top;
      const plotRight = plotLeft + hoverCache.plotWidth;
      const plotBottom = plotTop + hoverCache.plotHeight;
      if (x < plotLeft || x > plotRight || y < plotTop || y > plotBottom) {
        canvas.style.cursor = "default";
        tooltip.style.opacity = "0";
        return;
      }

      const best = findNearest(x, y);

      if (!best) {
        tooltip.style.opacity = "0";
        return;
      }

      tooltip.innerHTML = renderTooltipContent(best, false);
      tooltip.style.opacity = "1";
      tooltip.style.left = `${rect.left + window.scrollX + best.px + 12}px`;
      tooltip.style.top = `${rect.top + window.scrollY + best.py - 10}px`;
      canvas.style.cursor = "crosshair";
    }

    function handleLeave() {
      if (state.tooltipPinned) return;
      tooltip.style.opacity = "0";
    }

    function handleClick(event) {
      if (!hoverCache) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const legendRect = hoverCache.legendMoreRect;
      const insideLegend =
        !!legendRect &&
        x >= legendRect.x &&
        x <= legendRect.x + legendRect.width &&
        y >= legendRect.y &&
        y <= legendRect.y + legendRect.height;
      if (insideLegend) {
        setSummaryModalTitle(state.selectionMode === "manual" ? "Selected Series" : "Filtered Series");
        state.summaryModalMode = "series";
        openSummaryModal();
        return;
      }
      const scaleRect = hoverCache.axisTempScaleRect;
      const insideAxisTempScale =
        hoverCache.mode === "axis" &&
        !!scaleRect &&
        x >= scaleRect.x &&
        x <= scaleRect.x + scaleRect.width &&
        y >= scaleRect.y &&
        y <= scaleRect.y + scaleRect.height;
      if (insideAxisTempScale) {
        cycleAxisColorScale();
        return;
      }
      if (isZoomDragging || Date.now() - lastZoomDragAt < 200) return;
      const plotLeft = hoverCache.margin.left;
      const plotTop = hoverCache.margin.top;
      const plotRight = plotLeft + hoverCache.plotWidth;
      const plotBottom = plotTop + hoverCache.plotHeight;
      if (x < plotLeft || x > plotRight || y < plotTop || y > plotBottom) return;
      const best = findNearest(x, y);
      if (!best) {
        state.tooltipPinned = null;
        tooltip.classList.remove("is-pinned");
        tooltip.style.opacity = "0";
        return;
      }
      state.tooltipPinned = best;
      tooltip.innerHTML = renderTooltipContent(best, true);
      tooltip.classList.add("is-pinned");
      tooltip.style.opacity = "1";
      tooltip.style.left = `${rect.left + window.scrollX + best.px + 12}px`;
      tooltip.style.top = `${rect.top + window.scrollY + best.py - 10}px`;
    }

    canvas.removeEventListener("mousemove", handleMove);
    canvas.removeEventListener("mouseleave", handleLeave);
    canvas.removeEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("click", handleClick);

    tooltip.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      if (!action || !state.tooltipPinned) return;
      event.stopPropagation();
      if (action === "tooltip-exclude") {
        state.excludedSeries.add(state.tooltipPinned.series.id);
        state.tooltipPinned = null;
        tooltip.classList.remove("is-pinned");
        tooltip.style.opacity = "0";
        applyFilters();
        plotSelectedSeries(true);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        state.tooltipPinned = null;
        tooltip.classList.remove("is-pinned");
        tooltip.style.opacity = "0";
      }
    });
  }

  function ensureTooltip() {
    let tooltip = document.getElementById("hdd-chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "hdd-chart-tooltip";
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function pointToSegmentDistanceSq(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) {
      const rx = px - ax;
      const ry = py - ay;
      return rx * rx + ry * ry;
    }
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));
    const cx = ax + clamped * dx;
    const cy = ay + clamped * dy;
    const rx = px - cx;
    const ry = py - cy;
    return rx * rx + ry * ry;
  }

  function drawLegend(
    ctx,
    series,
    margin,
    width,
    theme,
    plotHeight,
    fontSize,
    scale = 1,
    position = "side",
    maxLines = null,
    axisLabelOffset = 0
  ) {
    const isBottom = position === "bottom";
    const legendX = isBottom
      ? margin.left
      : margin.left + width + Math.round(10 * scale);
    let legendY = isBottom
      ? margin.top + plotHeight + axisLabelOffset + Math.round(16 * scale)
      : margin.top + 10;
    ctx.font = `${fontSize}px ${theme.font}`;
    ctx.textAlign = "left";
    const maxY = isBottom
      ? legendY + Math.max(0, (maxLines || 0) * Math.round(16 * scale))
      : margin.top + plotHeight - 12;
    const items = buildLegendItems(series);
    const showSwatch = !state.monochrome;
    const swatchOffset = showSwatch ? Math.round(14 * scale) : 0;
    const swatchSize = Math.max(8, Math.round(10 * scale));
    const textX = legendX + swatchOffset;
    const lineHeight = Math.round(16 * scale);
    const header = getLegendHeader();
    if (header) {
      ctx.fillStyle = theme.muted;
      ctx.fillText(header, textX, legendY);
      legendY += lineHeight;
    }
    const headerLines = header ? 1 : 0;
    const availableLines = Math.max(
      0,
      maxLines != null ? Math.max(0, maxLines - headerLines) : Math.floor((maxY - legendY) / lineHeight)
    );
    const needsMore = items.length > availableLines;
    const displayCount = needsMore ? Math.max(0, availableLines - 1) : items.length;
    let moreRect = null;
    let i = 0;
    for (; i < items.length && i < displayCount; i++) {
      const item = items[i];
      if (showSwatch) {
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY - Math.round(8 * scale), swatchSize, swatchSize);
      }
      ctx.fillStyle = theme.ink;
      ctx.fillText(`${item.index + 1}. ${item.label}`, textX, legendY);
      legendY += lineHeight;
    }
    const label = needsMore ? `Show all ${items.length}` : "Show full list";
    ctx.fillStyle = theme.accent || theme.muted;
    ctx.fillText(label, textX, legendY);
    const metrics = ctx.measureText(label);
    moreRect = {
      x: textX,
      y: legendY - lineHeight + 2,
      width: metrics.width,
      height: lineHeight,
    };
    return { moreRect };
  }

  function buildSourceListExportItems(seriesList) {
    if (!Array.isArray(seriesList) || !seriesList.length) return [];
    const seen = new Set();
    const items = [];
    seriesList.forEach((series) => {
      const descriptor = series?.descriptor || {};
      const sourceId = descriptor.sourceId || "";
      const sourceMeta = sourceId ? state.dataset?.sources?.[sourceId] : null;
      const sourceKey =
        sourceId || descriptor.sourceTitle || descriptor.groupId || series?.id || "";
      if (!sourceKey || seen.has(sourceKey)) return;
      seen.add(sourceKey);
      const label =
        sourceMeta?.clear_name ||
        sourceMeta?.title ||
        descriptor.sourceTitle ||
        descriptor.groupId ||
        "Unknown source";
      items.push({
        index: items.length + 1,
        label,
      });
    });
    return items;
  }

  function handleDownload(button) {
    const type = (button.dataset.download || "").toLowerCase();
    const requiresPlot = type === "csv" || type === "txt" || type === "png" || type === "svg";
    if (requiresPlot && !currentSeries.length) {
      alert("Select and plot at least one series before downloading.");
      return;
    }
    if (type === "json") {
      if (!state.dataset) {
        alert("Dataset not loaded yet.");
        return;
      }
      const version = state.dataset.database_version || "unknown";
      const filename = `hdd_public_database_${version}.json`;
      downloadBlob(
        new Blob([JSON.stringify(state.dataset, null, 2)], {
          type: "application/json",
        }),
        filename
      );
    } else if (type === "settings") {
      exportSettingsHashUrl();
    } else if (type === "csv") {
      const meta = getExportMetadata();
      const exportedAt = new Date().toISOString();
      const header = [
        "source",
        "source_id",
        "source_title",
        "doi_url",
        "group_id",
        "series_id",
        "series_label",
        "axis_mode",
        "axis_key",
        "axis_label",
        "x_axis",
        "axis_value",
        "axis_value_numeric",
        "axis_range_min",
        "axis_range_max",
        "temperature_axis",
        "temperature_K",
        "diffusivity_mm2_per_s",
        "render_mode",
        "kind",
      ];
      const zoom = meta.zoom;
      const rows = [
        `# database_version: ${meta.database_version || ""}`,
        `# schema_version: ${meta.schema_version || ""}`,
        `# exported_at: ${exportedAt}`,
        `# filters: ${formatFiltersSummary(meta.filters)}`,
        `# axis_mode: ${state.axisMode}`,
        `# axis_key: ${state.axisConfig?.axisKey || "temperature"}`,
        `# axis_behavior: ${state.axisTempBehavior || ""}`,
        `# zoom_x_min: ${zoom ? zoom.xMin.toFixed(2) : ""}`,
        `# zoom_x_max: ${zoom ? zoom.xMax.toFixed(2) : ""}`,
        `# zoom_y_min: ${zoom ? zoom.yMin.toExponential(6) : ""}`,
        `# zoom_y_max: ${zoom ? zoom.yMax.toExponential(6) : ""}`,
        "",
        header.join(","),
      ];
      const withinZoom = (sample) => {
        if (!zoom) return true;
        const x = Number.isFinite(sample.x_axis) ? sample.x_axis : sample.temperature_axis;
        const y = sample.diffusivity;
        return x >= zoom.xMin && x <= zoom.xMax && y >= zoom.yMin && y <= zoom.yMax;
      };
      const axisMode = state.axisMode === AXIS_MODE_FILTER ? "filter" : "temperature";
      const axisKey = state.axisConfig?.axisKey || "temperature";
      const axisLabel = state.axisConfig?.label || "Temperature";
      currentSeries.forEach((series) => {
        const sourceMeta = state.dataset?.sources?.[series.descriptor.sourceId] || null;
        const citation = quote(cleanCsvField(buildCitation(sourceMeta, series.descriptor)));
        const doiUrl = quote(toDoiUrl(sourceMeta?.doi) || "");
        const seriesAxisMode = axisMode;
        const sampleList =
          axisMode === "filter"
            ? series.axisPoints
            : [...series.axisLine.map((sample) => ({ ...sample, kind: "line" })), ...series.axisPoints.map((sample) => ({ ...sample, kind: "point" }))];
        const seriesBase = [
          citation,
          quote(series.descriptor.sourceId || ""),
          quote(series.descriptor.sourceTitle || ""),
          doiUrl,
          quote(series.descriptor.groupId),
          quote(series.descriptor.seriesId || ""),
          quote(series.seriesLabel || ""),
          quote(seriesAxisMode),
          quote(axisKey),
          quote(axisLabel),
        ];
        sampleList.forEach((sample) => {
          if (!withinZoom(sample)) return;
          const xAxis = Number.isFinite(sample.x_axis) ? sample.x_axis : sample.temperature_axis;
          const temperatureAxis =
            state.units === "C" ? sample.temperature_K - 273.15 : sample.temperature_K;
          const axisValue = sample.axis_value ?? xAxis;
          const axisValueNumeric = Number.isFinite(sample.axis_value_numeric)
            ? sample.axis_value_numeric
            : Number.isFinite(xAxis)
              ? xAxis
              : null;
          const axisRangeMin = Number.isFinite(sample.axis_range_min) ? sample.axis_range_min : null;
          const axisRangeMax = Number.isFinite(sample.axis_range_max) ? sample.axis_range_max : null;
          const kind = sample.kind || (axisMode === "filter" ? "point" : "line");
          const renderMode =
            axisMode === "filter"
              ? state.axisTempBehavior || AXIS_TEMP_BEHAVIOR_DISTRIBUTION
              : "temperature";
          rows.push(
            seriesBase
              .concat([
                xAxis.toFixed(6),
                quote(String(axisValue)),
                axisValueNumeric == null ? "" : axisValueNumeric.toFixed(6),
                axisRangeMin == null ? "" : axisRangeMin.toFixed(6),
                axisRangeMax == null ? "" : axisRangeMax.toFixed(6),
                temperatureAxis.toFixed(2),
                sample.temperature_K.toFixed(2),
                sample.diffusivity.toExponential(6),
                quote(renderMode),
                kind,
              ])
              .join(",")
          );
        });
      });
      downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), "hdd-selected.csv");
    } else if (type === "txt") {
      const sourceItems = buildSourceListExportItems(currentSeries);
      if (!sourceItems.length) {
        alert("No sources available for export.");
        return;
      }
      const lines = sourceItems.map((item) => `${item.index}. ${item.label}`);
      downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), "hdd-sources.txt");
    } else if (type === "png") {
      if (!currentCanvas) {
        alert("Plot the dataset first to export a PNG.");
        return;
      }
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = currentCanvas.width;
      exportCanvas.height = currentCanvas.height;
      const exportCtx = exportCanvas.getContext("2d");
      exportCtx.drawImage(currentCanvas, 0, 0);
      renderExportFooter(exportCtx, exportCanvas.width, exportCanvas.height);
      exportCanvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "hdd-selected.png");
      });
    } else if (type === "svg") {
      if (!lastPlotContext) {
        alert("Plot the dataset first to export an SVG.");
        return;
      }
      const svg = buildSvgExport(lastPlotContext);
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml" }),
        "hdd-selected.svg"
      );
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function quote(value) {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  function setStatus(message, tone = "info") {
    if (dom.status) {
      dom.status.textContent = message;
      dom.status.classList.remove("is-error", "is-ok");
      if (tone === "error") dom.status.classList.add("is-error");
      if (tone === "ok") dom.status.classList.add("is-ok");
    }
  }

  function setSummaryModalTitle(value) {
    const title = String(value || "Filtered Series");
    if (dom.summaryModalTitle) {
      dom.summaryModalTitle.textContent = title;
      return;
    }
    const fallback = dom.summaryModal?.querySelector?.(".hdd-summary-panel-header span");
    if (fallback) fallback.textContent = title;
  }

  function openSummaryModal() {
    if (!dom.summaryModal) return;
    dom.summaryModal.classList.add("is-open");
    dom.summaryModal.setAttribute("aria-hidden", "false");
  }

  function closeSummaryModal() {
    if (!dom.summaryModal) return;
    dom.summaryModal.classList.remove("is-open");
    dom.summaryModal.setAttribute("aria-hidden", "true");
    if (state.summaryModalMode === "report") {
      state.summaryModalMode = "series";
      setSummaryModalTitle("Filtered Series");
      updateSummary(currentSeries);
    }
  }

  function setShellState(stateValue) {
    if (dom.shell) {
      dom.shell.dataset.state = stateValue;
    }
  }

  function parseNumber(value) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const NON_NEGATIVE_RANGE_KEYS = new Set([
    "welding_t85",
    "charging_temperature_c",
    "charging_duration_h",
    "characteristic_length_mm",
    "coating_thickness_um",
    "pre_strain_percent",
    "cold_reduction_percent",
    "applied_stress_mpa",
    "applied_strain_percent",
    "current_density_mA_per_cm2",
    "applied_potential_v",
    "gas_pressure_bar",
    "heating_rate_k_per_min",
    "extraction_temperature_c",
  ]);

  function updateLineThicknessLabel() {
    if (!dom.lineThicknessValue) return;
    const value = clampValue(state.lineThickness || 1, 0.5, 2);
    dom.lineThicknessValue.textContent = `${value.toFixed(2)}x`;
  }

  function normalizeMarkerStyle(value) {
    return MARKER_STYLES.has(value) ? value : MARKER_STYLE_FILLED;
  }

  function syncMarkerStyleUi() {
    const active = normalizeMarkerStyle(state.markerStyle);
    dom.markerStyleButtons?.forEach((button) => {
      const style = normalizeMarkerStyle(button.dataset.markerStyle);
      const isActive = style === active;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function drawMarker(ctx, x, y, radius, color, styleName) {
    const style = normalizeMarkerStyle(styleName);
    const size = Math.max(1.2, radius);
    const strokeWidth = Math.max(1, size * 0.45);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    if (style === MARKER_STYLE_HOLLOW) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (style === MARKER_STYLE_X) {
      const arm = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(x - arm, y - arm);
      ctx.lineTo(x + arm, y + arm);
      ctx.moveTo(x + arm, y - arm);
      ctx.lineTo(x - arm, y + arm);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (style === MARKER_STYLE_TRIANGLE) {
      const h = size * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + size, y + size * 0.7);
      ctx.lineTo(x - size, y + size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function selectedValues(listbox) {
    if (!listbox) return [];
    return Array.from(listbox.querySelectorAll("input[type='checkbox']:checked")).map(
      (input) => input.value
    );
  }

  function matchesSet(selected, set) {
    if (!selected.length) return true;
    const mode = arguments.length > 2 ? arguments[2] : "include";
    if (!set || !set.size) return mode === "exclude";
    for (const value of selected) {
      if (set.has(value)) {
        return mode === "exclude" ? false : true;
      }
    }
    return mode === "exclude";
  }

  function matchesComposition(filters, ranges, includeUnknown) {
    if (!filters || !Object.keys(filters).length) return true;
    if (!ranges) return !!includeUnknown;
    for (const element of Object.keys(filters)) {
      const filter = filters[element] || {};
      const min = filter.min;
      const max = filter.max;
      if (min == null && max == null) continue;
      const range = ranges[element];
      if (!range) {
        if (includeUnknown) continue;
        return false;
      }
      if (min != null && range.max < min) return false;
      if (max != null && range.min > max) return false;
    }
    return true;
  }

  function getExportMetadata() {
    const zoom = lastPlotContext
      ? {
          xMin: lastPlotContext.axisMinX,
          xMax: lastPlotContext.axisMaxX,
          yMin: lastPlotContext.axisMinY,
          yMax: lastPlotContext.axisMaxY,
        }
      : null;
    return {
      schema_version: state.dataset?.schema_version || "",
      database_version: state.dataset?.database_version || "",
      zoom,
      filters: getActiveFiltersSummary(),
    };
  }

  function getActiveFiltersSummary() {
    const summary = {};
    const addList = (key, list) => {
      if (list && list.length) summary[key] = list;
    };
    addList("source", selectedValues(dom.filterSource));
    addList("material_class", selectedValues(dom.filterClass));
    addList("material_grade", selectedValues(dom.filterGrade));
    addList("material_microstructure", selectedValues(dom.filterMicrostructure));
    addList("material_phase", selectedValues(dom.filterPhase));
    addList("material_processing", selectedValues(dom.filterProcessing));
    addList("material_tags", selectedValues(dom.filterTags));
    addList("welded_process", selectedValues(dom.filterWeldProcess));
    addList("welded_layer", selectedValues(dom.filterWeldLayer));
    const compositionFilters = formatCompositionFilters(state.compositionFilters);
    if (compositionFilters.length) summary.chemical_composition = compositionFilters;
    if (state.includeUnknownComposition) summary.chemical_composition_unknown = true;
    addList("charging_method", selectedValues(dom.filterChargingMethod));
    addList("calculation_model", selectedValues(dom.filterCalculationModel));
    addList("sample_geometry", selectedValues(dom.filterSampleGeometry));
    addList("surface_condition", selectedValues(dom.filterSurfaceCondition));
    addList("surface_finish_detail", selectedValues(dom.filterSurfaceFinishDetail));
    addList("coated", selectedValues(dom.filterCoated));
    addList("coating_type", selectedValues(dom.filterCoatingType));
    addList("deformation_history", selectedValues(dom.filterDeformationHistory));
    addList("mechanical_loading_during_test", selectedValues(dom.filterMechanicalLoading));
    addList("loading_regime", selectedValues(dom.filterLoadingRegime));
    addList("electrolyte", selectedValues(dom.filterElectrolyte));
    addList("control_mode", selectedValues(dom.filterControlMode));
    addList("poison_additive", selectedValues(dom.filterPoisonAdditive));
    addList("gas_composition", selectedValues(dom.filterGasComposition));
    addList("gas_purity", selectedValues(dom.filterGasPurity));
    addList("tda_peak_analysis", selectedValues(dom.filterTdaPeak));
    addList("sims_type", selectedValues(dom.filterSimsType));
    addList("devanathan_entry_electrolyte", selectedValues(dom.filterDevEntryElectrolyte));
    addList("devanathan_exit_electrolyte", selectedValues(dom.filterDevExitElectrolyte));
    addList("reported_as", selectedValues(dom.filterReported));
    addList("studied_effects", selectedValues(dom.filterEffect));
    addList("measurement_method", selectedValues(dom.filterMethod));
    addList("model_type", selectedValues(dom.filterModel));
    const search = dom.search?.value || "";
    if (search.trim()) summary.search = search.trim();
    if (state.tempMin != null) summary.temp_min = state.tempMin;
    if (state.tempMax != null) summary.temp_max = state.tempMax;
    if (state.yearMin != null) summary.year_min = state.yearMin;
    if (state.yearMax != null) summary.year_max = state.yearMax;
    const numericSummary = {};
    Object.keys(state.numericFilters || {}).forEach((key) => {
      const range = state.numericFilters[key];
      if (!range) return;
      if (range.min == null && range.max == null) return;
      numericSummary[key] = { min: range.min, max: range.max };
    });
    if (Object.keys(numericSummary).length) summary.numeric_ranges = numericSummary;
    if (state.includeUnconfirmed) summary.include_unconfirmed = true;
    if (state.literatureMode && state.literatureMode !== "include") {
      summary.literature_compilations = state.literatureMode;
    }
    if (state.weldedMode && state.weldedMode !== "include") {
      summary.welded = state.weldedMode;
    }
    const excludeModes = {};
    Object.keys(state.filterMode || {}).forEach((key) => {
      if (state.filterMode[key] === "exclude") excludeModes[key] = "exclude";
    });
    if (Object.keys(excludeModes).length) summary.filter_mode = excludeModes;
    if (state.axisMode === AXIS_MODE_FILTER && state.axisConfig) {
      summary.axis_mode = "filter";
      summary.axis_key = state.axisConfig.axisKey;
      summary.axis_label = state.axisConfig.label;
      summary.axis_temp_behavior = state.axisTempBehavior;
      if (state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_SLICE && Number.isFinite(state.axisSliceTempK)) {
        summary.axis_slice_temp_K = Number(state.axisSliceTempK.toFixed(3));
      }
    }
    return summary;
  }

  function getSettingsDoi() {
    return (
      state.dataset?.database_doi ||
      state.dataset?.citations?.database?.doi ||
      DEFAULT_ZENODO_DOI
    );
  }

  function sanitizeRangeMap(mapLike) {
    const result = {};
    if (!mapLike || typeof mapLike !== "object") return result;
    Object.keys(mapLike).forEach((key) => {
      const range = mapLike[key];
      if (!range || typeof range !== "object") return;
      const min = parseNumber(range.min);
      const max = parseNumber(range.max);
      if (min == null && max == null) return;
      result[key] = { min, max };
    });
    return result;
  }

  function getFilterSelectionsSnapshot() {
    const selections = {};
    FILTER_SELECTION_BINDINGS.forEach((binding) => {
      const listbox = dom[binding.domKey];
      if (!listbox) return;
      selections[binding.key] = selectedValues(listbox);
    });
    return selections;
  }

  function getAdditionalSelectionEntryIdsForExport() {
    const additional = new Set(state.additionalSelectionEntryIds || []);
    const filteredIds = new Set((state.filteredList || []).map((entry) => entry.id));
    state.selected.forEach((id) => {
      if (filteredIds.has(id)) return;
      const entry = state.seriesById.get(id);
      const key = entry?.groupId || entry?.id || id;
      if (key) additional.add(String(key));
    });
    return Array.from(additional);
  }

  function serializeAxisConfig(config) {
    if (!config || typeof config !== "object") return null;
    if (config.kind === "categorical") {
      return {
        kind: "categorical",
        listbox_id: config.listboxId || null,
        axis_key: config.axisKey || null,
        label: config.label || null,
      };
    }
    if (config.kind === "numeric") {
      return {
        kind: "numeric",
        range_key: config.rangeKey || config.axisKey || null,
        axis_key: config.axisKey || null,
        label: config.label || null,
      };
    }
    if (config.kind === "composition") {
      return {
        kind: "composition",
        element: config.element || null,
        axis_key: config.axisKey || null,
        label: config.label || null,
      };
    }
    return null;
  }

  function buildSettingsPayload() {
    return {
      settings_version: 1,
      exported_at: new Date().toISOString(),
      database_version: state.dataset?.database_version || "",
      database_date: state.dataset?.database_date || "",
      database_doi: getSettingsDoi(),
      filters: {
        selections: getFilterSelectionsSnapshot(),
        modes: { ...(state.filterMode || {}) },
        search: dom.search?.value?.trim() || "",
        temperature_K: { min: state.tempMin, max: state.tempMax },
        year: { min: state.yearMin, max: state.yearMax },
        include_unconfirmed: !!state.includeUnconfirmed,
        include_unknown_composition: !!state.includeUnknownComposition,
        literature_mode: state.literatureMode || "include",
        welded_mode: state.weldedMode || "include",
        composition_ranges: sanitizeRangeMap(state.compositionFilters),
        numeric_ranges: sanitizeRangeMap(state.numericFilters),
      },
      plot_options: {
        units: state.units === "K" ? "K" : "C",
        scale: state.scale === "linear" ? "linear" : "log",
        envelope: !!state.envelope,
        force_scatterband: !!state.forceScatterband,
        numbering: !!state.numbering,
        legend_by_source: !!state.legendBySource,
        monochrome: !!state.monochrome,
        grid_x: !!state.gridX,
        grid_y: !!state.gridY,
        line_thickness: Number(clampValue(state.lineThickness || 1, 0.5, 2).toFixed(3)),
        marker_style: normalizeMarkerStyle(state.markerStyle),
      },
      axis: {
        mode: state.axisMode === AXIS_MODE_FILTER ? AXIS_MODE_FILTER : AXIS_MODE_TEMPERATURE,
        temp_behavior:
          state.axisTempBehavior === AXIS_TEMP_BEHAVIOR_SLICE
            ? AXIS_TEMP_BEHAVIOR_SLICE
            : AXIS_TEMP_BEHAVIOR_DISTRIBUTION,
        slice_temp_K: Number.isFinite(state.axisSliceTempK)
          ? Number(state.axisSliceTempK.toFixed(4))
          : null,
        color_scale: getAxisColorScaleName(state.axisColorScale),
        config: serializeAxisConfig(state.axisConfig),
      },
      zoom: state.zoom
        ? {
            xMin: Number.isFinite(state.zoom.xMin) ? state.zoom.xMin : null,
            xMax: Number.isFinite(state.zoom.xMax) ? state.zoom.xMax : null,
            yMin: Number.isFinite(state.zoom.yMin) ? state.zoom.yMin : null,
            yMax: Number.isFinite(state.zoom.yMax) ? state.zoom.yMax : null,
          }
        : null,
      additional_selection_entry_ids: getAdditionalSelectionEntryIdsForExport(),
    };
  }

  function toBase64UrlUtf8(text) {
    const input = String(text || "");
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromBase64UrlUtf8(value) {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function buildSettingsHash(payload) {
    const json = JSON.stringify(payload);
    return `${SETTINGS_HASH_KEY}=${toBase64UrlUtf8(json)}`;
  }

  function buildSettingsUrl(hashValue) {
    const base =
      window.location.origin + window.location.pathname + window.location.search;
    return `${base}#${hashValue}`;
  }

  function exportSettingsHashUrl() {
    const payload = buildSettingsPayload();
    const hash = buildSettingsHash(payload);
    const url = buildSettingsUrl(hash);
    const onCopyFallback = () => {
      window.prompt("Copy settings URL", url);
      setStatus("Settings URL generated. Copy it from the prompt.", "ok");
    };
    if (!navigator.clipboard?.writeText) {
      onCopyFallback();
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setStatus("Settings URL copied to clipboard.", "ok");
      })
      .catch(() => {
        onCopyFallback();
      });
  }

  function parseSettingsInput(rawInput) {
    const input = String(rawInput || "").trim();
    if (!input) {
      throw new Error("No settings string provided.");
    }

    let candidate = input;
    if (/^https?:\/\//i.test(candidate)) {
      try {
        const parsedUrl = new URL(candidate);
        candidate = parsedUrl.hash || "";
      } catch {
        throw new Error("Invalid URL format.");
      }
    }
    candidate = candidate.trim();
    if (candidate.startsWith("#")) candidate = candidate.slice(1);
    if (candidate.startsWith("!")) candidate = candidate.slice(1);
    candidate = decodeURIComponent(candidate);
    if (candidate.startsWith(`${SETTINGS_HASH_KEY}=`)) {
      candidate = candidate.slice(SETTINGS_HASH_KEY.length + 1);
    }
    if (!candidate) {
      throw new Error("Settings hash not found.");
    }
    if (candidate.startsWith("{")) {
      return JSON.parse(candidate);
    }
    const decoded = fromBase64UrlUtf8(candidate);
    return JSON.parse(decoded);
  }

  function buildImportReportSkeleton(payload = null) {
    return {
      applied: [],
      unknownFilterValues: [],
      missingSeriesIds: [],
      unmatchedControls: [],
      databaseMeta: {
        version: payload?.database_version || "",
        date: payload?.database_date || "",
        doi: payload?.database_doi || "",
      },
    };
  }

  function pushUniqueReportItem(list, value) {
    const text = String(value || "").trim();
    if (!text || list.includes(text)) return;
    list.push(text);
  }

  function handleImportSettingsClick() {
    const raw = window.prompt("Paste settings URL or hash");
    if (raw == null) return;
    importSettingsFromInput(raw);
  }

  function importSettingsFromInput(rawInput) {
    let payload = null;
    let report = null;
    try {
      payload = parseSettingsInput(rawInput);
      report = buildImportReportSkeleton(payload);
      applyImportedSettings(payload, report);
      showImportReportModal(report);
    } catch (error) {
      report = buildImportReportSkeleton(payload);
      pushUniqueReportItem(report.unmatchedControls, `Import parse error: ${error.message}`);
      showImportReportModal(report);
    }
  }

  function applyImportedSettings(payload, report) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Settings payload must be a JSON object.");
    }
    if (payload.settings_version != null && Number(payload.settings_version) !== 1) {
      throw new Error(`Unsupported settings version: ${payload.settings_version}`);
    }
    resetFiltersToDefaults({ replot: false, preserveManual: false });
    applyImportedFilterState(payload.filters, report);
    applyImportedPlotOptions(payload.plot_options, report);
    applyImportedAxisState(payload.axis, report);
    applyImportedZoom(payload.zoom, report);
    applyFilters({ preserveManual: true, replot: false });
    applyImportedAdditionalSelections(payload.additional_selection_entry_ids, report);
    setSelectionMode("filtered");
    applyFilters({ preserveManual: true, replot: false });
    plotSelectedSeries(true);
    updateSummary(currentSeries);
  }

  function setCheckboxSelections(listbox, values, reportKeyLabel, report) {
    if (!listbox) {
      pushUniqueReportItem(report.unmatchedControls, `${reportKeyLabel}: control missing`);
      return;
    }
    const requested = Array.isArray(values) ? values.map((value) => String(value)) : [];
    const byValue = new Map();
    listbox.querySelectorAll("input[type='checkbox']").forEach((input) => {
      byValue.set(input.value, input);
      input.checked = false;
    });
    requested.forEach((value) => {
      const input = byValue.get(value);
      if (!input) {
        pushUniqueReportItem(report.unknownFilterValues, `${reportKeyLabel}: ${value}`);
        return;
      }
      input.checked = true;
    });
  }

  function applyImportedFilterState(filtersPayload, report) {
    if (!filtersPayload || typeof filtersPayload !== "object") {
      pushUniqueReportItem(report.unmatchedControls, "Filters payload missing");
      return;
    }
    const selections = filtersPayload.selections || {};
    const knownSelectionKeys = new Set(FILTER_SELECTION_BINDINGS.map((binding) => binding.key));
    Object.keys(selections || {}).forEach((key) => {
      if (knownSelectionKeys.has(key)) return;
      pushUniqueReportItem(report.unmatchedControls, `Unknown filter selection key: ${key}`);
    });
    FILTER_SELECTION_BINDINGS.forEach((binding) => {
      if (!Object.prototype.hasOwnProperty.call(selections, binding.key)) return;
      const listbox = dom[binding.domKey];
      setCheckboxSelections(listbox, selections[binding.key], binding.label, report);
    });

    const modes = filtersPayload.modes || {};
    if (modes && typeof modes === "object") {
      Object.keys(modes).forEach((key) => {
        const mode = modes[key];
        if (mode !== "include" && mode !== "exclude") {
          pushUniqueReportItem(report.unmatchedControls, `${FILTER_MODE_LABELS[key] || key}: invalid mode`);
          return;
        }
        const toggle = Array.from(dom.filterModeToggles || []).find(
          (item) => item.dataset.filterMode === key
        );
        if (!toggle) {
          pushUniqueReportItem(report.unmatchedControls, `${FILTER_MODE_LABELS[key] || key}: control missing`);
          return;
        }
        toggle.checked = mode === "exclude";
        state.filterMode[key] = mode;
      });
    }

    if (typeof filtersPayload.search === "string" && dom.search) {
      dom.search.value = filtersPayload.search;
    }

    const tempRange = filtersPayload.temperature_K;
    if (tempRange && typeof tempRange === "object") {
      const minK = parseNumber(tempRange.min);
      const maxK = parseNumber(tempRange.max);
      const minC = Number.isFinite(minK) ? minK - 273.15 : null;
      const maxC = Number.isFinite(maxK) ? maxK - 273.15 : null;
      setTempFilter(minC, maxC, true);
    }

    const yearRange = filtersPayload.year;
    if (yearRange && typeof yearRange === "object") {
      const minYear = parseNumber(yearRange.min);
      const maxYear = parseNumber(yearRange.max);
      setYearFilter(minYear, maxYear, true);
    }

    if (typeof filtersPayload.include_unconfirmed === "boolean") {
      state.includeUnconfirmed = filtersPayload.include_unconfirmed;
      if (dom.includeUnconfirmed) dom.includeUnconfirmed.checked = state.includeUnconfirmed;
    }
    if (typeof filtersPayload.include_unknown_composition === "boolean") {
      state.includeUnknownComposition = filtersPayload.include_unknown_composition;
      if (dom.filterUnknownComposition) {
        dom.filterUnknownComposition.checked = state.includeUnknownComposition;
      }
    }
    if (typeof filtersPayload.literature_mode === "string") {
      if (["include", "only", "exclude"].includes(filtersPayload.literature_mode)) {
        state.literatureMode = filtersPayload.literature_mode;
        if (dom.literatureMode) dom.literatureMode.value = state.literatureMode;
      } else {
        pushUniqueReportItem(report.unmatchedControls, "Literature Compilations mode invalid");
      }
    }
    if (typeof filtersPayload.welded_mode === "string") {
      if (["include", "only", "exclude"].includes(filtersPayload.welded_mode)) {
        state.weldedMode = filtersPayload.welded_mode;
        if (dom.weldedMode) dom.weldedMode.value = state.weldedMode;
      } else {
        pushUniqueReportItem(report.unmatchedControls, "Welded mode invalid");
      }
    }

    applyImportedCompositionRanges(filtersPayload.composition_ranges, report);
    applyImportedNumericRanges(filtersPayload.numeric_ranges, report);
    report.applied.push("Filters");
  }

  function applyImportedCompositionRanges(rangesPayload, report) {
    if (!dom.filterComposition) {
      if (rangesPayload && Object.keys(rangesPayload || {}).length) {
        pushUniqueReportItem(report.unmatchedControls, "Chemical Composition controls missing");
      }
      state.compositionFilters = {};
      return;
    }

    dom.filterComposition.querySelectorAll("input[type='number']").forEach((input) => {
      input.value = "";
    });
    state.compositionFilters = {};

    if (!rangesPayload || typeof rangesPayload !== "object") return;
    Object.keys(rangesPayload).forEach((rawElement) => {
      const normalized = normalizeElementSymbol(rawElement);
      if (!normalized) return;
      const range = rangesPayload[rawElement] || {};
      const minVal = parseNumber(range.min);
      const maxVal = parseNumber(range.max);
      if (minVal == null && maxVal == null) return;
      let minOut = minVal != null ? Math.max(0, minVal) : null;
      let maxOut = maxVal != null ? Math.max(0, maxVal) : null;
      if (minOut != null && maxOut != null && minOut > maxOut) {
        const swap = minOut;
        minOut = maxOut;
        maxOut = swap;
      }
      const esc =
        typeof CSS !== "undefined" && CSS.escape
          ? CSS.escape(normalized)
          : normalized.replace(/["\\]/g, "\\$&");
      const minInput = dom.filterComposition.querySelector(
        `input[data-comp-element="${esc}"][data-comp-bound="min"]`
      );
      const maxInput = dom.filterComposition.querySelector(
        `input[data-comp-element="${esc}"][data-comp-bound="max"]`
      );
      if (!minInput && !maxInput) {
        pushUniqueReportItem(report.unknownFilterValues, `Chemical Composition: ${normalized}`);
        return;
      }
      if (minInput && minOut != null) minInput.value = String(minOut);
      if (maxInput && maxOut != null) maxInput.value = String(maxOut);
      state.compositionFilters[normalized] = {
        min: minOut,
        max: maxOut,
      };
    });
  }

  function applyImportedNumericRanges(rangesPayload, report) {
    if (dom.numericRangeInputs) {
      dom.numericRangeInputs.forEach((input) => {
        input.value = "";
      });
    }
    state.numericFilters = {};
    if (!rangesPayload || typeof rangesPayload !== "object") return;
    Object.keys(rangesPayload).forEach((key) => {
      const range = rangesPayload[key] || {};
      const minVal = parseNumber(range.min);
      const maxVal = parseNumber(range.max);
      if (minVal == null && maxVal == null) return;
      const minInput = dom.numericRangeInputs
        ? Array.from(dom.numericRangeInputs).find(
            (input) => input.dataset.rangeKey === key && input.dataset.rangeBound === "min"
          )
        : null;
      const maxInput = dom.numericRangeInputs
        ? Array.from(dom.numericRangeInputs).find(
            (input) => input.dataset.rangeKey === key && input.dataset.rangeBound === "max"
          )
        : null;
      if (!minInput && !maxInput) {
        pushUniqueReportItem(report.unmatchedControls, `Numeric range: ${key}`);
        return;
      }
      const normalizedMin =
        minVal != null && NON_NEGATIVE_RANGE_KEYS.has(key) ? Math.max(0, minVal) : minVal;
      const normalizedMax =
        maxVal != null && NON_NEGATIVE_RANGE_KEYS.has(key) ? Math.max(0, maxVal) : maxVal;
      let minOut = normalizedMin;
      let maxOut = normalizedMax;
      if (minOut != null && maxOut != null && minOut > maxOut) {
        const swap = minOut;
        minOut = maxOut;
        maxOut = swap;
      }
      state.numericFilters[key] = { min: minOut, max: maxOut };
      if (minInput && minOut != null) minInput.value = String(minOut);
      if (maxInput && maxOut != null) maxInput.value = String(maxOut);
    });
  }

  function applyImportedPlotOptions(plotPayload, report) {
    if (!plotPayload || typeof plotPayload !== "object") {
      pushUniqueReportItem(report.unmatchedControls, "Plot options payload missing");
      return;
    }
    if (plotPayload.units === "K" || plotPayload.units === "C") {
      state.units = plotPayload.units;
      syncUnitButtonsUi();
    }
    if (plotPayload.scale === "linear" || plotPayload.scale === "log") {
      state.scale = plotPayload.scale;
      syncScaleButtonsUi();
    }
    if (typeof plotPayload.envelope === "boolean") {
      state.envelope = plotPayload.envelope;
      if (dom.envelope) dom.envelope.checked = state.envelope;
    }
    if (typeof plotPayload.force_scatterband === "boolean") {
      state.forceScatterband = plotPayload.force_scatterband;
      if (dom.forceScatterband) dom.forceScatterband.checked = state.forceScatterband;
    }
    if (typeof plotPayload.numbering === "boolean") {
      state.numbering = plotPayload.numbering;
      if (dom.numbering) dom.numbering.checked = state.numbering;
    }
    if (typeof plotPayload.legend_by_source === "boolean") {
      state.legendBySource = plotPayload.legend_by_source;
      if (dom.legendGroup) dom.legendGroup.checked = state.legendBySource;
    }
    if (typeof plotPayload.monochrome === "boolean") {
      state.monochrome = plotPayload.monochrome;
      if (dom.monochrome) dom.monochrome.checked = state.monochrome;
    }
    if (typeof plotPayload.grid_x === "boolean") {
      state.gridX = plotPayload.grid_x;
      if (dom.gridX) dom.gridX.checked = state.gridX;
    }
    if (typeof plotPayload.grid_y === "boolean") {
      state.gridY = plotPayload.grid_y;
      if (dom.gridY) dom.gridY.checked = state.gridY;
    }
    if (plotPayload.line_thickness != null) {
      const value = clampValue(parseNumber(plotPayload.line_thickness) || 1, 0.5, 2);
      state.lineThickness = value;
      if (dom.lineThickness) dom.lineThickness.value = String(value);
      updateLineThicknessLabel();
    }
    if (plotPayload.marker_style != null) {
      state.markerStyle = normalizeMarkerStyle(plotPayload.marker_style);
      syncMarkerStyleUi();
    }
    report.applied.push("Plot options");
  }

  function findCategoricalListboxByAxisKey(axisKey) {
    if (!axisKey) return null;
    const target = String(axisKey).toLowerCase();
    return (
      Object.keys(AXIS_CATEGORICAL_DEFS).find((listboxId) => {
        const def = AXIS_CATEGORICAL_DEFS[listboxId];
        return String(def.axisKey || "").toLowerCase() === target;
      }) || null
    );
  }

  function applyImportedAxisState(axisPayload, report) {
    resetAxisMode();
    if (!axisPayload || typeof axisPayload !== "object") {
      syncAxisModeUi();
      return;
    }

    const mode =
      axisPayload.mode === AXIS_MODE_FILTER ? AXIS_MODE_FILTER : AXIS_MODE_TEMPERATURE;
    state.axisTempBehavior =
      axisPayload.temp_behavior === AXIS_TEMP_BEHAVIOR_SLICE
        ? AXIS_TEMP_BEHAVIOR_SLICE
        : AXIS_TEMP_BEHAVIOR_DISTRIBUTION;
    if (Number.isFinite(parseNumber(axisPayload.slice_temp_K))) {
      state.axisSliceTempK = parseNumber(axisPayload.slice_temp_K);
    }
    if (typeof axisPayload.color_scale === "string") {
      state.axisColorScale = getAxisColorScaleName(axisPayload.color_scale);
    }

    if (mode === AXIS_MODE_FILTER) {
      const config = axisPayload.config || {};
      const kind = config.kind;
      let activated = false;
      if (kind === "categorical") {
        const listboxId =
          config.listbox_id ||
          findCategoricalListboxByAxisKey(config.axis_key) ||
          null;
        if (listboxId && document.getElementById(listboxId)) {
          activateCategoricalAxis(listboxId, { preserveManual: true, replot: false });
          activated = true;
        }
      } else if (kind === "numeric") {
        const rangeKey = config.range_key || config.axis_key;
        const hasRangeControl =
          rangeKey === "year" ||
          !!Array.from(dom.numericRangeInputs || []).find(
            (input) => input.dataset.rangeKey === rangeKey
          );
        if (rangeKey && hasRangeControl) {
          activateNumericAxis(
            rangeKey,
            config.label || AXIS_NUMERIC_LABELS[rangeKey] || rangeKey,
            { preserveManual: true, replot: false }
          );
          activated = true;
        }
      } else if (kind === "composition") {
        const element = config.element || config.axis_key;
        const normalizedElement = normalizeElementSymbol(element);
        const hasElementControl = !!dom.filterComposition?.querySelector(
          `input[data-comp-element="${
            typeof CSS !== "undefined" && CSS.escape
              ? CSS.escape(normalizedElement)
              : normalizedElement.replace(/["\\]/g, "\\$&")
          }"][data-comp-bound="min"]`
        );
        if (element && hasElementControl) {
          activateCompositionAxis(element, config.label || `${element} [wt%]`, {
            preserveManual: true,
            replot: false,
          });
          activated = true;
        }
      }
      if (!activated) {
        pushUniqueReportItem(report.unmatchedControls, "Axis configuration could not be restored");
        resetAxisMode();
      }
    }
    syncAxisModeUi();
    report.applied.push("Axis settings");
  }

  function applyImportedZoom(zoomPayload, report) {
    if (!zoomPayload || typeof zoomPayload !== "object") {
      state.zoom = null;
      syncZoomInputs();
      return;
    }
    const xMin = parseNumber(zoomPayload.xMin);
    const xMax = parseNumber(zoomPayload.xMax);
    const yMin = parseNumber(zoomPayload.yMin);
    const yMax = parseNumber(zoomPayload.yMax);
    const hasAny =
      Number.isFinite(xMin) ||
      Number.isFinite(xMax) ||
      Number.isFinite(yMin) ||
      Number.isFinite(yMax);
    if (!hasAny) {
      state.zoom = null;
      syncZoomInputs();
      return;
    }
    if ((xMin != null && xMax != null && !(xMax > xMin)) || (yMin != null && yMax != null && !(yMax > yMin))) {
      pushUniqueReportItem(report.unmatchedControls, "Zoom range invalid and was ignored");
      state.zoom = null;
      syncZoomInputs();
      return;
    }
    state.zoom = { xMin, xMax, yMin, yMax };
    syncZoomInputs();
    report.applied.push("Zoom");
  }

  function resolveSeriesIdsForEntryId(entryId) {
    const normalized = String(entryId || "").trim();
    if (!normalized) return [];
    const direct = state.seriesByEntryId?.get(normalized) || [];
    if (direct.length) return direct.slice();
    const byId = state.seriesById.get(normalized);
    return byId ? [byId.id] : [];
  }

  function applyImportedAdditionalSelections(entryIdsPayload, report) {
    state.additionalSelectionIds = new Set();
    state.additionalSelectionEntryIds = [];
    if (!Array.isArray(entryIdsPayload)) return;
    const validEntryIds = [];
    entryIdsPayload.forEach((rawId) => {
      const entryId = String(rawId || "").trim();
      if (!entryId) return;
      const seriesIds = resolveSeriesIdsForEntryId(entryId);
      if (!seriesIds.length) {
        pushUniqueReportItem(report.missingSeriesIds, entryId);
        return;
      }
      validEntryIds.push(entryId);
      seriesIds.forEach((id) => {
        state.additionalSelectionIds.add(id);
      });
    });
    state.additionalSelectionEntryIds = Array.from(new Set(validEntryIds));
    if (state.additionalSelectionEntryIds.length) {
      report.applied.push(
        `Additional selections (${state.additionalSelectionEntryIds.length})`
      );
    }
  }

  function escapeHtmlList(items) {
    if (!items || !items.length) return "<p>None.</p>";
    const lines = items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return `<ul>${lines}</ul>`;
  }

  function showImportReportModal(report) {
    if (!dom.summary) return;
    const dbMeta = report.databaseMeta || {};
    const doi = dbMeta.doi || "";
    const doiUrl = toDoiUrl(doi);
    const doiHtml = doiUrl
      ? `<a class="hdd-inline-link" href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener">${escapeHtml(doiUrl)}</a>`
      : escapeHtml(doi || "Not provided");
    const guidance =
      report.unknownFilterValues.length ||
      report.missingSeriesIds.length ||
      report.unmatchedControls.length
        ? "Some settings could not be restored. If this is due to database mismatch, upload the referenced version via Upload Database."
        : "All imported settings were applied successfully.";
    dom.summary.innerHTML = `
      <div class="hdd-summary-report">
        <strong>Applied</strong>
        ${escapeHtmlList(report.applied)}
        <strong>Unknown Filter Values</strong>
        ${escapeHtmlList(report.unknownFilterValues)}
        <strong>Missing Series IDs</strong>
        ${escapeHtmlList(report.missingSeriesIds)}
        <strong>Unmatched Controls</strong>
        ${escapeHtmlList(report.unmatchedControls)}
        <strong>Hash Database Metadata</strong>
        <p>Version: ${escapeHtml(dbMeta.version || "Not provided")}<br/>Date: ${escapeHtml(
          dbMeta.date || "Not provided"
        )}<br/>DOI: ${doiHtml}</p>
        <p>${escapeHtml(guidance)}</p>
      </div>
    `;
    setSummaryModalTitle("Import Settings Report");
    state.summaryModalMode = "report";
    openSummaryModal();
  }

  function validateLegacyDatasetShape(payload) {
    const errors = [];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      errors.push("Top-level payload must be a JSON object.");
      return errors;
    }
    if (!Array.isArray(payload.lines)) {
      errors.push("Missing required top-level field: lines[]");
    }
    if (!payload.sources || typeof payload.sources !== "object" || Array.isArray(payload.sources)) {
      errors.push("Missing required top-level field: sources{}");
    }
    return errors;
  }

  function showLegacyDatabaseErrorModal(title, errors = []) {
    if (!dom.summary) {
      alert(`${title}\n${errors.join("\n")}`);
      return;
    }
    const doiUrl = toDoiUrl(getSettingsDoi());
    const doiHtml = doiUrl
      ? `<a class="hdd-inline-link" href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener">${escapeHtml(doiUrl)}</a>`
      : escapeHtml(getSettingsDoi());
    dom.summary.innerHTML = `
      <div class="hdd-summary-report">
        <strong>${escapeHtml(title)}</strong>
        ${escapeHtmlList(errors)}
        <p>Use a valid HDD public database JSON from Zenodo (${doiHtml}) or contact us if the problem persists.</p>
      </div>
    `;
    setSummaryModalTitle("Upload Database Failed");
    state.summaryModalMode = "report";
    openSummaryModal();
  }

  async function handleLegacyDatabaseUpload(event) {
    const input = event?.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > LEGACY_DB_MAX_BYTES) {
      showLegacyDatabaseErrorModal("Legacy database upload failed.", [
        `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum is 15 MB.`,
      ]);
      input.value = "";
      return;
    }

    try {
      const text = await file.text();
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        showLegacyDatabaseErrorModal("Legacy database upload failed.", [
          "File is not valid JSON.",
        ]);
        input.value = "";
        return;
      }
      const shapeErrors = validateLegacyDatasetShape(payload);
      if (shapeErrors.length) {
        showLegacyDatabaseErrorModal("Legacy database upload failed.", shapeErrors);
        input.value = "";
        return;
      }
      const loaded = loadDataset(payload, { sourceLabel: file.name, replot: true });
      if (!loaded) {
        showLegacyDatabaseErrorModal("Legacy database upload failed.", [
          "Could not initialize explorer from uploaded payload.",
        ]);
        input.value = "";
        return;
      }
      setShellState("ready");
      setStatus(`Loaded uploaded database: ${file.name}`, "ok");
    } catch (error) {
      showLegacyDatabaseErrorModal("Legacy database upload failed.", [
        error?.message || "Unexpected error while reading file.",
      ]);
    } finally {
      input.value = "";
    }
  }

  function formatFiltersSummary(filters) {
    if (!filters || !Object.keys(filters).length) return "none";
    const parts = [];
    const listToText = (value) => (Array.isArray(value) ? value.join(" | ") : String(value));
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value == null) return;
      if (typeof value === "object" && !Array.isArray(value)) {
        const inner = Object.keys(value)
          .map((innerKey) => {
            const innerValue = value[innerKey];
            if (innerValue && typeof innerValue === "object" && !Array.isArray(innerValue)) {
              const min = innerValue.min ?? "";
              const max = innerValue.max ?? "";
              return `${innerKey}=${min}-${max}`;
            }
            return `${innerKey}=${innerValue}`;
          })
          .join(" | ");
        if (inner) parts.push(`${key}: ${inner}`);
        return;
      }
      parts.push(`${key}: ${listToText(value)}`);
    });
    return parts.join("; ");
  }

  function normalizeElementSymbol(value) {
    if (value == null) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    const lettersOnly = raw.replace(/[^a-zA-Z]/g, "");
    if (!lettersOnly) return raw;
    if (lettersOnly.length <= 2) {
      return lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1).toLowerCase();
    }
    return lettersOnly.toUpperCase();
  }

  function formatCompositionFilters(filters) {
    if (!filters) return [];
    const parts = [];
    Object.keys(filters).forEach((element) => {
      const normalized = normalizeElementSymbol(element);
      if (!normalized) return;
      const range = filters[element] || {};
      const min = range.min;
      const max = range.max;
      if (min == null && max == null) return;
      if (min != null && max != null) {
        parts.push(`${normalized} ${min}-${max}`);
      } else if (min != null) {
        parts.push(`${normalized} >= ${min}`);
      } else if (max != null) {
        parts.push(`${normalized} <= ${max}`);
      }
    });
    return parts;
  }

  function buildCitation(sourceMeta, descriptor) {
    if (!sourceMeta) {
      return descriptor?.sourceTitle || descriptor?.sourceId || "";
    }
    const authors = Array.isArray(sourceMeta.authors) ? sourceMeta.authors : [];
    let authorText = "";
    if (authors.length > 1) {
      authorText = `${authors[0]} et al.`;
    } else if (authors.length === 1) {
      authorText = authors[0];
    }
    const title = sourceMeta.title || "";
    const year = sourceMeta.year != null ? String(sourceMeta.year) : "";
    const journal = sourceMeta.journal || "";
    const availability = sourceMeta.availability || "";
    const parts = [];
    if (authorText) parts.push(authorText);
    if (title) parts.push(title);
    if (year) parts.push(year);
    if (journal) parts.push(journal);
    if (availability) parts.push(availability);
    if (!parts.length) return descriptor?.sourceTitle || descriptor?.sourceId || "";
    return parts.join(" | ");
  }

  function cleanCsvField(value) {
    if (value == null) return "";
    let text = String(value);
    text = text.replace(/\r?\n|\r/g, " ");
    text = text.replace(/&ndash;|&mdash;/gi, "-");
    text = text.replace(/&alpha;/gi, "alpha");
    text = text.replace(/&beta;/gi, "beta");
    text = text.replace(/&gamma;/gi, "gamma");
    text = text.replace(/&delta;/gi, "delta");
    text = text.replace(/&amp;/gi, "&");
    text = text.replace(/&lt;/gi, "<");
    text = text.replace(/&gt;/gi, ">");
    text = text.replace(/&quot;/gi, "\"");
    text = text.replace(/&apos;/gi, "'");
    text = text.replace(/\u2013|\u2014|\u2212/g, "-");
    text = text.replace(/[;,]+/g, " | ");
    text = text.replace(/&[a-z]+;/gi, " ");
    return text.replace(/\s+/g, " ").trim();
  }

  function buildSvgMarker(x, y, radius, color, styleName) {
    const style = normalizeMarkerStyle(styleName);
    const r = Math.max(1.2, radius);
    const strokeWidth = Math.max(1, r * 0.45);
    if (style === MARKER_STYLE_HOLLOW) {
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    }
    if (style === MARKER_STYLE_X) {
      const arm = r * 0.9;
      return `<path d="M${x - arm} ${y - arm} L${x + arm} ${y + arm} M${x + arm} ${y - arm} L${x - arm} ${y + arm}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    }
    if (style === MARKER_STYLE_TRIANGLE) {
      const h = r * 1.2;
      const p1 = `${x} ${y - h}`;
      const p2 = `${x + r} ${y + r * 0.7}`;
      const p3 = `${x - r} ${y + r * 0.7}`;
      return `<polygon points="${p1} ${p2} ${p3}" fill="${color}"/>`;
    }
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  }

  function buildSvgExport(context) {
    if (context?.mode === "axis") {
      return buildAxisSvgExport(context);
    }
    const {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      fontAxis = 16,
      fontTick = 12,
      fontLegend = 11,
      fontLabel = 11,
      axisLabelOffset = 36,
      axisLabelXOffset = 15,
      lineWidth = 1.6,
      pointRadius = 2.4,
      markerStyle = MARKER_STYLE_FILLED,
      units,
      scale,
      gridX,
      gridY,
      numbering,
      envelope,
      monochrome,
      series,
    } = context;

    const xToPx = (value) =>
      margin.left + ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotWidth;
    const yToPx = (value) => {
      if (scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    };

    const parts = [];
    const svgFont = String(theme.font || "Calibri, Times New Roman, Arial, sans-serif").replace(/["']/g, "");
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family:${svgFont};">`
    );
    parts.push(`<rect width="100%" height="100%" fill="${theme.canvas}"/>`);
    parts.push(
      `<clipPath id="plot-clip"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`
    );

    if (gridX) {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinX + ((axisMaxX - axisMinX) / steps) * i;
        const x = xToPx(value);
        parts.push(
          `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${
            margin.top + plotHeight
          }" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
        );
      }
    }

    if (gridY) {
      if (scale === "linear") {
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
          const y = yToPx(value);
          parts.push(
            `<line x1="${margin.left}" y1="${y}" x2="${
              margin.left + plotWidth
            }" y2="${y}" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
          );
        }
      } else {
        const decadeMin = Math.floor(logMin);
        const decadeMax = Math.ceil(logMax);
        const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let decade = decadeMin; decade <= decadeMax; decade++) {
          for (const factor of factors) {
            const value = factor * Math.pow(10, decade);
            if (value < axisMinY || value > axisMaxY) continue;
            const y = yToPx(value);
            const major = factor === 1;
            parts.push(
              `<line x1="${margin.left}" y1="${y}" x2="${
                margin.left + plotWidth
              }" y2="${y}" stroke="${theme.line}" stroke-width="${
                major ? 1 : 0.8
              }" opacity="${major ? 0.85 : 0.6}"/>`
            );
          }
        }
      }
    }

    parts.push(
      `<rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="none" stroke="${theme.ink}" stroke-width="1.2"/>`
    );

    parts.push(
      `<text x="${margin.left + plotWidth / 2}" y="${
        margin.top + plotHeight + axisLabelOffset
        }" fill="${theme.ink}" font-size="${fontAxis}" text-anchor="middle">Temperature [${
        units === "C" ? "C" : "K"
      }]</text>`
    );
    parts.push(
      `<text x="${axisLabelXOffset}" y="${margin.top + plotHeight / 2}" fill="${theme.ink}" font-size="${fontAxis}" text-anchor="middle" transform="rotate(-90 ${axisLabelXOffset} ${
        margin.top + plotHeight / 2
      })">Diffusivity [mm²/s]</text>`
    );

    const xticks = 6;
    for (let i = 0; i <= xticks; i++) {
      const value = axisMinX + ((axisMaxX - axisMinX) / xticks) * i;
      const x = xToPx(value);
      parts.push(
        `<line x1="${x}" y1="${margin.top + plotHeight}" x2="${x}" y2="${
          margin.top + plotHeight + 6
        }" stroke="${theme.ink}" stroke-width="1"/>`
      );
      parts.push(
        `<text x="${x}" y="${margin.top + plotHeight + Math.round(fontTick + 10)}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="middle">${Math.round(
          value
        )}</text>`
      );
    }

    if (scale === "linear") {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        parts.push(
          `<line x1="${margin.left - 6}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.ink}" stroke-width="1"/>`
        );
        parts.push(
          `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="end">${value.toExponential(
            1
          )}</text>`
        );
      }
    } else {
      const decadeMin = Math.floor(logMin);
      const decadeMax = Math.ceil(logMax);
      const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let decade = decadeMin; decade <= decadeMax; decade++) {
        for (const factor of factors) {
          const value = factor * Math.pow(10, decade);
          if (value < axisMinY || value > axisMaxY) continue;
          const y = yToPx(value);
          const tickLen = factor === 1 ? 6 : 3;
          parts.push(
            `<line x1="${margin.left - tickLen}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.ink}" stroke-width="${factor === 1 ? 1 : 0.8}"/>`
          );
          if (factor === 1) {
            parts.push(
              `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="end">${value.toExponential(
                1
              )}</text>`
            );
          }
        }
      }
    }

    parts.push(`<g clip-path="url(#plot-clip)">`);
    if (envelope) {
      const buckets = {};
      series.forEach((item) => {
        const band = inferBand(item.descriptor);
        if (!band) return;
        const baseId = stripBand(item.descriptor.groupId);
        const key = `${baseId}::${item.seriesLabel}`;
        buckets[key] = buckets[key] || {};
        buckets[key][band] = item;
      });
      Object.values(buckets).forEach((bucket) => {
        if (!bucket.min || !bucket.max) return;
        const overlap = computeOverlap(bucket.min, bucket.max);
        if (!overlap.temps.length) return;
        const path = [];
        overlap.temps.forEach((temperature, idx) => {
          const x = xToPx(units === "C" ? temperature - 273.15 : temperature);
          const y = yToPx(overlap.maxVals[idx]);
          path.push(`${idx === 0 ? "M" : "L"}${x} ${y}`);
        });
        for (let i = overlap.temps.length - 1; i >= 0; i--) {
          const temperature = overlap.temps[i];
          const x = xToPx(units === "C" ? temperature - 273.15 : temperature);
          const y = yToPx(overlap.minVals[i]);
          path.push(`L${x} ${y}`);
        }
        path.push("Z");
        const envelopeFill = monochrome
          ? "rgba(60, 60, 60, 0.18)"
          : "rgba(15,118,110,0.18)";
        parts.push(`<path d="${path.join(" ")}" fill="${envelopeFill}"/>`);
      });
    }

    series.forEach((item, index) => {
      if (item.axisLineSegments?.length) {
        item.axisLineSegments.forEach((segment) => {
          if (segment.length < 2) return;
          const d = segment
            .map((point, idx) => {
              const x = xToPx(point.temperature_axis);
              const y = yToPx(point.diffusivity);
              return `${idx === 0 ? "M" : "L"}${x} ${y}`;
            })
            .join(" ");
          parts.push(
            `<path d="${d}" fill="none" stroke="${item.color}" stroke-width="${lineWidth}"/>`
          );
        });
      }
      if (item.axisPoints.length) {
        item.axisPoints.forEach((point) => {
          const x = xToPx(point.temperature_axis);
          const y = yToPx(point.diffusivity);
          parts.push(buildSvgMarker(x, y, pointRadius, item.color, markerStyle));
        });
      }
      if (numbering) {
        const lastPoint =
          item.axisLine[item.axisLine.length - 1] ||
          item.axisPoints[item.axisPoints.length - 1];
        if (lastPoint) {
          const labelIndex = Number.isFinite(item.legendIndex)
            ? item.legendIndex + 1
            : index + 1;
          parts.push(
            `<text x="${xToPx(lastPoint.temperature_axis) + 4}" y="${yToPx(
              lastPoint.diffusivity
            )}" fill="${item.color}" font-size="${fontLabel}" text-anchor="start">${labelIndex}</text>`
          );
        }
      }
    });
    parts.push(`</g>`);

    const legendX = margin.left + plotWidth + 10;
    let legendY = margin.top + 10;
    const maxY = margin.top + plotHeight - 12;
    const showSwatch = !monochrome;
    const textX = legendX + (showSwatch ? 14 : 0);
    const items = buildLegendItems(series);
    const lineHeight = Math.round(16 * (fontLegend / 11));
    const header = getLegendHeader();
    if (header) {
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.muted}" font-size="${fontLegend}" text-anchor="start">${escapeHtml(header)}</text>`
      );
      legendY += lineHeight;
    }
    const availableLines = Math.max(0, Math.floor((maxY - legendY) / lineHeight));
    const needsMore = items.length > availableLines;
    const displayCount = needsMore ? Math.max(0, availableLines - 1) : items.length;
    let i = 0;
    for (; i < items.length && i < displayCount; i++) {
      const item = items[i];
      if (showSwatch) {
        parts.push(
          `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${item.color}"/>`
        );
      }
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.ink}" font-size="${fontLegend}" text-anchor="start">${item.index + 1}. ${
          item.label
        }</text>`
      );
      legendY += lineHeight;
    }
      const label = needsMore ? `Show all ${items.length}` : "Show full list";
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.accent || theme.muted}" font-size="${fontLegend}" text-anchor="start">${label}</text>`
      );

      const footerLine = getDatabaseFooterLine();
      if (footerLine) {
        parts.push(
          `<text x="12" y="${height - 12}" fill="${theme.muted}" font-size="${fontLegend}" text-anchor="start">${escapeHtml(
            footerLine
          )}</text>`
        );
      }

      parts.push(`</svg>`);
      return parts.join("");
    }

  function buildAxisSvgExport(context) {
    const {
      width,
      height,
      margin,
      plotWidth,
      plotDataWidth = plotWidth,
      plotHeight,
      axisMinX,
      axisMaxX,
      axisMinY,
      axisMaxY,
      logMin,
      logMax,
      theme,
      fontAxis = 16,
      fontTick = 12,
      fontLegend = 11,
      fontLabel = 11,
      axisLabelOffset = 36,
      axisLabelXOffset = 15,
      lineWidth = 1.6,
      pointRadius = 2.4,
      markerStyle = MARKER_STYLE_FILLED,
      units,
      scale,
      gridX,
      gridY,
      numbering,
      monochrome,
      series,
      axisConfig = null,
      axisLabel = "Axis",
      axisTempBehavior = AXIS_TEMP_BEHAVIOR_DISTRIBUTION,
      axisColorScale = "blue-red",
      axisTempExtent = null,
      categoricalBuckets = [],
    } = context;

    const isCategorical = axisConfig?.kind === "categorical";
    const xToPx = (value) =>
      margin.left + ((value - axisMinX) / (axisMaxX - axisMinX || 1)) * plotDataWidth;
    const yToPx = (value) => {
      if (scale === "linear") {
        const ratio = (value - axisMinY) / (axisMaxY - axisMinY || 1);
        return margin.top + (1 - ratio) * plotHeight;
      }
      const logValue = Math.log10(value);
      const ratio = (logValue - logMin) / (logMax - logMin || 1);
      return margin.top + (1 - ratio) * plotHeight;
    };

    const parts = [];
    const svgFont = String(theme.font || "Calibri, Times New Roman, Arial, sans-serif").replace(/["']/g, "");
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family:${svgFont};">`
    );
    parts.push(`<rect width="100%" height="100%" fill="${theme.canvas}"/>`);
    parts.push(
      `<clipPath id="plot-clip"><rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"/></clipPath>`
    );
    if (
      axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
      !monochrome &&
      Number.isFinite(axisTempExtent?.min) &&
      Number.isFinite(axisTempExtent?.max)
    ) {
      parts.push(`<linearGradient id="axis-temp-grad" x1="0%" y1="100%" x2="0%" y2="0%">`);
      getAxisColorStops(axisColorScale).forEach((stop) => {
        parts.push(`<stop offset="${(stop.t * 100).toFixed(1)}%" stop-color="${stop.color}"/>`);
      });
      parts.push(`</linearGradient>`);
    }

    if (gridX) {
      if (isCategorical) {
        const count = categoricalBuckets.length;
        for (let i = 1; i < count; i++) {
          const x = xToPx(i - 0.5);
          parts.push(
            `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + plotHeight}" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
          );
        }
        const rightDelim = xToPx(Math.max(0, count - 0.5));
        parts.push(
          `<line x1="${rightDelim}" y1="${margin.top}" x2="${rightDelim}" y2="${margin.top + plotHeight}" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
        );
      } else {
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const value = axisMinX + ((axisMaxX - axisMinX) / steps) * i;
          const x = xToPx(value);
          parts.push(
            `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${
              margin.top + plotHeight
            }" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
          );
        }
      }
    }

    if (gridY) {
      if (scale === "linear") {
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
          const y = yToPx(value);
          parts.push(
            `<line x1="${margin.left}" y1="${y}" x2="${
              margin.left + plotWidth
            }" y2="${y}" stroke="${theme.line}" stroke-width="0.8" opacity="0.7"/>`
          );
        }
      } else {
        const decadeMin = Math.floor(logMin);
        const decadeMax = Math.ceil(logMax);
        const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let decade = decadeMin; decade <= decadeMax; decade++) {
          for (const factor of factors) {
            const value = factor * Math.pow(10, decade);
            if (value < axisMinY || value > axisMaxY) continue;
            const y = yToPx(value);
            const major = factor === 1;
            parts.push(
              `<line x1="${margin.left}" y1="${y}" x2="${
                margin.left + plotWidth
              }" y2="${y}" stroke="${theme.line}" stroke-width="${
                major ? 1 : 0.8
              }" opacity="${major ? 0.85 : 0.6}"/>`
            );
          }
        }
      }
    }

    parts.push(
      `<rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="none" stroke="${theme.ink}" stroke-width="1.2"/>`
    );
    parts.push(
      `<text x="${margin.left + plotWidth / 2}" y="${
        margin.top + plotHeight + axisLabelOffset
      }" fill="${theme.ink}" font-size="${fontAxis}" text-anchor="middle">${escapeHtml(axisLabel)}</text>`
    );
    parts.push(
      `<text x="${axisLabelXOffset}" y="${margin.top + plotHeight / 2}" fill="${theme.ink}" font-size="${fontAxis}" text-anchor="middle" transform="rotate(-90 ${axisLabelXOffset} ${
        margin.top + plotHeight / 2
      })">Diffusivity [mm²/s]</text>`
    );

    if (isCategorical) {
      const count = categoricalBuckets.length;
      for (let i = 0; i <= count; i++) {
        const x = xToPx(i - 0.5);
        parts.push(
          `<line x1="${x}" y1="${margin.top + plotHeight}" x2="${x}" y2="${
            margin.top + plotHeight + 6
          }" stroke="${theme.ink}" stroke-width="1"/>`
        );
      }
      const maxLabelChars = 16;
      categoricalBuckets.forEach((label, idx) => {
        const text = String(label || "");
        const compact = text.length > maxLabelChars ? `${text.slice(0, maxLabelChars - 3)}...` : text;
        const x = xToPx(idx);
        const y = margin.top + plotHeight + Math.round(fontTick + 12);
        parts.push(
          `<text x="${x}" y="${y}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="middle" transform="rotate(-25 ${x} ${y})">${escapeHtml(
            compact
          )}</text>`
        );
      });
    } else {
      const xticks = 6;
      for (let i = 0; i <= xticks; i++) {
        const value = axisMinX + ((axisMaxX - axisMinX) / xticks) * i;
        const x = xToPx(value);
        parts.push(
          `<line x1="${x}" y1="${margin.top + plotHeight}" x2="${x}" y2="${
            margin.top + plotHeight + 6
          }" stroke="${theme.ink}" stroke-width="1"/>`
        );
        parts.push(
          `<text x="${x}" y="${margin.top + plotHeight + Math.round(fontTick + 10)}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="middle">${Math.round(
            value
          )}</text>`
        );
      }
    }

    if (scale === "linear") {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const value = axisMinY + ((axisMaxY - axisMinY) / steps) * i;
        const y = yToPx(value);
        parts.push(
          `<line x1="${margin.left - 6}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.ink}" stroke-width="1"/>`
        );
        parts.push(
          `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="end">${value.toExponential(
            1
          )}</text>`
        );
      }
    } else {
      const decadeMin = Math.floor(logMin);
      const decadeMax = Math.ceil(logMax);
      const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let decade = decadeMin; decade <= decadeMax; decade++) {
        for (const factor of factors) {
          const value = factor * Math.pow(10, decade);
          if (value < axisMinY || value > axisMaxY) continue;
          const y = yToPx(value);
          const tickLen = factor === 1 ? 6 : 3;
          parts.push(
            `<line x1="${margin.left - tickLen}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="${theme.ink}" stroke-width="${factor === 1 ? 1 : 0.8}"/>`
          );
          if (factor === 1) {
            parts.push(
              `<text x="${margin.left - 10}" y="${y + 3}" fill="${theme.ink}" font-size="${fontTick}" text-anchor="end">${value.toExponential(
                1
              )}</text>`
            );
          }
        }
      }
    }

    parts.push(`<g clip-path="url(#plot-clip)">`);
    series.forEach((item, index) => {
      if (axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION && item.axisLineSegments?.length) {
        item.axisLineSegments.forEach((segment) => {
          if (!Array.isArray(segment) || segment.length < 2) return;
          for (let i = 0; i < segment.length - 1; i++) {
            const a = segment[i];
            const b = segment[i + 1];
            const ta = Number(a.temperature_K);
            const tb = Number(b.temperature_K);
            const tempMid = Number.isFinite(ta) && Number.isFinite(tb) ? (ta + tb) * 0.5 : ta;
            const segColor =
              axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
              !monochrome &&
              Number.isFinite(tempMid) &&
              Number.isFinite(axisTempExtent?.min) &&
              Number.isFinite(axisTempExtent?.max)
                ? temperatureToColor(tempMid, axisTempExtent.min, axisTempExtent.max, axisColorScale)
                : item.color;
            parts.push(
              `<line x1="${xToPx(a.x_axis)}" y1="${yToPx(a.diffusivity)}" x2="${xToPx(b.x_axis)}" y2="${yToPx(
                b.diffusivity
              )}" stroke="${segColor}" stroke-width="${lineWidth}"/>`
            );
          }
        });
      }
      item.axisPoints?.forEach((point) => {
        const pointTemp = Number(point.temperature_K);
        const pointColor =
          axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
          !monochrome &&
          Number.isFinite(pointTemp) &&
          Number.isFinite(axisTempExtent?.min) &&
          Number.isFinite(axisTempExtent?.max)
            ? temperatureToColor(pointTemp, axisTempExtent.min, axisTempExtent.max, axisColorScale)
            : item.color;
        parts.push(
          buildSvgMarker(
            xToPx(point.x_axis),
            yToPx(point.diffusivity),
            pointRadius,
            pointColor,
            markerStyle
          )
        );
      });
      if (numbering) {
        const lastPoint = item.axisLine?.[item.axisLine.length - 1] || item.axisPoints?.[item.axisPoints.length - 1];
        if (lastPoint) {
          const labelIndex = Number.isFinite(item.legendIndex) ? item.legendIndex + 1 : index + 1;
          parts.push(
            `<text x="${xToPx(lastPoint.x_axis) + 4}" y="${yToPx(lastPoint.diffusivity)}" fill="${
              item.color
            }" font-size="${fontLabel}" text-anchor="start">${labelIndex}</text>`
          );
        }
      }
    });
    parts.push(`</g>`);

    if (
      axisTempBehavior === AXIS_TEMP_BEHAVIOR_DISTRIBUTION &&
      !monochrome &&
      Number.isFinite(axisTempExtent?.min) &&
      Number.isFinite(axisTempExtent?.max)
    ) {
      const m = getAxisTempScaleMetrics(Math.max(0.8, fontTick / 12));
      const barHeight = Math.max(90, Math.round(plotHeight * 0.45));
      const stripStartX = margin.left + plotDataWidth;
      const stripWidth = Math.max(0, plotWidth - plotDataWidth);
      const laneOffset = stripWidth > m.inset ? (stripWidth - m.inset) * 0.5 : 0;
      const barX =
        stripWidth > m.barWidth
          ? stripStartX + laneOffset + m.leftPad
          : margin.left + plotWidth - m.barWidth - 16;
      const barY = margin.top + 22;
      const unitLabel = units === "C" ? "°C" : "K";
      parts.push(
        `<rect x="${barX}" y="${barY}" width="${m.barWidth}" height="${barHeight}" fill="url(#axis-temp-grad)" stroke="${theme.ink}" stroke-width="0.8"/>`
      );
      parts.push(
        `<text x="${barX + m.barWidth * 0.5}" y="${barY - 3}" fill="${theme.ink}" font-size="${m.titleFont}" text-anchor="middle">${escapeHtml(
          formatTemperatureValueForUnits(axisTempExtent.max, 0)
        )}</text>`
      );
      parts.push(
        `<text x="${barX + m.barWidth * 0.5}" y="${barY + barHeight + 15}" fill="${theme.ink}" font-size="${m.titleFont}" text-anchor="middle">${escapeHtml(
          formatTemperatureValueForUnits(axisTempExtent.min, 0)
        )}</text>`
      );
      parts.push(
        `<text x="${barX + m.barWidth + m.titleGap}" y="${barY + barHeight * 0.5}" fill="${theme.ink}" font-size="${m.titleFont}" text-anchor="middle" transform="rotate(90 ${
          barX + m.barWidth + m.titleGap
        } ${barY + barHeight * 0.5})">Temperature [${unitLabel}]</text>`
      );
    }

    const legendX = margin.left + plotWidth + 10;
    let legendY = margin.top + 10;
    const maxY = margin.top + plotHeight - 12;
    const showSwatch = !monochrome;
    const textX = legendX + (showSwatch ? 14 : 0);
    const items = buildLegendItems(series);
    const lineHeight = Math.round(16 * (fontLegend / 11));
    const header = getLegendHeader();
    if (header) {
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.muted}" font-size="${fontLegend}" text-anchor="start">${escapeHtml(header)}</text>`
      );
      legendY += lineHeight;
    }
    const availableLines = Math.max(0, Math.floor((maxY - legendY) / lineHeight));
    const needsMore = items.length > availableLines;
    const displayCount = needsMore ? Math.max(0, availableLines - 1) : items.length;
    let i = 0;
    for (; i < items.length && i < displayCount; i++) {
      const item = items[i];
      if (showSwatch) {
        parts.push(
          `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${item.color}"/>`
        );
      }
      parts.push(
        `<text x="${textX}" y="${legendY}" fill="${theme.ink}" font-size="${fontLegend}" text-anchor="start">${item.index + 1}. ${
          item.label
        }</text>`
      );
      legendY += lineHeight;
    }
    const label = needsMore ? `Show all ${items.length}` : "Show full list";
    parts.push(
      `<text x="${textX}" y="${legendY}" fill="${theme.accent || theme.muted}" font-size="${fontLegend}" text-anchor="start">${label}</text>`
    );
    const footerLine = getDatabaseFooterLine();
    if (footerLine) {
      parts.push(
        `<text x="12" y="${height - 12}" fill="${theme.muted}" font-size="${fontLegend}" text-anchor="start">${escapeHtml(
          footerLine
        )}</text>`
      );
    }
    parts.push(`</svg>`);
    return parts.join("");
  }

  function matchesValue(selected, value, mode = "include") {
    if (!selected.length) return true;
    const hasValue = selected.includes(value);
    return mode === "exclude" ? !hasValue : hasValue;
  }

  function hasLiteratureCompilation(entry) {
    const methods = entry.meta?.measurement_method;
    if (!methods || !methods.size) return false;
    for (const method of methods) {
      if (String(method).toLowerCase() === "literature compilation") return true;
    }
    return false;
  }

  function hasWeldedMaterial(entry) {
    const values = entry.meta?.welded_enabled;
    if (!values || !values.size) return false;
    for (const value of values) {
      if (String(value).toLowerCase() === "yes") return true;
    }
    return false;
  }

  function addIfPresent(set, value) {
    if (value == null) return;
    if (typeof value === "string" && !value.trim()) return;
    if (typeof value === "string" && value.toLowerCase() === "not_reported") return;
    set.add(value);
  }

  function first(set) {
    if (!set || !set.size) return null;
    return Array.from(set)[0];
  }

  function formatRange(range) {
    const value = formatRangeValue(range);
    if (!value) return "";
    return ` - ${value}`;
  }

  function formatRangeValueForUnits(range, units) {
    if (!range || range.length !== 2) return "";
    if (range[0] == null || range[1] == null) return "";
    const minK = Number(range[0]);
    const maxK = Number(range[1]);
    if (!Number.isFinite(minK) || !Number.isFinite(maxK)) return "";
    const useC = units === "C";
    const unitLabel = useC ? "°C" : "K";
    const min = useC ? minK - 273.15 : minK;
    const max = useC ? maxK - 273.15 : maxK;
    const minLabel = min.toFixed(0);
    const maxLabel = max.toFixed(0);
    if (minLabel === maxLabel) {
      return `${minLabel} ${unitLabel}`;
    }
    return `${minLabel}-${maxLabel} ${unitLabel}`;
  }

  function formatRangeValue(range) {
    if (!range || range.length !== 2) return "";
    if (range[0] == null || range[1] == null) return "";
    const min = Number(range[0]);
    const max = Number(range[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "";
    const minLabel = min.toFixed(0);
    const maxLabel = max.toFixed(0);
    if (minLabel === maxLabel) {
      return `${minLabel} K`;
    }
    return `${minLabel}-${maxLabel} K`;
  }

  function seriesDisplayLabel(entry) {
    return entry?.label || entry?.sourceTitle || entry?.groupId || "Series";
  }

  function buildSourceLabel(entry) {
    const source = entry?.sourceTitle || entry?.groupId || "Source";
    const label = entry?.label || "Line";
    return `${source} - ${label}`;
  }

  function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
  }

  function clampTemperature(value, clamp, isMax = false) {
    if (!isFiniteNumber(value)) return null;
    if (clamp == null) return value;
    return isMax ? Math.min(value, clamp) : Math.max(value, clamp);
  }

  function isWithinClamp(value, min, max) {
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  }

  function clampValue(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
      ink: styles.getPropertyValue("--plot-ink").trim() || "#111827",
      muted: styles.getPropertyValue("--plot-muted").trim() || "#6b7280",
      line: styles.getPropertyValue("--plot-line").trim() || "#d1d5db",
      canvas: styles.getPropertyValue("--plot-canvas").trim() || "#f9fafb",
      accent: styles.getPropertyValue("--accent").trim() || "#0f766e",
      font:
        styles.getPropertyValue("--plot-font").trim() ||
        "Calibri, Times New Roman, Arial, sans-serif",
    };
  }

  function failLoudly(message) {
    console.error(message);
    setStatus(message, "error");
    if (dom.summary) {
      dom.summary.innerHTML = `<strong>Data issue detected.</strong><p>${message}</p>`;
    }
  }
})();
