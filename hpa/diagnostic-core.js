(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.HPADiagnosticCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const SOLVER_POLICY = {
    minTerms: 3,
    maxTerms: 100,
    relTolerance: 1e-10,
    absTolerance: 1e-14,
    timeoutMs: 5000,
    dLower: 1e-16,
    dUpper: 1e-4,
  };

  const SEARCH_POLICY = {
    maxRows: 140,
    flatnessSampleRows: 10,
    candidateLimit: 120,
    minCentralFraction: 0.4,
  };
  const ROW_ORIGIN_MEASURED = "measured";
  const ROW_ORIGIN_PREPENDED_BASELINE = "prepended_baseline";

  function analyzeDiagnostic(input) {
    const sourceRows = sortRows(Array.isArray(input && input.rows) ? input.rows : []);
    const thicknessMm = toFiniteNumber(input && input.thicknessMm);
    const thicknessMeters = Number.isFinite(thicknessMm) ? thicknessMm / 1000 : null;
    const cropRange = normalizeCropRange(input && input.cropRange);
    const currentState = normalizeState(input);
    const searchRows = sampleEvenly(sourceRows, SEARCH_POLICY.maxRows);
    const currentCandidate = evaluateCandidate({
      rows: searchRows,
      thicknessMm,
      cropRange,
      candidate: currentState,
      label: "current",
      detailLevel: "search",
    });
    const rawChecks = analyzeRawChecks(sourceRows, currentState, cropRange, thicknessMeters);
    const candidates = buildCandidateStates(sourceRows, currentState);
    const evaluated = [];

    candidates.forEach((candidate) => {
      const result = evaluateCandidate({
        rows: searchRows,
        thicknessMm,
        cropRange,
        candidate,
        label: candidate.label,
        detailLevel: "search",
      });
      if (result) evaluated.push(result);
    });

    if (currentCandidate) {
      const key = candidateKey(currentCandidate);
      if (!evaluated.some((entry) => candidateKey(entry) === key)) {
        evaluated.push(currentCandidate);
      }
    }

    evaluated.sort((a, b) => a.score.composite - b.score.composite);
    const bestCandidate = evaluated[0] || null;
    const topCandidates = evaluated.slice(0, 5).map((entry, index) => summarizeCandidate(entry, index === 0));

    return buildReport({
      sourceRows,
      currentState,
      cropRange,
      thicknessMm,
      thicknessMeters,
      currentCandidate,
      bestCandidate,
      topCandidates,
      rawChecks,
    });
  }

  function normalizeState(input) {
    return {
      baselineValue: toFiniteNumber(input && input.baselineValue),
      steadyValue: toFiniteNumber(input && input.steadyValue),
      t0Offset: toFiniteNumber(input && input.t0Offset) || 0,
    };
  }

  function normalizeCropRange(cropRange) {
    if (!cropRange) return null;
    const start = toFiniteNumber(cropRange.start);
    const end = toFiniteNumber(cropRange.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    return { start, end };
  }

  function analyzeRawChecks(rows, currentState, cropRange, thicknessMeters) {
    const cleanRows = rows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current));
    const issues = [];
    const warnings = [];
    const notes = [];

    if (cleanRows.length < 4) {
      issues.push("Too few rows for a stable diagnostic.");
    }

    let duplicateTimeCount = 0;
    let nonIncreasingCount = 0;
    let largeGapCount = 0;
    let maxGap = 0;
    let previousTime = null;
    for (const row of cleanRows) {
      if (previousTime != null) {
        const gap = row.time - previousTime;
        if (gap <= 0) {
          nonIncreasingCount += 1;
          if (gap === 0) duplicateTimeCount += 1;
        }
        if (gap > maxGap) maxGap = gap;
      }
      previousTime = row.time;
    }

    const timeSpan = cleanRows.length > 1 ? cleanRows[cleanRows.length - 1].time - cleanRows[0].time : 0;
    const typicalGap = cleanRows.length > 1 ? timeSpan / Math.max(cleanRows.length - 1, 1) : 0;
    const largeGapThreshold = typicalGap > 0 ? typicalGap * 12 : 0;
    if (largeGapThreshold > 0) {
      for (let i = 1; i < cleanRows.length; i += 1) {
        const gap = cleanRows[i].time - cleanRows[i - 1].time;
        if (gap > largeGapThreshold) largeGapCount += 1;
      }
    }

    if (duplicateTimeCount) {
      warnings.push("The time column contains duplicate values.");
    }
    if (nonIncreasingCount) {
      warnings.push("The time column is not strictly increasing.");
    }
    if (largeGapCount) {
      notes.push("The time series contains large gaps.");
    }

    const trend = analyzeTailTrend(cleanRows, currentState);
    const baselineCandidate = trend.baselineCandidate;
    const steadyCandidate = trend.steadyCandidate;
    const denom = steadyCandidate - baselineCandidate;
    const normalizedRows = cleanRows
      .map((row) => ({
        time: row.time,
        current: row.current,
        normalized: Number.isFinite(denom) && denom !== 0 ? (row.current - baselineCandidate) / denom : null,
      }))
      .filter((row) => Number.isFinite(row.time));

    let belowZero = 0;
    let aboveOne = 0;
    let negativeDerivativeFraction = 0;
    let smoothedDrops = 0;
    let smoothedCount = 0;
    const smoothed = movingAverage(normalizedRows.map((row) => row.normalized).filter(Number.isFinite), 5);
    for (const row of normalizedRows) {
      if (!Number.isFinite(row.normalized)) continue;
      if (row.normalized < -1e-9) belowZero += 1;
      if (row.normalized > 1 + 1e-9) aboveOne += 1;
    }
    for (let i = 1; i < smoothed.length; i += 1) {
      const prev = smoothed[i - 1];
      const curr = smoothed[i];
      if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
      smoothedCount += 1;
      if (curr < prev) smoothedDrops += 1;
    }
    negativeDerivativeFraction = smoothedCount > 0 ? smoothedDrops / smoothedCount : 0;

    const firstWindow = trend.firstWindow;
    const lastWindow = trend.lastWindow;
    const firstSlope = trend.firstSlope;
    const lastSlope = trend.lastSlope;
    const baselineNoise = stddev(firstWindow.map((row) => row.current));
    const signalSpan = trend.signalSpan;
    const snr = baselineNoise > 0 ? signalSpan / baselineNoise : Number.POSITIVE_INFINITY;
    const baselineWindowSpan = trend.baselineWindowSpan;
    const steadyWindowSpan = trend.steadyWindowSpan;
    const baselineRelativeSlope = trend.baselineRelativeSlope;
    const steadyRelativeSlope = trend.steadyRelativeSlope;

    if (baselineNoise > 0 && snr < 5) {
      warnings.push("The signal is only weakly above the baseline noise.");
    }
    if (baselineRelativeSlope > 0.05) {
      notes.push("The baseline segment still has measurable slope.");
    }
    if (steadyRelativeSlope > 0.03) {
      notes.push(trend.tailStillRising ? "The tail segment is still rising." : "The tail segment is not perfectly flat.");
    }
    if (belowZero || aboveOne) {
      warnings.push("The normalized curve extends outside the physical 0 to 1 range.");
    }

    const gapNote =
      largeGapCount > 0
        ? "The file contains large time gaps, so interpolation-sensitive diagnostics should be treated cautiously."
        : null;

    return {
      rowCount: cleanRows.length,
      timeSpan,
      duplicateTimeCount,
      nonIncreasingCount,
      largeGapCount,
      maxGap,
      baselineSlope: firstSlope,
      steadySlope: lastSlope,
      baselineRelativeSlope,
      steadyRelativeSlope,
      baselineNoise,
      snr,
      belowZeroCount: belowZero,
      aboveOneCount: aboveOne,
      negativeDerivativeFraction,
      signalSpan,
      tailStillRising: trend.tailStillRising,
      risingTailSuggestedSteadyValue: trend.risingTailSuggestedSteadyValue,
      risingTailSuggestedSteadyDelta: trend.risingTailSuggestedSteadyDelta,
      risingTailSuggestedSteadyPercent: trend.risingTailSuggestedSteadyPercent,
      gapNote,
      issues,
      warnings,
      notes,
      baselineCandidate,
      steadyCandidate,
      denom,
      normalizedRows,
      cropRange,
      thicknessMeters,
    };
  }

  function analyzeTailTrend(rows, currentState) {
    const cleanRows = sortRows((Array.isArray(rows) ? rows : []).filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current)));
    const baselineCandidate = finiteOrFallback(currentState && currentState.baselineValue, minCurrent(cleanRows));
    const steadyCandidate = finiteOrFallback(currentState && currentState.steadyValue, maxCurrent(cleanRows));
    const firstWindowSize = Math.max(5, Math.ceil(cleanRows.length * 0.12));
    const lastWindowSize = Math.max(5, Math.ceil(cleanRows.length * 0.12));
    const firstWindow = windowSlice(cleanRows, 0, firstWindowSize);
    const lastWindow = windowSlice(cleanRows, Math.max(0, cleanRows.length - lastWindowSize), cleanRows.length);
    const firstSlope = linearSlope(firstWindow, "current");
    const lastSlope = linearSlope(lastWindow, "current");
    const signalSpan = Number.isFinite(steadyCandidate) && Number.isFinite(baselineCandidate) ? Math.abs(steadyCandidate - baselineCandidate) : 0;
    const baselineWindowSpan = firstWindow.length > 1 ? firstWindow[firstWindow.length - 1].time - firstWindow[0].time : 0;
    const steadyWindowSpan = lastWindow.length > 1 ? lastWindow[lastWindow.length - 1].time - lastWindow[0].time : 0;
    const baselineRelativeSlope = signalSpan > 0 ? Math.abs(firstSlope) * Math.max(baselineWindowSpan, 1) / signalSpan : 0;
    const steadyRelativeSlope = signalSpan > 0 ? Math.abs(lastSlope) * Math.max(steadyWindowSpan, 1) / signalSpan : 0;
    const tailRiseFraction = signalSpan > 0 ? Math.max(lastSlope * Math.max(steadyWindowSpan, 1), 0) / signalSpan : 0;
    const tailStillRising = Number.isFinite(lastSlope) && lastSlope > 0 && (steadyRelativeSlope > 0.03 || tailRiseFraction > 0.03);
    const maxValue = maxCurrent(cleanRows);
    let risingTailSuggestedSteadyValue = null;
    let risingTailSuggestedSteadyDelta = null;
    let risingTailSuggestedSteadyPercent = null;

    if (tailStillRising && Number.isFinite(maxValue)) {
      const projectedIncrease = Math.max(lastSlope * Math.max(steadyWindowSpan, 1) * 1.5, 0);
      const minIncrease = signalSpan > 0 ? signalSpan * 0.02 : 0;
      const maxIncrease = signalSpan > 0 ? Math.max(signalSpan * 0.2, minIncrease) : projectedIncrease;
      const suggestedIncrease = signalSpan > 0 ? clamp(projectedIncrease, minIncrease, maxIncrease) : projectedIncrease;
      risingTailSuggestedSteadyValue = maxValue + suggestedIncrease;
      risingTailSuggestedSteadyDelta = suggestedIncrease;
      risingTailSuggestedSteadyPercent = maxValue !== 0 ? (suggestedIncrease / Math.abs(maxValue)) * 100 : null;
    }

    return {
      baselineCandidate,
      steadyCandidate,
      firstWindow,
      lastWindow,
      firstSlope,
      lastSlope,
      signalSpan,
      baselineWindowSpan,
      steadyWindowSpan,
      baselineRelativeSlope,
      steadyRelativeSlope,
      tailStillRising,
      risingTailSuggestedSteadyValue,
      risingTailSuggestedSteadyDelta,
      risingTailSuggestedSteadyPercent,
    };
  }

  function buildCandidateStates(rows, currentState) {
    const current = {
      label: "current",
      baselineValue: currentState.baselineValue,
      steadyValue: currentState.steadyValue,
      t0Offset: currentState.t0Offset,
    };

    const values = rows.map((row) => row.current).filter(Number.isFinite);
    const trend = analyzeTailTrend(rows, currentState);
    const firstWindow = trend.firstWindow;
    const lastWindow = trend.lastWindow;
    const firstMean = mean(firstWindow.map((row) => row.current));
    const lastMean = mean(lastWindow.map((row) => row.current));
    const firstTrimmed = trimmedMean(firstWindow.map((row) => row.current));
    const lastTrimmed = trimmedMean(lastWindow.map((row) => row.current));
    const minValue = minCurrent(rows);
    const maxValue = maxCurrent(rows);
    const risingTailCandidate = trend.tailStillRising && Number.isFinite(trend.risingTailSuggestedSteadyValue) && trend.risingTailSuggestedSteadyValue > maxValue
      ? trend.risingTailSuggestedSteadyValue
      : null;
    const baselineCandidates = uniqueFinite([
      currentState.baselineValue,
      minValue,
      percentile(values, 0.05),
      firstMean,
      firstTrimmed,
    ]);
    const steadyCandidates = uniqueFinite([
      currentState.steadyValue,
      maxValue,
      percentile(values, 0.95),
      lastMean,
      lastTrimmed,
      risingTailCandidate,
    ]);
    const t0Candidates = uniqueFinite(buildT0Candidates(rows, currentState.t0Offset));
    const candidates = [];

    for (const baselineValue of baselineCandidates) {
      for (const steadyValue of steadyCandidates) {
        if (!Number.isFinite(baselineValue) || !Number.isFinite(steadyValue) || steadyValue <= baselineValue) continue;
        for (const t0Offset of t0Candidates) {
          candidates.push({
            label: `${formatKeyNumber(t0Offset)} / ${formatKeyNumber(baselineValue)} / ${formatKeyNumber(steadyValue)}`,
            baselineValue,
            steadyValue,
            t0Offset,
          });
        }
      }
    }

    candidates.unshift(current);
    return uniqueCandidates(candidates)
      .sort((a, b) => candidateDistance(a, currentState) - candidateDistance(b, currentState))
      .slice(0, SEARCH_POLICY.candidateLimit);
  }

  function buildT0Candidates(rows, currentOffset) {
    const cleanRows = rows.filter((row) => Number.isFinite(row.time));
    if (!cleanRows.length) return [currentOffset || 0];
    const timeSpan = cleanRows[cleanRows.length - 1].time - cleanRows[0].time;
    const range = clamp(Math.max(30, timeSpan * 0.12), 30, 180);
    const step = clamp(Math.max(5, range / 6), 5, 20);
    const base = Number.isFinite(currentOffset) ? currentOffset : 0;
    const candidates = [];
    for (let offset = -range; offset <= range + 1e-9; offset += step) {
      candidates.push(base + offset);
    }
    candidates.push(base);
    [-30, -20, -10, 10, 20, 30].forEach((offset) => candidates.push(base + offset));
    return candidates;
  }

  function evaluateCandidate(options) {
    const rows = Array.isArray(options.rows) ? options.rows : [];
    const thicknessMm = toFiniteNumber(options.thicknessMm);
    const thicknessMeters = Number.isFinite(thicknessMm) ? thicknessMm / 1000 : null;
    const cropRange = normalizeCropRange(options.cropRange);
    const candidate = options.candidate || {};
    const baselineValue = toFiniteNumber(candidate.baselineValue);
    const steadyValue = toFiniteNumber(candidate.steadyValue);
    const t0Offset = toFiniteNumber(candidate.t0Offset) || 0;
    const label = options.label || "candidate";

    if (!rows.length || !Number.isFinite(baselineValue) || !Number.isFinite(steadyValue) || steadyValue <= baselineValue) {
      return null;
    }

    let candidateRows = applyTimeOffsetRows(rows, t0Offset, baselineValue);
    if (cropRange) candidateRows = candidateRows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end);
    candidateRows = sortRows(candidateRows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current)));
    if (candidateRows.length < 4) return null;

    const denom = steadyValue - baselineValue;
    const normalizedRows = candidateRows.map((row) => ({
      time: row.time,
      current: row.current,
      normalized: (row.current - baselineValue) / denom,
    }));
    const normalizedEpsilon = 1e-9;
    const normalizedValid = normalizedRows.filter((row) => Number.isFinite(row.normalized));
    const outOfRangeCount = normalizedValid.filter((row) => row.normalized <= normalizedEpsilon || row.normalized >= 1 - normalizedEpsilon).length;
    const belowZeroCount = normalizedValid.filter((row) => row.normalized < -1e-9).length;
    const aboveOneCount = normalizedValid.filter((row) => row.normalized > 1 + 1e-9).length;
    const normalizedAvailable = Number.isFinite(denom) && denom > 0 && normalizedValid.length >= 4;
    const normalizedWithin = normalizedValid.filter((row) => row.normalized >= 0.02 && row.normalized <= 0.98);
    const centralWindow = selectCentralWindow(normalizedValid);
    const thicknessAvailable = Number.isFinite(thicknessMeters) && thicknessMeters > 0;
    const classical = normalizedAvailable && thicknessAvailable ? buildClassicalResults(normalizedRows, thicknessMeters, denom, baselineValue) : buildEmptyClassicalResults();
    const fit = normalizedAvailable && thicknessAvailable ? buildFitResult(candidateRows, thicknessMm, baselineValue, steadyValue, t0Offset) : buildEmptyFitResult();
    const flatness = normalizedAvailable && thicknessAvailable ? evaluateFlatness(normalizedRows, thicknessMeters, centralWindow) : buildEmptyFlatness();
    const plateau = evaluatePlateau(candidateRows, baselineValue, steadyValue);
    const monotonicity = evaluateMonotonicity(candidateRows);
    const methodAgreement = evaluateMethodAgreement(classical, fit);
    const score = composeScore({
      methodAgreement,
      flatness,
      plateau,
      monotonicity,
      fit,
      rawExcursions: {
        belowZeroCount,
        aboveOneCount,
        outOfRangeCount,
      },
      snr: plateau.snr,
    });

    return {
      label,
      baselineValue,
      steadyValue,
      t0Offset,
      rows: candidateRows,
      normalizedRows,
      normalizedAvailable,
      denom,
      classical,
      fit,
      flatness,
      plateau,
      monotonicity,
      methodAgreement,
      score,
      centralWindow,
      rawExcursions: {
        belowZeroCount,
        aboveOneCount,
        outOfRangeCount,
      },
      sample: normalizedWithin.slice(0, 20),
    };
  }

  function selectCentralWindow(rows) {
    const clean = rows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized)).sort((a, b) => a.time - b.time);
    if (!clean.length) {
      return { rows: [], low: 0.3, high: 0.7, note: "No normalized data available." };
    }

    const minCount = Math.max(4, Math.ceil(clean.length * SEARCH_POLICY.minCentralFraction));
    let low = 0.3;
    let high = 0.7;
    let selected = clean.filter((row) => row.normalized >= low && row.normalized <= high);
    while (selected.length < minCount && (low > 0 || high < 1)) {
      low = Math.max(0, low - 0.05);
      high = Math.min(1, high + 0.05);
      selected = clean.filter((row) => row.normalized >= low && row.normalized <= high);
      if (low === 0 && high === 1) break;
    }

    if (!selected.length) {
      const start = Math.floor(clean.length * 0.3);
      const end = Math.ceil(clean.length * 0.7);
      selected = clean.slice(start, Math.max(start + 1, end));
      low = 0.3;
      high = 0.7;
    }

    return {
      rows: selected,
      low,
      high,
      fraction: clean.length ? selected.length / clean.length : 0,
      note: selected.length < minCount ? "Central window was widened as much as possible." : null,
    };
  }

  function evaluateFlatness(normalizedRows, thicknessMeters, window) {
    const rows = (window && window.rows ? window.rows : []).filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized));
    if (rows.length < 3 || !Number.isFinite(thicknessMeters) || thicknessMeters <= 0) {
      return buildEmptyFlatness();
    }

    const sampled = sampleEvenly(rows, SEARCH_POLICY.flatnessSampleRows);
    const diffusivities = sampled
      .map((row) => {
        const value = solveApparentDiffusivity(row.normalized, row.time, thicknessMeters);
        return Number.isFinite(value) ? value : null;
      })
      .filter(Number.isFinite);
    if (diffusivities.length < 3) {
      return buildEmptyFlatness();
    }

    const logValues = diffusivities.map((value) => Math.log10(value));
    const slope = linearSlope(
      sampled
        .map((row, index) => ({ time: row.time, diffusivity: diffusivities[index] }))
        .filter((row) => Number.isFinite(row.diffusivity)),
    );
    const center = median(diffusivities);
    const spread = stddev(logValues);
    const ratio = Math.max(...diffusivities) / Math.max(Math.min(...diffusivities), Number.EPSILON);
    const slopeScore = Number.isFinite(slope) ? Math.abs(slope) : 0;
    const score = spread + slopeScore * 0.02 + Math.log10(Math.max(ratio, 1));

    return {
      available: true,
      score,
      spread,
      slope,
      ratio,
      median: center,
      sampleCount: diffusivities.length,
      low: window.low,
      high: window.high,
      fraction: window.fraction,
      note: window.note,
    };
  }

  function solveApparentDiffusivity(normalized, timeSeconds, thicknessMeters, deadline) {
    if (!Number.isFinite(normalized) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (timeSeconds <= 0 || thicknessMeters <= 0) return null;
    if (normalized < -1e-9 || normalized > 1 + 1e-9) return null;

    const target = clamp(normalized, 1e-12, 1 - 1e-12);
    let lower = SOLVER_POLICY.dLower;
    let upper = SOLVER_POLICY.dUpper;
    let lowerEval = evaluateFickResponseDetailed(lower, timeSeconds, thicknessMeters, deadline);
    let upperEval = evaluateFickResponseDetailed(upper, timeSeconds, thicknessMeters, deadline);
    if (!lowerEval || !upperEval || !Number.isFinite(lowerEval.value) || !Number.isFinite(upperEval.value)) return null;

    if (target <= lowerEval.value) return lower;
    if (target >= upperEval.value) return upper;

    let best = null;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      if (deadline && Date.now() > deadline) return best;
      const mid = Math.sqrt(lower * upper);
      const midEval = evaluateFickResponseDetailed(mid, timeSeconds, thicknessMeters, deadline);
      if (!midEval || !Number.isFinite(midEval.value)) return best;
      best = mid;
      const error = midEval.value - target;
      const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(target)));
      if (Math.abs(error) <= tolerance) return mid;
      if (midEval.value < target) {
        lower = mid;
        lowerEval = midEval;
      } else {
        upper = mid;
        upperEval = midEval;
      }
      if (upper / lower <= 1 + 1e-12) return mid;
    }
    void lowerEval;
    void upperEval;
    return best;
  }

  function evaluatePlateau(rows, baselineValue, steadyValue) {
    const clean = rows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current));
    if (clean.length < 4) {
      return { available: false, note: "Not enough points for plateau analysis.", snr: 0 };
    }

    const firstWindow = windowSlice(clean, 0, Math.max(5, Math.ceil(clean.length * 0.12)));
    const lastWindow = windowSlice(clean, Math.max(0, clean.length - Math.max(5, Math.ceil(clean.length * 0.12))), clean.length);
    const tailSlope = linearSlope(lastWindow, "current");
    const headSlope = linearSlope(firstWindow, "current");
    const signal = Math.abs(steadyValue - baselineValue);
    const baselineNoise = stddev(firstWindow.map((row) => row.current));
    const snr = baselineNoise > 0 ? signal / baselineNoise : Number.POSITIVE_INFINITY;
    const relativeTailSlope = signal > 0 ? Math.abs(tailSlope) * Math.max(lastWindow[lastWindow.length - 1].time - lastWindow[0].time, 1) / signal : 0;
    const relativeHeadSlope = signal > 0 ? Math.abs(headSlope) * Math.max(firstWindow[firstWindow.length - 1].time - firstWindow[0].time, 1) / signal : 0;

    return {
      available: true,
      tailSlope,
      headSlope,
      relativeTailSlope,
      relativeHeadSlope,
      baselineNoise,
      snr,
      note:
        snr < 5
          ? "The signal only weakly exceeds the baseline noise."
          : relativeTailSlope > 0.03
            ? "The tail is still drifting and may not have reached a true plateau."
            : null,
    };
  }

  function evaluateMonotonicity(rows) {
    const clean = rows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.current));
    if (clean.length < 3) {
      return { available: false, note: "Not enough points for monotonicity analysis." };
    }
    const smoothed = movingAverage(clean.map((row) => row.current), 5);
    let drops = 0;
    let steps = 0;
    let maxDrop = 0;
    for (let i = 1; i < smoothed.length; i += 1) {
      const prev = smoothed[i - 1];
      const curr = smoothed[i];
      if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
      steps += 1;
      if (curr < prev) {
        drops += 1;
        maxDrop = Math.max(maxDrop, prev - curr);
      }
    }
    return {
      available: true,
      negativeFraction: steps > 0 ? drops / steps : 0,
      maxDrop,
      note: drops > 0 ? "The smoothed transient is not strictly monotonic." : null,
    };
  }

  function evaluateMethodAgreement(classical, fit) {
    const values = [];
    if (classical && classical.timeLag && classical.timeLag.available) values.push(classical.timeLag.diffusivity);
    if (classical && classical.inflection && classical.inflection.available) values.push(classical.inflection.diffusivity);
    if (classical && classical.inverseFickian && classical.inverseFickian.available) values.push(classical.inverseFickian.diffusivity);
    if (fit && fit.available) values.push(fit.diffusivity);
    const clean = values.filter((value) => Number.isFinite(value) && value > 0);
    if (clean.length < 2) {
      return { available: false, note: "Not enough method results for consistency scoring." };
    }
    const logs = clean.map((value) => Math.log10(value));
    const spread = stddev(logs);
    const ratio = Math.max(...clean) / Math.max(Math.min(...clean), Number.EPSILON);
    return {
      available: true,
      spread,
      ratio,
      note:
        spread < 0.08
          ? "The diagnostic diffusivity estimates cluster tightly."
          : spread < 0.2
            ? "The diagnostic diffusivity estimates are moderately consistent."
            : "The diagnostic diffusivity estimates disagree substantially.",
    };
  }

  function composeScore(parts) {
    const agreement = parts.methodAgreement && parts.methodAgreement.available ? clamp(parts.methodAgreement.spread / 0.12, 0, 5) : 5;
    const flatness = parts.flatness && parts.flatness.available ? clamp(parts.flatness.score / 0.18, 0, 5) : 5;
    const fit = parts.fit && parts.fit.available ? clamp(parts.fit.rmse / 0.08, 0, 5) : 5;
    const plateau = parts.plateau && parts.plateau.available ? clamp(parts.plateau.relativeTailSlope * 6, 0, 5) : 3;
    const monotonicity = parts.monotonicity && parts.monotonicity.available ? clamp(parts.monotonicity.negativeFraction * 6, 0, 5) : 2;
    const excursions = parts.rawExcursions
      ? clamp(((parts.rawExcursions.belowZeroCount || 0) + (parts.rawExcursions.aboveOneCount || 0)) * 0.15, 0, 5)
      : 0;
    const snrPenalty = Number.isFinite(parts.snr) && parts.snr > 0 ? clamp(8 / parts.snr, 0, 5) : 5;
    const composite =
      agreement * 0.35 +
      flatness * 0.35 +
      fit * 0.12 +
      plateau * 0.08 +
      monotonicity * 0.05 +
      excursions * 0.03 +
      snrPenalty * 0.02;
    return {
      composite,
      agreement,
      flatness,
      fit,
      plateau,
      monotonicity,
      excursions,
      snrPenalty,
    };
  }

  function buildReport(context) {
    const best = context.bestCandidate || null;
    const current = context.currentCandidate || null;
    const raw = context.rawChecks || {};
    const topCandidates = Array.isArray(context.topCandidates) ? context.topCandidates : [];
    const findings = [];

    if (raw.warnings && raw.warnings.length) {
      raw.warnings.forEach((message) => findings.push(makeFinding("warning", "Data quality", message)));
    }
    if (best && best.methodAgreement && best.methodAgreement.note) {
      findings.push(makeFinding(best.methodAgreement.spread < 0.08 ? "ok" : "warning", "Method agreement", best.methodAgreement.note));
    }
    if (best && best.flatness && best.flatness.note) {
      findings.push(makeFinding(best.flatness.available && best.flatness.score < 0.35 ? "ok" : "warning", "D_app flatness", best.flatness.note));
    }
    if (best && best.plateau && best.plateau.note) {
      findings.push(makeFinding(best.plateau.snr >= 5 && best.plateau.relativeTailSlope <= 0.05 ? "ok" : "warning", "Plateau", best.plateau.note));
    }
    if (best && best.monotonicity && best.monotonicity.note) {
      findings.push(makeFinding(best.monotonicity.negativeFraction < 0.1 ? "ok" : "warning", "Monotonicity", best.monotonicity.note));
    }
    if (raw && raw.tailStillRising) {
      findings.push(makeFinding("warning", "Steady state", buildRisingTailNote(raw)));
    }

    const currentSummary = summarizeCandidate(current, false);
    const bestSummary = summarizeCandidate(best, true);
    const bestText = buildBestText(bestSummary, raw);
    const confidence = best ? clamp(100 - best.score.composite * 15, 0, 100) : 0;
    const severity = confidence >= 75 ? "ok" : confidence >= 50 ? "warning" : "critical";

    return {
      hasData: !!(context.sourceRows && context.sourceRows.length),
      severity,
      summary: bestText,
      confidence,
      current: currentSummary,
      best: bestSummary,
      findings: dedupeFindings(findings),
      topCandidates,
      rawChecks: compactRawChecks(raw),
      comparison: buildComparison(current, best),
      recommendations: buildRecommendations(current, best, raw),
      snapshot: {
        baselineValue: context.currentState.baselineValue,
        steadyValue: context.currentState.steadyValue,
        t0Offset: context.currentState.t0Offset,
        cropRange: context.cropRange ? { start: context.cropRange.start, end: context.cropRange.end } : null,
      },
    };
  }

  function compactRawChecks(raw) {
    return {
      rowCount: raw.rowCount || 0,
      timeSpan: raw.timeSpan || 0,
      duplicateTimeCount: raw.duplicateTimeCount || 0,
      nonIncreasingCount: raw.nonIncreasingCount || 0,
      largeGapCount: raw.largeGapCount || 0,
      baselineSlope: raw.baselineSlope || 0,
      steadySlope: raw.steadySlope || 0,
      baselineNoise: raw.baselineNoise || 0,
      snr: raw.snr || 0,
      belowZeroCount: raw.belowZeroCount || 0,
      aboveOneCount: raw.aboveOneCount || 0,
      negativeDerivativeFraction: raw.negativeDerivativeFraction || 0,
      signalSpan: raw.signalSpan || 0,
      tailStillRising: !!raw.tailStillRising,
      risingTailSuggestedSteadyValue: raw.risingTailSuggestedSteadyValue || null,
      risingTailSuggestedSteadyDelta: raw.risingTailSuggestedSteadyDelta || null,
      risingTailSuggestedSteadyPercent: raw.risingTailSuggestedSteadyPercent || null,
      gapNote: raw.gapNote || null,
    };
  }

  function buildComparison(current, best) {
    if (!current || !best) {
      return null;
    }
    return {
      t0Delta: best.t0Offset - current.t0Offset,
      baselineDelta: best.baselineValue - current.baselineValue,
      steadyDelta: best.steadyValue - current.steadyValue,
      scoreDelta: current.score ? current.score.composite - best.score.composite : null,
    };
  }

  function buildRecommendations(current, best, raw) {
    const messages = [];
    if (raw && raw.tailStillRising) {
      messages.push(buildRisingTailNote(raw));
    }
    if (!best) return messages;
    if (raw && Number.isFinite(raw.baselineRelativeSlope) && raw.baselineRelativeSlope > 0.05) {
      messages.push(`The baseline segment still shows measurable slope (${formatSigned(raw.baselineSlope)} current units per second).`);
    }
    if (raw && Number.isFinite(raw.steadyRelativeSlope) && raw.steadyRelativeSlope > 0.03) {
      messages.push(`The tail segment still shows measurable slope (${formatSigned(raw.steadySlope)} current units per second).`);
    }
    if (Math.abs(best.t0Offset - (current ? current.t0Offset : 0)) > 0.5) {
      messages.push(
        best.t0Offset > (current ? current.t0Offset : 0)
          ? "The transient appears to start before the selected time zero."
          : "The file appears to include pre-run time before the active transient.",
      );
    }
    if (current && Number.isFinite(best.baselineValue) && Number.isFinite(current.baselineValue) && Math.abs(best.baselineValue - current.baselineValue) > Math.abs(current.baselineValue || 1) * 0.03) {
      messages.push("The selected baseline appears to be offset from the best self-consistent value.");
    }
    if (current && Number.isFinite(best.steadyValue) && Number.isFinite(current.steadyValue) && Math.abs(best.steadyValue - current.steadyValue) > Math.abs(current.steadyValue || 1) * 0.03) {
      messages.push("The selected steady-state level appears to be offset from the best self-consistent value.");
    }
    if (best.flatness && best.flatness.available && best.flatness.score < 0.18 && best.methodAgreement && best.methodAgreement.spread < 0.08) {
      messages.push("The data are consistent with a single effective Fickian diffusivity under the selected preprocessing.");
    } else if (best.flatness && best.flatness.available && best.flatness.score < 0.35) {
      messages.push("The data partially support a single effective Fickian diffusivity, but residual structure remains.");
    } else {
      messages.push("The data only weakly support a single effective Fickian diffusivity under the selected preprocessing.");
    }
    if (raw && raw.snr < 5) {
      messages.push("The signal is weak relative to the baseline noise, so any diagnosis remains tentative.");
    }
    if (raw && raw.negativeDerivativeFraction > 0.15) {
      messages.push("The smoothed curve contains repeated downward steps, which may indicate noise or interrupted charging.");
    }
    if (raw && raw.gapNote) {
      messages.push(raw.gapNote);
    }
    return dedupeStrings(messages);
  }

  function buildBestText(best, raw) {
    if (!best) {
      return "No stable diagnostic candidate could be found.";
    }
    const parts = [];
    if (raw && raw.tailStillRising) {
      parts.push("The tail is still rising, so the steady-state level may be above the measured maximum.");
    }
    if (Math.abs(best.t0Offset) > 0.5) {
      parts.push(`Best time offset ${formatSigned(best.t0Offset)} s.`);
    } else {
      parts.push("Best time offset is close to zero.");
    }
    if (best.methodAgreement && best.methodAgreement.note) parts.push(best.methodAgreement.note);
    if (best.flatness && best.flatness.note) parts.push(best.flatness.note);
    if (raw && raw.snr < 5) parts.push("Baseline noise remains high relative to the signal span.");
    return parts.join(" ");
  }

  function buildRisingTailNote(raw) {
    if (!raw || !raw.tailStillRising) {
      return "We estimate the steady state is above the measured maximum. The experiment may have been stopped too early. Consider setting the steady-state threshold higher.";
    }
    const percent = Number.isFinite(raw.risingTailSuggestedSteadyPercent) ? raw.risingTailSuggestedSteadyPercent : null;
    const suggested = Number.isFinite(raw.risingTailSuggestedSteadyValue) ? raw.risingTailSuggestedSteadyValue : null;
    if (percent != null) {
      const suggestionText = suggested != null ? ` Suggested steady-state threshold: ${formatNumber(suggested)} current units.` : "";
      return `We estimate the steady state is about ${formatNumber(percent)}% above the measured maximum.${suggestionText} The experiment may have been stopped too early. Consider setting the steady-state threshold higher.`;
    }
    if (suggested != null) {
      return `We estimate the steady state is above the measured maximum. Suggested steady-state threshold: ${formatNumber(suggested)} current units. The experiment may have been stopped too early. Consider setting the steady-state threshold higher.`;
    }
    return "We estimate the steady state is above the measured maximum. The experiment may have been stopped too early. Consider setting the steady-state threshold higher.";
  }

  function summarizeCandidate(candidate, isBest) {
    if (!candidate) {
      return null;
    }
    return {
      label: candidate.label || (isBest ? "best" : "candidate"),
      baselineValue: candidate.baselineValue,
      steadyValue: candidate.steadyValue,
      t0Offset: candidate.t0Offset,
      score: candidate.score ? candidate.score.composite : null,
      confidence: candidate.score ? clamp(100 - candidate.score.composite * 15, 0, 100) : null,
      methodSpread: candidate.methodAgreement && candidate.methodAgreement.available ? candidate.methodAgreement.spread : null,
      methodAgreement: candidate.methodAgreement
        ? {
            available: !!candidate.methodAgreement.available,
            spread: candidate.methodAgreement.spread,
            ratio: candidate.methodAgreement.ratio,
            note: candidate.methodAgreement.note,
          }
        : null,
      flatnessScore: candidate.flatness && candidate.flatness.available ? candidate.flatness.score : null,
      flatnessWindow: candidate.flatness && candidate.flatness.available ? { low: candidate.flatness.low, high: candidate.flatness.high, fraction: candidate.flatness.fraction } : null,
      flatness: candidate.flatness
        ? {
            available: !!candidate.flatness.available,
            score: candidate.flatness.score,
            spread: candidate.flatness.spread,
            slope: candidate.flatness.slope,
            ratio: candidate.flatness.ratio,
            note: candidate.flatness.note,
            sampleCount: candidate.flatness.sampleCount,
          }
        : null,
      plateauSlope: candidate.plateau && candidate.plateau.available ? candidate.plateau.relativeTailSlope : null,
      plateau: candidate.plateau
        ? {
            available: !!candidate.plateau.available,
            tailSlope: candidate.plateau.tailSlope,
            headSlope: candidate.plateau.headSlope,
            relativeTailSlope: candidate.plateau.relativeTailSlope,
            relativeHeadSlope: candidate.plateau.relativeHeadSlope,
            snr: candidate.plateau.snr,
            note: candidate.plateau.note,
          }
        : null,
      snr: candidate.plateau && candidate.plateau.available ? candidate.plateau.snr : null,
      fitD: candidate.fit && candidate.fit.available ? candidate.fit.diffusivity : null,
      fitRmse: candidate.fit && candidate.fit.available ? candidate.fit.rmse : null,
      fit: candidate.fit
        ? {
            available: !!candidate.fit.available,
            diffusivity: candidate.fit.diffusivity,
            rmse: candidate.fit.rmse,
            timeOffset: candidate.fit.timeOffset,
            note: candidate.fit.note,
            timeHtml: candidate.fit.timeHtml,
            count: candidate.fit.count,
          }
        : null,
      classical: candidate.classical || null,
    };
  }

  function dedupeFindings(items) {
    return items.filter(Boolean).filter((item, index, array) => array.findIndex((other) => other.title === item.title && other.text === item.text) === index);
  }

  function makeFinding(severity, title, text) {
    return { severity, title, text };
  }

  function candidateKey(candidate) {
    if (!candidate) return "";
    return [candidate.baselineValue, candidate.steadyValue, candidate.t0Offset].map((value) => formatKeyNumber(value)).join("|");
  }

  function candidateDistance(candidate, currentState) {
    if (!candidate || !currentState) return Number.POSITIVE_INFINITY;
    const baseline = Number.isFinite(candidate.baselineValue) && Number.isFinite(currentState.baselineValue)
      ? Math.abs(candidate.baselineValue - currentState.baselineValue)
      : 0;
    const steady = Number.isFinite(candidate.steadyValue) && Number.isFinite(currentState.steadyValue)
      ? Math.abs(candidate.steadyValue - currentState.steadyValue)
      : 0;
    const t0 = Number.isFinite(candidate.t0Offset) && Number.isFinite(currentState.t0Offset)
      ? Math.abs(candidate.t0Offset - currentState.t0Offset)
      : 0;
    return baseline + steady + t0 * 0.25;
  }

  function uniqueCandidates(candidates) {
    const seen = new Set();
    const list = [];
    for (const candidate of candidates) {
      const key = candidateKey(candidate);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(candidate);
    }
    return list;
  }

  function buildClassicalResults(rows, thicknessMeters, iMax) {
    const sorted = sortRows(rows.filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized) && Number.isFinite(row.current)));
    const breakthrough = solveBreakthroughMethod(sorted, thicknessMeters);
    const timeLag = solveThresholdMethod(sorted, thicknessMeters, 0.63, 6, "Time lag (63%)", "D = L<sup>2</sup> / (6 t<sub>lag</sub>)");
    const inflection = solveInflectionMethod(sorted, thicknessMeters, iMax);
    const inverseFickian = solveInverseFickianWindow(sorted, thicknessMeters);
    return { breakthrough, timeLag, inflection, inverseFickian };
  }

  function buildEmptyClassicalResults() {
    return {
      breakthrough: { available: false, note: "Load data to calculate breakthrough time." },
      timeLag: { available: false, note: "Load data to calculate time lag." },
      inflection: { available: false, note: "Load data to calculate the inflection point." },
      inverseFickian: { available: false, note: "Load data to estimate the inverse Fickian window." },
    };
  }

  function buildEmptyFlatness() {
    return { available: false, score: null, note: "No stable flatness window found." };
  }

  function buildEmptyFitResult() {
    return { available: false, note: "Load data to fit D for the current Start Time Offset." };
  }

  function solveBreakthroughMethod(rows, thicknessMeters) {
    const breakthrough = findBreakthroughTime(rows);
    if (!breakthrough) {
      return { available: false, note: "No linear breakthrough segment could be identified." };
    }
    const diffusivity = (thicknessMeters * thicknessMeters) / (15.3 * breakthrough.time);
    return {
      available: Number.isFinite(diffusivity) && diffusivity > 0,
      diffusivity,
      timeText: `Breakthrough: t = ${formatNumber(breakthrough.time)} s`,
      noteHtml:
        '<span class="hpa-formula-note"><span class="hpa-formula-title">ISO 17081 linear-rise extrapolation</span><span class="hpa-formula-display"><span class="hpa-formula-equals">D =</span> <span class="hpa-formula-expression">L<sup>2</sup> / (15.3 t<sub>b</sub>)</span></span></span>',
      note: "ISO 17081 linear-rise extrapolation.",
    };
  }

  function solveThresholdMethod(rows, thicknessMeters, threshold, coefficient, label, formulaHtml) {
    const crossing = findCrossingTime(rows, threshold);
    if (!crossing) {
      return { available: false, note: `${label} not found in the normalized curve.` };
    }
    const diffusivity = (thicknessMeters * thicknessMeters) / (coefficient * crossing.time);
    return {
      available: Number.isFinite(diffusivity) && diffusivity > 0,
      diffusivity,
      timeText: `${label}: t = ${formatNumber(crossing.time)} s`,
      noteHtml: formulaHtml || `${label} threshold ${Math.round(threshold * 100)}%.`,
    };
  }

  function solveInflectionMethod(rows, thicknessMeters, iMax) {
    const inflection = findInflectionPoint(rows, 0.2442);
    if (!inflection) {
      return { available: false, note: "No clear inflection point could be detected." };
    }
    if (!Number.isFinite(iMax) || iMax <= 0) {
      return { available: false, note: "Inflection-point method requires a valid steady-state current." };
    }
    const diffusivity = (0.04124 * thicknessMeters * thicknessMeters * inflection.slope) / (0.2442 * iMax);
    return {
      available: Number.isFinite(diffusivity) && diffusivity > 0,
      diffusivity,
      timeText: `t = ${formatNumber(inflection.time)} s`,
      noteHtml:
        '<span class="hpa-formula-display"><span class="hpa-formula-equals">D =</span><span class="hpa-formula-fraction"><span class="hpa-formula-numerator">0.04124 L<sup>2</sup> (dI/dt)</span><span class="hpa-formula-denominator">0.2442 (I<sub>max</sub> - I<sub>min</sub>)</span></span></span>',
      note: "D = 0.04124 L^2 (dI/dt) / [0.2442 (I_max - I_min)]",
    };
  }

  function solveInverseFickianWindow(rows, thicknessMeters) {
    const points = rows
      .map((row) => ({ time: row.time, diffusivity: row.diffusivity, normalized: row.normalized }))
      .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.diffusivity) && Number.isFinite(row.normalized));
    const sampledPoints = sampleEvenly(points, 120);
    if (sampledPoints.length < 8) {
      return { available: false, note: "Not enough inverse-solve points to judge an inverse Fickian window." };
    }

    const window = chooseStableWindow(sampledPoints);
    if (!window) {
      return { available: false, note: "No stable inverse Fickian window found." };
    }

    const values = window.points.map((point) => point.diffusivity);
    const robustValue = trimmedMean(values);
    if (!Number.isFinite(robustValue) || robustValue <= SOLVER_POLICY.dLower * 10 || robustValue >= SOLVER_POLICY.dUpper / 10) {
      return { available: false, note: "Inverse-solve values are pinned near the numerical bounds, so no stable inverse window is reported." };
    }
    const span = window.points[window.points.length - 1].time - window.points[0].time;
    return {
      available: true,
      diffusivity: robustValue,
      timeHtml: Number.isFinite(span)
        ? `<span><span style="font-style:italic;">D</span><sub>Inv</sub> stable over ${escapeHtml(formatNumber(span))} s</span>`
        : `<span><span style="font-style:italic;">D</span><sub>Inv</sub> stable over detected window</span>`,
      note: `Detected stable inverse window: ${formatNumber(window.points[0].time)} to ${formatNumber(window.points[window.points.length - 1].time)} s.`,
    };
  }

  function chooseStableWindow(points) {
    return chooseStableWindowWithMinSize(points, Math.max(8, Math.ceil(points.length * 0.3))) || chooseStableWindowWithMinSize(points, 8);
  }

  function chooseStableWindowWithMinSize(points, minWindowSize) {
    let best = null;
    const maxWindowSize = Math.min(points.length, Math.max(minWindowSize, Math.ceil(points.length * 0.8)));
    const totalSpan = Math.max(points[points.length - 1].time - points[0].time, Number.EPSILON);
    for (let windowSize = maxWindowSize; windowSize >= minWindowSize; windowSize -= 1) {
      for (let start = 0; start <= points.length - windowSize; start += 1) {
        const candidate = points.slice(start, start + windowSize);
        const values = candidate.map((point) => point.diffusivity).filter((value) => Number.isFinite(value));
        if (values.length < windowSize) continue;
        const normalizedMedian = median(candidate.map((point) => point.normalized));
        if (!Number.isFinite(normalizedMedian) || normalizedMedian <= 0.02 || normalizedMedian >= 0.98) continue;
        const center = trimmedMean(values);
        const spread = iqr(values) / Math.max(Math.abs(center), Number.EPSILON);
        const slope = Math.abs(linearSlope(candidate)) * Math.max(candidate[candidate.length - 1].time - candidate[0].time, 1) / Math.max(Math.abs(center), Number.EPSILON);
        if (!Number.isFinite(center) || spread > 0.18 || slope > 0.18) continue;
        const candidateSpan = Math.max(candidate[candidate.length - 1].time - candidate[0].time, 0);
        const spanFraction = candidateSpan / totalSpan;
        const countFraction = candidate.length / points.length;
        const midpointFraction = ((candidate[0].time + candidate[candidate.length - 1].time) / 2 - points[0].time) / totalSpan;
        const score =
          spread * 1.4 +
          slope * 1.15 +
          Math.abs(normalizedMedian - 0.5) * 0.12 +
          (1 - countFraction) * 0.45 +
          (1 - spanFraction) * 0.45 +
          Math.abs(midpointFraction - 0.5) * 0.08;
        if (!best || score < best.score || (Math.abs(score - best.score) < 0.003 && (windowSize > best.points.length || candidateSpan > best.span))) {
          best = { points: candidate, score, span: candidateSpan };
        }
      }
    }
    return best;
  }

  function buildFitResult(fitRows, thicknessMm, baselineValue, steadyValue, currentT0Offset) {
    const thicknessMeters = thicknessMm / 1000;
    if (!Number.isFinite(thicknessMeters) || thicknessMeters <= 0) {
      return { available: false, note: "The fit requires a valid membrane thickness." };
    }

    const prepared = prepareFitRows(fitRows, baselineValue, steadyValue);
    if (prepared.error) {
      return { available: false, note: prepared.error };
    }

    const best = solveFixedFit(prepared, thicknessMeters, Date.now() + SOLVER_POLICY.timeoutMs);
    if (!best) {
      return { available: false, note: "No stable D fit could be found for the current Start Time Offset." };
    }

    const rmse = Math.sqrt(best.sse / Math.max(best.count, 1));
    const note =
      Number.isFinite(prepared.lastNormalized) && prepared.lastNormalized < 0.9
        ? "Steady state is not fully reached, so the fit extrapolates the asymptote from the fixed references."
        : "";

    return {
      available: true,
      diffusivity: best.diffusivity,
      totalTimeOffset: Number.isFinite(currentT0Offset) ? currentT0Offset : 0,
      timeText: `RMSE over ${best.count} points: ${formatFitRmsePercent(rmse)} (${describeFitQuality(rmse)})`,
      note,
      rmse,
      count: best.count,
      timeOffset: 0,
    };
  }

  function optimizeFitT0(options) {
    const rows = Array.isArray(options && options.rows) ? options.rows : [];
    const thicknessMm = options && Number.isFinite(options.thicknessMm) ? options.thicknessMm : null;
    const baselineValue = options ? options.baselineValue : null;
    const steadyValue = options ? options.steadyValue : null;
    const cropRange = options && options.cropRange ? options.cropRange : null;
    const minOffset = options && Number.isFinite(options.minOffset) ? options.minOffset : -180;
    const maxOffset = options && Number.isFinite(options.maxOffset) ? options.maxOffset : 180;
    const coarseStep = options && Number.isFinite(options.coarseStep) && options.coarseStep > 0 ? options.coarseStep : 1;
    const fineStep = options && Number.isFinite(options.fineStep) && options.fineStep > 0 ? options.fineStep : 0.1;
    const deadline = options && Number.isFinite(options.deadline) ? options.deadline : null;
    if (!rows.length || !Number.isFinite(thicknessMm) || thicknessMm <= 0) return null;

    let best = null;
    let lastSeed = null;
    for (let totalTimeOffset = minOffset; totalTimeOffset <= maxOffset + 1e-9; totalTimeOffset += coarseStep) {
      if (deadline && Date.now() > deadline) break;
      const candidate = evaluateFitTimeOffsetCandidate(
        rows,
        thicknessMm,
        baselineValue,
        steadyValue,
        cropRange,
        roundToStep(totalTimeOffset, coarseStep),
        deadline,
        lastSeed,
      );
      if (candidate) lastSeed = { diffusivity: candidate.diffusivity };
      if (!best || (candidate && candidate.rmse < best.rmse)) {
        best = candidate;
      }
    }
    if (!best) return null;

    const refineRadius = Math.max(coarseStep, 1);
    const refineLower = Math.max(minOffset, best.totalTimeOffset - refineRadius);
    const refineUpper = Math.min(maxOffset, best.totalTimeOffset + refineRadius);
    for (let totalTimeOffset = refineLower; totalTimeOffset <= refineUpper + 1e-9; totalTimeOffset += fineStep) {
      if (deadline && Date.now() > deadline) break;
      const candidate = evaluateFitTimeOffsetCandidate(
        rows,
        thicknessMm,
        baselineValue,
        steadyValue,
        cropRange,
        roundToStep(totalTimeOffset, fineStep),
        deadline,
        { diffusivity: best.diffusivity },
      );
      if (!best || (candidate && candidate.rmse < best.rmse)) {
        best = candidate;
      }
    }

    return best;
  }

  function evaluateFitTimeOffsetCandidate(rows, thicknessMm, baselineValue, steadyValue, cropRange, totalTimeOffset, deadline, seed) {
    let transformedRows = applyTimeOffsetRows(rows, totalTimeOffset, baselineValue);
    if (cropRange) transformedRows = transformedRows.filter((row) => row.time >= cropRange.start && row.time <= cropRange.end);
    const prepared = prepareFitRows(transformedRows, baselineValue, steadyValue);
    if (prepared.error) return null;
    const best = solveFixedFit(prepared, thicknessMm / 1000, deadline, seed);
    if (!best) return null;
    return {
      diffusivity: best.diffusivity,
      count: best.count,
      sse: best.sse,
      rmse: Math.sqrt(best.sse / Math.max(best.count, 1)),
      totalTimeOffset,
    };
  }

  function prepareFitRows(fitRows, baselineValue, steadyValue) {
    const rows = sortRows(
      (fitRows || [])
        .map((row) => ({ time: row.time, current: row.current, origin: rowOrigin(row, ROW_ORIGIN_MEASURED) }))
        .filter(
          (row) =>
            Number.isFinite(row.time) &&
            Number.isFinite(row.current) &&
            row.origin !== ROW_ORIGIN_PREPENDED_BASELINE,
        ),
    );

    if (rows.length < 4) {
      return { error: "Not enough measured points to fit D for the current Start Time Offset." };
    }
    if (!Number.isFinite(baselineValue) || !Number.isFinite(steadyValue)) {
      return { error: "The fit requires fixed baseline and steady-state values." };
    }
    const denom = steadyValue - baselineValue;
    if (!Number.isFinite(denom) || denom <= 0) {
      return { error: "The fit requires a positive baseline-to-steady-state span." };
    }

    const normalizedRows = rows
      .map((row) => ({ time: row.time, normalized: (row.current - baselineValue) / denom }))
      .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized));

    if (normalizedRows.length < 4) {
      return { error: "Not enough normalized measured points to fit D for the current Start Time Offset." };
    }

    return {
      rows,
      normalizedRows,
      sampledRows: sampleEvenly(normalizedRows, 160),
      lastNormalized: normalizedRows[normalizedRows.length - 1]?.normalized,
    };
  }

  function solveFixedFit(prepared, thicknessMeters, deadline, seed) {
    if (!prepared || !Array.isArray(prepared.sampledRows) || !prepared.sampledRows.length) return null;
    if (!Number.isFinite(thicknessMeters) || thicknessMeters <= 0) return null;
    const nextSeed = seed && Number.isFinite(seed.diffusivity) ? seed : estimateFitSeed(prepared.sampledRows, thicknessMeters);
    return optimizeDiffusivitySearch(prepared.sampledRows, thicknessMeters, nextSeed, deadline);
  }

  function optimizeDiffusivitySearch(rows, thicknessMeters, seed, deadline) {
    if (!rows.length || !Number.isFinite(thicknessMeters) || thicknessMeters <= 0) return null;

    const minLog = Math.log10(SOLVER_POLICY.dLower);
    const maxLog = Math.log10(SOLVER_POLICY.dUpper);
    let logCenter = seed && Number.isFinite(seed.diffusivity) ? Math.log10(clamp(seed.diffusivity, SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper)) : (minLog + maxLog) / 2;
    let logHalfRange = seed && Number.isFinite(seed.diffusivity) ? 1.0 : (maxLog - minLog) / 2;
    let best = null;

    const stages = [17, 13, 9, 7];
    for (const steps of stages) {
      const stageLogLower = clamp(logCenter - logHalfRange, minLog, maxLog);
      const stageLogUpper = clamp(logCenter + logHalfRange, minLog, maxLog);
      let stageBest = null;

      for (let index = 0; index < steps; index += 1) {
        if (deadline && Date.now() > deadline) return best || stageBest;
        const logD = steps === 1 ? logCenter : stageLogLower + ((stageLogUpper - stageLogLower) * index) / (steps - 1);
        const candidate = scoreFitCandidate(rows, thicknessMeters, Math.pow(10, logD), deadline);
        if (!candidate) continue;
        if (!stageBest || candidate.score < stageBest.score) {
          stageBest = candidate;
        }
      }

      if (!stageBest) break;
      best = stageBest;
      logCenter = Math.log10(stageBest.diffusivity);
      logHalfRange = Math.max(logHalfRange * 0.35, 0.02);
    }

    return best;
  }

  function scoreFitCandidate(rows, thicknessMeters, diffusivity, deadline) {
    if (!Number.isFinite(diffusivity) || diffusivity <= 0) return null;
    let sumSquares = 0;
    let count = 0;
    for (const row of rows) {
      if (deadline && Date.now() > deadline) return null;
      const model = evaluateFickResponseDetailed(diffusivity, row.time, thicknessMeters, deadline);
      const predicted = typeof model === "number" ? model : model && model.value;
      if (!Number.isFinite(predicted) || !Number.isFinite(row.normalized)) return null;
      const residual = predicted - row.normalized;
      sumSquares += residual * residual;
      count += 1;
    }
    if (count < 4) return null;
    return {
      diffusivity,
      count,
      sse: sumSquares,
      score: Math.sqrt(sumSquares / count),
    };
  }

  function estimateFitSeed(rows, thicknessMeters) {
    if (!rows.length || !Number.isFinite(thicknessMeters) || thicknessMeters <= 0) return null;
    const timeLag = findCrossingTime(rows, 0.63);
    if (!timeLag || !Number.isFinite(timeLag.time) || timeLag.time <= 0) {
      return null;
    }

    const diffusivity = (thicknessMeters * thicknessMeters) / (6 * timeLag.time);
    if (!Number.isFinite(diffusivity) || diffusivity <= 0) return null;
    const timeOffset = 0;
    if (!Number.isFinite(timeOffset)) return null;

    return {
      diffusivity: clamp(diffusivity, SOLVER_POLICY.dLower, SOLVER_POLICY.dUpper),
      timeOffset,
    };
  }

  function evaluateFickResponseDetailed(diffusivity, timeSeconds, thicknessMeters, deadline) {
    if (!Number.isFinite(diffusivity) || !Number.isFinite(timeSeconds) || !Number.isFinite(thicknessMeters)) return null;
    if (diffusivity <= 0 || timeSeconds <= 0 || thicknessMeters <= 0) return 0;

    const factor = (Math.PI * Math.PI * diffusivity * timeSeconds) / (thicknessMeters * thicknessMeters);
    if (factor < 1.6) {
      return evaluateFickResponseThetaDetailed(factor, deadline);
    }
    return evaluateFickResponseDirectDetailed(factor, deadline);
  }

  function evaluateFickResponseDirectDetailed(factor, deadline) {
    let sum = 0;
    let stableCount = 0;
    let previousValue = null;
    let lastTerm = 0;

    for (let n = 1; n <= SOLVER_POLICY.maxTerms; n += 1) {
      if (deadline && Date.now() > deadline) return null;
      const sign = n % 2 === 0 ? 1 : -1;
      const term = sign * Math.exp(-(n * n) * factor);
      sum += term;
      lastTerm = term;
      const value = 1 + 2 * sum;
      if (n >= SOLVER_POLICY.minTerms) {
        const delta = previousValue == null ? Math.abs(term) : Math.abs(value - previousValue);
        const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(value)));
        if (delta <= tolerance) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        if (stableCount >= 3) {
          return {
            value: clamp(value, 0, 1),
            termsUsed: n,
            lastTermContribution: 2 * term,
            lastDelta: delta,
            tolerance,
            method: "direct",
          };
        }
      }
      previousValue = value;
    }

    return {
      value: clamp(1 + 2 * sum, 0, 1),
      termsUsed: SOLVER_POLICY.maxTerms,
      lastTermContribution: 2 * lastTerm,
      lastDelta: previousValue == null ? Math.abs(lastTerm) : Math.abs((1 + 2 * sum) - previousValue),
      tolerance: Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(1 + 2 * sum))),
      method: "direct",
    };
  }

  function evaluateFickResponseThetaDetailed(factor, deadline) {
    if (!(factor > 0)) {
      return { value: 0, termsUsed: 0, lastTermContribution: 0, method: "theta" };
    }
    let sum = 0;
    let stableCount = 0;
    let previousValue = null;
    const root = Math.sqrt(Math.PI / factor);
    let lastTerm = 0;

    for (let m = 0; m <= SOLVER_POLICY.maxTerms; m += 1) {
      if (deadline && Date.now() > deadline) return null;
      const k = 2 * m + 1;
      const term = Math.exp(-((k * k) * Math.PI * Math.PI) / (4 * factor));
      sum += term;
      lastTerm = term;
      const value = 2 * root * sum;
      if (m + 1 >= SOLVER_POLICY.minTerms) {
        const delta = previousValue == null ? Math.abs(term) : Math.abs(value - previousValue);
        const tolerance = Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(value)));
        if (delta <= tolerance) {
          stableCount += 1;
        } else {
          stableCount = 0;
        }
        if (stableCount >= 3) {
          return {
            value: clamp(value, 0, 1),
            termsUsed: m + 1,
            lastTermContribution: 2 * root * term,
            lastDelta: delta,
            tolerance,
            method: "theta",
          };
        }
      }
      previousValue = value;
    }

    return {
      value: clamp(2 * root * sum, 0, 1),
      termsUsed: SOLVER_POLICY.maxTerms,
      lastTermContribution: 2 * root * lastTerm,
      lastDelta: previousValue == null ? Math.abs(lastTerm) : Math.abs((2 * root * sum) - previousValue),
      tolerance: Math.max(SOLVER_POLICY.absTolerance, SOLVER_POLICY.relTolerance * Math.max(1, Math.abs(2 * root * sum))),
      method: "theta",
    };
  }

  function findCrossingTime(rows, threshold) {
    if (!rows.length) return null;
    const first = rows[0];
    if (Number.isFinite(first.normalized) && first.normalized >= threshold) {
      return { time: first.time, normalized: first.normalized };
    }
    for (let i = 1; i < rows.length; i += 1) {
      const prev = rows[i - 1];
      const curr = rows[i];
      if (!Number.isFinite(prev.normalized) || !Number.isFinite(curr.normalized)) continue;
      if (prev.normalized === threshold) return { time: prev.time, normalized: prev.normalized };
      if ((prev.normalized < threshold && curr.normalized >= threshold) || (prev.normalized > threshold && curr.normalized <= threshold)) {
        const span = curr.normalized - prev.normalized;
        if (span === 0) return { time: curr.time, normalized: curr.normalized };
        const ratio = (threshold - prev.normalized) / span;
        const time = prev.time + ratio * (curr.time - prev.time);
        return { time, normalized: threshold };
      }
    }
    return null;
  }

  function findBreakthroughTime(rows) {
    const points = sampleEvenly(
      sortRows((rows || []).filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized))),
      120,
    );
    if (points.length < 4) return null;

    const totalSpan = Math.max(points[points.length - 1].time - points[0].time, Number.EPSILON);
    const minWindowSize = Math.min(points.length, Math.max(4, Math.ceil(points.length * 0.12)));
    const maxWindowSize = Math.min(points.length, Math.max(minWindowSize, Math.ceil(points.length * 0.45)));
    let best = null;

    for (let windowSize = maxWindowSize; windowSize >= minWindowSize; windowSize -= 1) {
      for (let start = 0; start <= points.length - windowSize; start += 1) {
        const candidate = points.slice(start, start + windowSize);
        const fit = fitLine(candidate, "normalized");
        if (!fit || !Number.isFinite(fit.slope) || fit.slope <= 0) continue;

        const startValue = fit.intercept + fit.slope * candidate[0].time;
        const endValue = fit.intercept + fit.slope * candidate[candidate.length - 1].time;
        const valueSpan = endValue - startValue;
        if (!Number.isFinite(valueSpan) || valueSpan < 0.12) continue;

        const normalizedMedian = median(candidate.map((point) => point.normalized));
        if (!Number.isFinite(normalizedMedian) || normalizedMedian <= 0.1 || normalizedMedian >= 0.85) continue;

        const interceptTime = -fit.intercept / fit.slope;
        if (!Number.isFinite(interceptTime) || interceptTime >= candidate[0].time || interceptTime < points[0].time - totalSpan * 0.5) {
          continue;
        }

        const normalizedRmse = fit.rmse / Math.max(Math.abs(valueSpan), Number.EPSILON);
        if (!Number.isFinite(normalizedRmse) || normalizedRmse > 0.12) continue;

        const spanFraction = Math.min(1, valueSpan / 0.45);
        const countFraction = candidate.length / points.length;
        const midpointFraction = ((candidate[0].time + candidate[candidate.length - 1].time) / 2 - points[0].time) / totalSpan;
        const score =
          normalizedRmse * 1.8 +
          Math.abs(normalizedMedian - 0.5) * 0.16 +
          (1 - spanFraction) * 0.35 +
          (1 - countFraction) * 0.18 +
          Math.abs(midpointFraction - 0.45) * 0.08;

        if (!best || score < best.score || (Math.abs(score - best.score) < 0.003 && candidate.length > best.points.length)) {
          best = { time: interceptTime, score, points: candidate };
        }
      }
    }

    if (best) {
      return { time: best.time };
    }

    return fitBreakthroughBand(points, 0.15, 0.75) || fitBreakthroughBand(points, 0.1, 0.8);
  }

  function fitBreakthroughBand(points, low, high) {
    const band = points.filter((point) => point.normalized >= low && point.normalized <= high);
    if (band.length < 4) return null;
    const fit = fitLine(band, "normalized");
    if (!fit || !Number.isFinite(fit.slope) || fit.slope <= 0) return null;
    const interceptTime = -fit.intercept / fit.slope;
    if (!Number.isFinite(interceptTime) || interceptTime >= band[0].time) return null;
    return { time: interceptTime };
  }

  function findInflectionPoint(rows, target) {
    if (rows.length < 3 || !Number.isFinite(target)) return null;
    const sorted = rows
      .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.normalized) && Number.isFinite(row.current))
      .sort((a, b) => a.time - b.time);
    if (sorted.length < 3) return null;

    let leftIndex = -1;
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.normalized === target) {
        leftIndex = i - 1;
        break;
      }
      if ((prev.normalized < target && curr.normalized >= target) || (prev.normalized > target && curr.normalized <= target)) {
        leftIndex = i - 1;
        break;
      }
    }

    if (leftIndex < 0) {
      let closest = 0;
      let closestDelta = Math.abs(sorted[0].normalized - target);
      for (let i = 1; i < sorted.length; i += 1) {
        const delta = Math.abs(sorted[i].normalized - target);
        if (delta < closestDelta) {
          closest = i;
          closestDelta = delta;
        }
      }
      leftIndex = Math.max(0, closest - 1);
    }

    const rightIndex = Math.min(sorted.length - 1, leftIndex + 1);
    const left = sorted[leftIndex];
    const right = sorted[rightIndex];
    const span = right.normalized - left.normalized;
    const ratio = span === 0 ? 0 : (target - left.normalized) / span;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const time = left.time + (right.time - left.time) * clampedRatio;

    const windowStart = Math.max(0, leftIndex - 2);
    const windowEnd = Math.min(sorted.length, rightIndex + 3);
    const window = sorted.slice(windowStart, windowEnd);
    const slope = linearSlope(window.map((row) => ({ time: row.time, diffusivity: row.current })));
    if (!Number.isFinite(slope)) return null;

    return { time, slope };
  }

  function applyTimeOffsetRows(rows, t0Offset, baselineValue) {
    const sourceRows = Array.isArray(rows) ? rows : [];
    if (!sourceRows.length || !Number.isFinite(t0Offset) || t0Offset === 0) {
      return sourceRows.map((row) => cloneOffsetRow(row, rowOrigin(row, ROW_ORIGIN_MEASURED)));
    }

    if (t0Offset < 0) {
      const shift = Math.abs(t0Offset);
      return sourceRows
        .filter((row) => Number.isFinite(row.time) && row.time >= shift)
        .map((row) => cloneOffsetRow(row, rowOrigin(row, ROW_ORIGIN_MEASURED), { time: row.time - shift }));
    }

    const shift = t0Offset;
    const firstCurrentRow = sourceRows.find((row) => Number.isFinite(row.current));
    const baseline = Number.isFinite(baselineValue) ? baselineValue : firstCurrentRow ? firstCurrentRow.current : null;
    const shiftedRows = sourceRows
      .filter((row) => Number.isFinite(row.time))
      .map((row) => cloneOffsetRow(row, rowOrigin(row, ROW_ORIGIN_MEASURED), { time: row.time + shift }));
    if (!Number.isFinite(baseline)) return shiftedRows;

    const firstShiftedTime = shiftedRows.reduce(
      (minimum, row) => (Number.isFinite(row.time) ? Math.min(minimum, row.time) : minimum),
      Number.POSITIVE_INFINITY,
    );
    if (!Number.isFinite(firstShiftedTime) || firstShiftedTime <= 0) {
      return shiftedRows;
    }

    const prependStep = inferPrependTimeStep(sourceRows, shift);
    const syntheticRows = [];
    const epsilon = Math.max(Math.abs(prependStep), Math.abs(firstShiftedTime), 1) * 1e-9;
    const maxRows = Math.max(1, Math.ceil(firstShiftedTime / prependStep) + 1);
    for (let index = 0; index < maxRows; index += 1) {
      const time = roundTimeValue(index * prependStep);
      if (!(time < firstShiftedTime - epsilon)) break;
      syntheticRows.push({
        lineNumber: 0,
        time,
        current: baseline,
        origin: ROW_ORIGIN_PREPENDED_BASELINE,
        synthetic: true,
      });
    }

    return syntheticRows.concat(shiftedRows);
  }

  function cloneOffsetRow(row, origin, overrides) {
    const base = row ? { ...row } : {};
    const nextOrigin = origin || rowOrigin(base, ROW_ORIGIN_MEASURED);
    return {
      ...base,
      ...(overrides || {}),
      origin: nextOrigin,
      synthetic: nextOrigin === ROW_ORIGIN_PREPENDED_BASELINE,
    };
  }

  function rowOrigin(row, fallback) {
    if (row && typeof row.origin === "string" && row.origin) return row.origin;
    return fallback || ROW_ORIGIN_MEASURED;
  }

  function inferPrependTimeStep(rows, shift) {
    const ordered = sortRows((rows || []).filter((row) => Number.isFinite(row.time)));
    const deltas = [];
    for (let index = 1; index < ordered.length && deltas.length < 12; index += 1) {
      const delta = ordered[index].time - ordered[index - 1].time;
      if (Number.isFinite(delta) && delta > 1e-9) {
        deltas.push(delta);
      }
    }

    const medianDelta = median(deltas);
    if (Number.isFinite(medianDelta) && medianDelta > 0) return medianDelta;

    if (ordered.length > 1) {
      const span = ordered[ordered.length - 1].time - ordered[0].time;
      const approximate = span / Math.max(ordered.length - 1, 1);
      if (Number.isFinite(approximate) && approximate > 0) return approximate;
    }

    if (shift >= 1) return 1;
    if (shift >= 0.1) return 0.1;
    return shift > 0 ? shift : 1;
  }

  function roundTimeValue(value) {
    return Number(Number(value).toFixed(9));
  }

  function sortRows(rows) {
    return (rows || []).slice().sort((a, b) => a.time - b.time);
  }

  function sampleEvenly(points, maxPoints) {
    if (!Array.isArray(points) || !points.length) return [];
    if (!Number.isFinite(maxPoints) || maxPoints <= 0 || points.length <= maxPoints) {
      return points.slice();
    }
    const sampled = [];
    const lastIndex = points.length - 1;
    for (let i = 0; i < maxPoints; i += 1) {
      const index = Math.round((i * lastIndex) / (maxPoints - 1));
      const point = points[index];
      if (!point) continue;
      if (sampled.length && sampled[sampled.length - 1].time === point.time) continue;
      sampled.push(point);
    }
    return sampled;
  }

  function movingAverage(values, windowSize) {
    const clean = values.filter((value) => Number.isFinite(value));
    if (!clean.length) return [];
    const size = Math.max(1, Math.min(windowSize || 1, clean.length));
    if (size === 1) return clean.slice();
    const result = [];
    for (let i = 0; i < clean.length; i += 1) {
      const start = Math.max(0, i - Math.floor(size / 2));
      const end = Math.min(clean.length, start + size);
      result.push(mean(clean.slice(start, end)));
    }
    return result;
  }

  function windowSlice(rows, start, end) {
    return rows.slice(Math.max(0, start), Math.max(Math.max(0, start) + 1, end));
  }

  function minCurrent(rows) {
    const values = rows.map((row) => row.current).filter(Number.isFinite);
    return values.length ? Math.min(...values) : null;
  }

  function maxCurrent(rows) {
    const values = rows.map((row) => row.current).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  }

  function mean(values) {
    const clean = values.filter((value) => Number.isFinite(value));
    if (!clean.length) return null;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
  }

  function trimmedMean(values) {
    const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (!clean.length) return null;
    if (clean.length < 6) return mean(clean);
    const cut = Math.floor(clean.length * 0.2);
    return mean(clean.slice(cut, clean.length - cut));
  }

  function median(values) {
    const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (!filtered.length) return null;
    const mid = Math.floor(filtered.length / 2);
    return filtered.length % 2 ? filtered[mid] : (filtered[mid - 1] + filtered[mid]) / 2;
  }

  function percentile(values, fraction) {
    const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (!filtered.length) return null;
    const clamped = clamp(fraction, 0, 1);
    const index = (filtered.length - 1) * clamped;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return filtered[lower];
    const ratio = index - lower;
    return filtered[lower] + (filtered[upper] - filtered[lower]) * ratio;
  }

  function iqr(values) {
    const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (filtered.length < 4) return 0;
    const q1 = filtered[Math.floor((filtered.length - 1) * 0.25)];
    const q3 = filtered[Math.floor((filtered.length - 1) * 0.75)];
    return q3 - q1;
  }

  function fitLine(points, valueKey) {
    const key = valueKey || "normalized";
    const filtered = points.filter((point) => Number.isFinite(point.time) && Number.isFinite(point[key]));
    if (filtered.length < 2) return null;
    const n = filtered.length;
    const meanX = filtered.reduce((sum, point) => sum + point.time, 0) / n;
    const meanY = filtered.reduce((sum, point) => sum + point[key], 0) / n;
    let numerator = 0;
    let denominator = 0;
    for (const point of filtered) {
      const dx = point.time - meanX;
      numerator += dx * (point[key] - meanY);
      denominator += dx * dx;
    }
    if (denominator === 0) return null;
    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;
    const rmse = Math.sqrt(
      filtered.reduce((sum, point) => {
        const error = intercept + slope * point.time - point[key];
        return sum + error * error;
      }, 0) / n,
    );
    return { intercept, slope, rmse };
  }

  function linearSlope(points, valueKey) {
    const key = valueKey || "diffusivity";
    const filtered = points.filter((point) => Number.isFinite(point.time) && Number.isFinite(point[key]));
    if (filtered.length < 2) return 0;
    const n = filtered.length;
    const meanX = filtered.reduce((sum, point) => sum + point.time, 0) / n;
    const meanY = filtered.reduce((sum, point) => sum + point[key], 0) / n;
    let numerator = 0;
    let denominator = 0;
    filtered.forEach((point) => {
      const dx = point.time - meanX;
      numerator += dx * (point[key] - meanY);
      denominator += dx * dx;
    });
    return denominator === 0 ? 0 : numerator / denominator;
  }

  function stddev(values) {
    const clean = values.filter((value) => Number.isFinite(value));
    if (clean.length < 2) return 0;
    const avg = mean(clean);
    const variance = clean.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / (clean.length - 1);
    return Math.sqrt(Math.max(variance, 0));
  }

  function uniqueFinite(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
      if (!Number.isFinite(value)) return;
      const key = formatKeyNumber(value);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(value);
    });
    return result;
  }

  function finiteOrFallback(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function formatKeyNumber(value) {
    return Number.isFinite(value) ? value.toFixed(6) : "null";
  }

  function formatSigned(value) {
    return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
  }

  function formatFitOffset(value) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}`;
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state || {}));
  }

  function applyRecommendationToState(state, recommendation) {
    const next = cloneState(state);
    if (!recommendation) return next;
    if (Number.isFinite(recommendation.baselineValue)) next.baselineValue = recommendation.baselineValue;
    if (Number.isFinite(recommendation.steadyValue)) next.steadyValue = recommendation.steadyValue;
    if (Number.isFinite(recommendation.t0Offset)) next.t0Offset = recommendation.t0Offset;
    return next;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 1000 || (abs > 0 && abs < 0.001)) {
      return value.toExponential(3);
    }
    return Number(value).toFixed(3).replace(/\.?0+$/, "");
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatFitRmsePercent(rmse) {
    if (!Number.isFinite(rmse)) return "—";
    return `${(rmse * 100).toFixed(1)}%`;
  }

  function describeFitQuality(rmse) {
    const percent = rmse * 100;
    if (!Number.isFinite(percent)) return "Unknown fit";
    if (percent < 1.5) return "Excellent fit";
    if (percent < 3) return "Good fit";
    if (percent < 5) return "Bad fit";
    return "Poor fit";
  }

  function dedupeStrings(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundToStep(value, step) {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
    const decimals = step >= 1 ? 0 : Math.min(6, Math.ceil(Math.abs(Math.log10(step))) + 1);
    const rounded = Math.round(value / step) * step;
    return Number(rounded.toFixed(decimals));
  }

  return {
    analyzeDiagnostic,
    buildEmptyClassicalResults,
    buildEmptyFlatness,
    buildEmptyFitResult,
    applyTimeOffsetRows,
    buildFitResult,
    optimizeFitT0,
    buildClassicalResults,
    evaluateFickResponseDetailed,
    solveApparentDiffusivity,
    cloneState,
    applyRecommendationToState,
    sortRows,
  };
});
