const assert = require("assert").strict;
const core = require("./diagnostic-core");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  let failures = 0;
  for (const entry of tests) {
    try {
      entry.fn();
      console.log(`ok - ${entry.name}`);
    } catch (error) {
      failures += 1;
      console.error(`not ok - ${entry.name}`);
      console.error(error && error.stack ? error.stack : error);
    }
  }
  if (failures) {
    process.exitCode = 1;
    console.error(`${failures} test(s) failed`);
  } else {
    console.log(`${tests.length} test(s) passed`);
  }
}

function buildFickSeries({
  thicknessMm = 0.5,
  diffusivity = 5e-10,
  baseline = 0,
  steady = 1,
  step = 10,
  duration = 600,
  delay = 0,
  preRun = 0,
  drift = 0,
  noise = 0,
}) {
  const rows = [];
  const thicknessMeters = thicknessMm / 1000;
  for (let time = 0; time <= duration; time += step) {
    const modelTime = Math.max(0, time + delay - preRun);
    const response = core.evaluateFickResponseDetailed(diffusivity, modelTime, thicknessMeters);
    const normalized = response && Number.isFinite(response.value) ? response.value : 0;
    const driftTerm = drift ? drift * Math.max(0, time - duration * 0.55) / Math.max(duration * 0.45, 1) : 0;
    const noiseTerm = noise ? Math.sin((time + 7) * 0.31) * noise : 0;
    rows.push({
      time,
      current: baseline + (steady - baseline) * normalized + driftTerm + noiseTerm,
    });
  }
  return rows;
}

function maxCurrent(rows) {
  return Math.max(...rows.map((row) => row.current));
}

function breakthroughTimeFromDiffusivity(diffusivity, thicknessMm) {
  const thicknessMeters = thicknessMm / 1000;
  return (thicknessMeters * thicknessMeters) / (15.3 * diffusivity);
}

function timeLagFromDiffusivity(diffusivity, thicknessMm) {
  const thicknessMeters = thicknessMm / 1000;
  return (thicknessMeters * thicknessMeters) / (6 * diffusivity);
}

function findInterpolatedCrossingTime(rows, threshold) {
  if (!rows.length) return null;
  if (Number.isFinite(rows[0].normalized) && rows[0].normalized >= threshold) {
    return rows[0].time;
  }
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    if (!Number.isFinite(previous.normalized) || !Number.isFinite(current.normalized)) continue;
    if (previous.normalized === threshold) return previous.time;
    if ((previous.normalized < threshold && current.normalized >= threshold) || (previous.normalized > threshold && current.normalized <= threshold)) {
      const span = current.normalized - previous.normalized;
      if (span === 0) return current.time;
      const ratio = (threshold - previous.normalized) / span;
      return previous.time + ratio * (current.time - previous.time);
    }
  }
  return null;
}

test("diagnostic finds a nonzero time-zero correction when the transient is delayed", () => {
  const rows = buildFickSeries({ delay: 40, duration: 720 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  assert.ok(report.best);
  assert.ok(Math.abs(report.best.t0Offset) > 5, `expected a nonzero t0, got ${report.best.t0Offset}`);
  assert.ok(report.comparison);
  assert.ok(Math.abs(report.comparison.t0Delta) > 5);
});

test("diagnostic favors a negative time-zero correction when pre-run baseline is present", () => {
  const rows = buildFickSeries({ preRun: 20 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  assert.ok(report.best);
  assert.ok(report.best.t0Offset < -5, `expected negative t0, got ${report.best.t0Offset}`);
  assert.ok(report.comparison);
  assert.ok(report.comparison.t0Delta < -5);
});

test("diagnostic flags weak signal and noisy baseline", () => {
  const rows = buildFickSeries({
    baseline: 1,
    steady: 1.003,
    noise: 0.0015,
    duration: 240,
  });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 1,
    steadyValue: 1.003,
    t0Offset: 0,
  });

  assert.ok(report.rawChecks.snr < 5, `expected SNR below 5, got ${report.rawChecks.snr}`);
  assert.ok(report.recommendations.some((line) => /weakly above the baseline noise|weak relative to the baseline noise/i.test(line)));
});

test("diagnostic notes when the plateau has not been reached", () => {
  const rows = buildFickSeries({ duration: 90 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  assert.ok(report.best);
  assert.ok(report.best.fit);
  assert.ok(/steady state is not fully reached/i.test(report.best.fit.note));
});

test("diagnostic warns when the tail is still rising and suggests a higher steady state", () => {
  const rows = buildFickSeries({ duration: 120 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  const observedMax = maxCurrent(rows);
  assert.ok(report.rawChecks.tailStillRising, "expected the rising-tail warning to trigger");
  assert.ok(
    Number.isFinite(report.rawChecks.risingTailSuggestedSteadyValue) &&
      report.rawChecks.risingTailSuggestedSteadyValue > observedMax,
    `expected suggested steady state above measured max ${observedMax}, got ${report.rawChecks.risingTailSuggestedSteadyValue}`,
  );
  assert.ok(report.findings.some((finding) => finding.title === "Steady state" && /rising/i.test(finding.text)));
  assert.ok(report.recommendations.some((line) => /steady state .* above the measured maximum/i.test(line)));
  assert.ok(report.recommendations.some((line) => /stopped too early/i.test(line)));
  assert.ok(report.recommendations.some((line) => /steady-state threshold higher/i.test(line)));
});

test("diagnostic stays quiet about a rising tail when the trace is settled", () => {
  const rows = buildFickSeries({ duration: 2400, noise: 0.0004 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  assert.equal(report.rawChecks.tailStillRising, false);
  assert.equal(report.rawChecks.risingTailSuggestedSteadyValue, null);
  assert.ok(!report.findings.some((finding) => finding.title === "Steady state"));
});

test("diagnostic distinguishes a drifting transient from a self-consistent one", () => {
  const rows = buildFickSeries({ drift: 0.05, duration: 420 });
  const report = core.analyzeDiagnostic({
    rows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    t0Offset: 0,
  });

  assert.ok(report.best);
  assert.ok(report.best.methodAgreement);
  assert.ok(report.best.flatness);
  assert.ok(
    report.best.methodAgreement.spread > 0.05 ||
      report.best.flatness.score > 0.1 ||
      report.recommendations.some((line) => /partially support|weakly support/i.test(line)),
    "expected the drifting transient to look less self-consistent",
  );
});

test("classical breakthrough uses the 9.6% normalized criterion on a baseline-corrected transient", () => {
  const thicknessMm = 0.5;
  const diffusivity = 5e-10;
  const baseline = 2;
  const steady = 7;
  const rows = buildFickSeries({
    thicknessMm,
    diffusivity,
    baseline,
    steady,
    step: 5,
    duration: 600,
  });
  const normalizedRows = rows.map((row) => ({
    time: row.time,
    current: row.current,
    normalized: (row.current - baseline) / (steady - baseline),
  }));
  const expectedTime = findInterpolatedCrossingTime(normalizedRows, 0.096);

  const classical = core.buildClassicalResults(normalizedRows, thicknessMm / 1000);

  assert.ok(classical.breakthrough.available, "expected breakthrough result");
  assert.ok(/9\.6%/i.test(classical.breakthrough.note || classical.breakthrough.noteHtml || ""));
  assert.ok(Number.isFinite(expectedTime), "expected a valid 9.6% crossing time");
  assert.ok(
    Math.abs(breakthroughTimeFromDiffusivity(classical.breakthrough.diffusivity, thicknessMm) - expectedTime) < 1e-9,
    `expected breakthrough time ${expectedTime}, got ${breakthroughTimeFromDiffusivity(classical.breakthrough.diffusivity, thicknessMm)}`,
  );
});

test("classical breakthrough linearly interpolates the 9.6% threshold crossing", () => {
  const thicknessMm = 0.5;
  const normalizedRows = [
    { time: 0, current: 0, normalized: 0.0 },
    { time: 10, current: 0.08, normalized: 0.08 },
    { time: 20, current: 0.12, normalized: 0.12 },
    { time: 30, current: 0.3, normalized: 0.3 },
  ];

  const classical = core.buildClassicalResults(normalizedRows, thicknessMm / 1000);
  const breakthroughTime = breakthroughTimeFromDiffusivity(classical.breakthrough.diffusivity, thicknessMm);

  assert.ok(classical.breakthrough.available, "expected breakthrough result");
  assert.ok(Math.abs(breakthroughTime - 14) < 1e-9, `expected interpolated breakthrough time 14 s, got ${breakthroughTime}`);
});

test("classical breakthrough stays positive on a delayed transient once the 9.6% threshold is reached", () => {
  const thicknessMm = 0.5;
  const rows = buildFickSeries({
    thicknessMm,
    diffusivity: 5e-10,
    baseline: 2,
    steady: 7,
    step: 2,
    duration: 1200,
    delay: 20,
  });
  const normalizedRows = rows.map((row) => ({
    time: row.time,
    current: row.current,
    normalized: (row.current - 2) / 5,
  }));

  const classical = core.buildClassicalResults(normalizedRows, thicknessMm / 1000);
  const breakthroughTime = breakthroughTimeFromDiffusivity(classical.breakthrough.diffusivity, thicknessMm);

  assert.ok(classical.breakthrough.available, "expected breakthrough result");
  assert.ok(breakthroughTime > 0, `expected positive breakthrough time, got ${breakthroughTime}`);
});

test("classical breakthrough stays unavailable when the 9.6% normalized threshold is never reached", () => {
  const normalizedRows = [
    { time: 0, current: 0, normalized: 0.0 },
    { time: 10, current: 0.02, normalized: 0.02 },
    { time: 20, current: 0.05, normalized: 0.05 },
    { time: 30, current: 0.09, normalized: 0.09 },
  ];

  const classical = core.buildClassicalResults(normalizedRows, 0.0005);

  assert.equal(classical.breakthrough.available, false);
  assert.ok(/9\.6% normalized criterion/i.test(classical.breakthrough.note || ""));
});

test("classical time lag respects the analytic 61.7% threshold", () => {
  const thicknessMm = 0.5;
  const normalizedRows = [
    { time: 0, current: 0, normalized: 0.0 },
    { time: 10, current: 0.55, normalized: 0.55 },
    { time: 20, current: 0.62, normalized: 0.62 },
    { time: 30, current: 0.68, normalized: 0.68 },
  ];
  const expectedTime = findInterpolatedCrossingTime(normalizedRows, 0.617);
  const classical = core.buildClassicalResults(normalizedRows, thicknessMm / 1000, "analytic");
  const lagTime = timeLagFromDiffusivity(classical.timeLag.diffusivity, thicknessMm);

  assert.ok(classical.timeLag.available, "expected analytic time-lag result");
  assert.ok(/61\.7%/i.test(classical.timeLag.noteHtml || ""));
  assert.ok(Math.abs(lagTime - expectedTime) < 1e-9, `expected analytic time lag ${expectedTime} s, got ${lagTime}`);
});

test("classical time lag respects the historic 63% threshold", () => {
  const thicknessMm = 0.5;
  const normalizedRows = [
    { time: 0, current: 0, normalized: 0.0 },
    { time: 10, current: 0.55, normalized: 0.55 },
    { time: 20, current: 0.62, normalized: 0.62 },
    { time: 30, current: 0.68, normalized: 0.68 },
  ];
  const expectedTime = findInterpolatedCrossingTime(normalizedRows, 0.63);
  const classical = core.buildClassicalResults(normalizedRows, thicknessMm / 1000, "historic");
  const lagTime = timeLagFromDiffusivity(classical.timeLag.diffusivity, thicknessMm);

  assert.ok(classical.timeLag.available, "expected historic time-lag result");
  assert.ok(/63%/i.test(classical.timeLag.noteHtml || ""));
  assert.ok(Math.abs(lagTime - expectedTime) < 1e-9, `expected historic time lag ${expectedTime} s, got ${lagTime}`);
});

test("classical inflection uses the normalized slope form directly", () => {
  const thicknessMm = 0.5;
  const normalizedRowsA = [
    { time: 0, current: 2, normalized: 0.0 },
    { time: 10, current: 3, normalized: 0.1221 },
    { time: 20, current: 5, normalized: 0.2442 },
    { time: 30, current: 8, normalized: 0.3663 },
    { time: 40, current: 13, normalized: 0.4884 },
  ];
  const normalizedRowsB = [
    { time: 0, current: 20, normalized: 0.0 },
    { time: 10, current: 55, normalized: 0.1221 },
    { time: 20, current: 120, normalized: 0.2442 },
    { time: 30, current: 260, normalized: 0.3663 },
    { time: 40, current: 600, normalized: 0.4884 },
  ];

  const classicalA = core.buildClassicalResults(normalizedRowsA, thicknessMm / 1000);
  const classicalB = core.buildClassicalResults(normalizedRowsB, thicknessMm / 1000);
  const expectedSlope = 0.01221;
  const expectedDiffusivity = (0.04124 / 0.2442) * Math.pow(thicknessMm / 1000, 2) * expectedSlope;

  assert.ok(classicalA.inflection.available, "expected inflection result");
  assert.ok(classicalB.inflection.available, "expected inflection result");
  assert.ok(/a<sub>norm<\/sub>/i.test(classicalA.inflection.noteHtml || ""));
  assert.ok(Math.abs(classicalA.inflection.diffusivity - expectedDiffusivity) < 1e-16, `expected normalized-form diffusivity ${expectedDiffusivity}, got ${classicalA.inflection.diffusivity}`);
  assert.ok(Math.abs(classicalA.inflection.diffusivity - classicalB.inflection.diffusivity) < 1e-20, "expected inflection result to depend on normalized slope, not current scaling");
});

test("positive t0 prepends dense baseline rows on the inferred cadence without duplicating the join time", () => {
  const rows = [
    { time: 0, current: 5 },
    { time: 1, current: 6 },
    { time: 2, current: 7 },
  ];
  const shifted = core.applyTimeOffsetRows(rows, 20, 5);

  assert.equal(shifted.length, 23);
  assert.deepStrictEqual(
    shifted.slice(0, 20).map((row) => row.time),
    Array.from({ length: 20 }, (_, index) => index),
  );
  assert.ok(shifted.slice(0, 20).every((row) => row.current === 5));
  assert.ok(shifted.slice(0, 20).every((row) => row.origin === "prepended_baseline"));
  assert.ok(shifted.slice(0, 20).every((row) => row.synthetic === true));
  assert.deepStrictEqual(
    shifted.slice(20).map((row) => ({ time: row.time, current: row.current, origin: row.origin, synthetic: row.synthetic })),
    [
      { time: 20, current: 5, origin: "measured", synthetic: false },
      { time: 21, current: 6, origin: "measured", synthetic: false },
      { time: 22, current: 7, origin: "measured", synthetic: false },
    ],
  );
  assert.equal(shifted.filter((row) => row.time === 20).length, 1);
});

test("positive t0 uses the median early dt for irregular traces", () => {
  const rows = [
    { time: 0, current: 4 },
    { time: 0.8, current: 4.1 },
    { time: 1.6, current: 4.2 },
    { time: 4.0, current: 4.5 },
  ];
  const shifted = core.applyTimeOffsetRows(rows, 2, 4);
  const prepended = shifted.filter((row) => row.origin === "prepended_baseline");

  assert.deepStrictEqual(
    prepended.map((row) => row.time),
    [0, 0.8, 1.6],
  );
  assert.equal(shifted.filter((row) => row.time === 2).length, 1);
  assert.deepStrictEqual(
    shifted.filter((row) => row.origin === "measured").map((row) => row.time),
    [2, 2.8, 3.6, 6],
  );
});

test("global transient fit keeps the current t0 fixed and ignores prepended baseline rows", () => {
  const rows = buildFickSeries({
    thicknessMm: 0.5,
    diffusivity: 5e-10,
    baseline: 0,
    steady: 1,
    step: 5,
    duration: 720,
    delay: 40,
  });

  const fitFromRaw = core.buildFitResult(rows, 0.5, 0, 1, 0);
  const shiftedRows = core.applyTimeOffsetRows(rows, 20, 0);
  const fitFromPrepended = core.buildFitResult(shiftedRows, 0.5, 0, 1, 20);

  assert.ok(fitFromRaw.available, "expected fit on raw rows");
  assert.ok(fitFromPrepended.available, "expected fit on prepended rows");
  assert.equal(fitFromRaw.timeOffset, 0);
  assert.equal(fitFromPrepended.timeOffset, 0);
  assert.equal(fitFromRaw.totalTimeOffset, 0);
  assert.equal(fitFromPrepended.totalTimeOffset, 20);
  assert.ok(
    Math.abs(fitFromRaw.diffusivity - fitFromPrepended.diffusivity) / fitFromRaw.diffusivity < 0.08,
    `expected similar fitted D, got raw ${fitFromRaw.diffusivity} vs prepended ${fitFromPrepended.diffusivity}`,
  );
});

test("global transient fit seed follows the selected time-lag mode", () => {
  const rows = [
    { time: 0, current: 0 },
    { time: 10, current: 0.55 },
    { time: 20, current: 0.62 },
    { time: 30, current: 0.68 },
    { time: 40, current: 0.74 },
    { time: 50, current: 0.79 },
  ];

  const analytic = core.buildFitResult(rows, 0.5, 0, 1, 0, "analytic");
  const historic = core.buildFitResult(rows, 0.5, 0, 1, 0, "historic");

  assert.ok(analytic.available, "expected analytic fit result");
  assert.ok(historic.available, "expected historic fit result");
  assert.notEqual(analytic.diffusivity, historic.diffusivity, "expected the selected threshold to change the fit seed path");
});

test("explicit t0 optimization is deterministic and scores total t0 by RMSE", () => {
  const rawRows = buildFickSeries({
    thicknessMm: 0.5,
    diffusivity: 5e-10,
    baseline: 0,
    steady: 1,
    step: 5,
    duration: 720,
  }).map((row) => ({
    time: row.time + 24,
    current: row.current,
  }));

  const first = core.optimizeFitT0({
    rows: rawRows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    minOffset: -60,
    maxOffset: 60,
    coarseStep: 1,
    fineStep: 0.1,
  });
  const second = core.optimizeFitT0({
    rows: rawRows,
    thicknessMm: 0.5,
    baselineValue: 0,
    steadyValue: 1,
    minOffset: -60,
    maxOffset: 60,
    coarseStep: 1,
    fineStep: 0.1,
  });

  assert.ok(first, "expected a t0 optimization result");
  assert.ok(second, "expected a second t0 optimization result");
  assert.ok(Math.abs(first.totalTimeOffset + 24) <= 1.5, `expected t0 near -24 s, got ${first.totalTimeOffset}`);
  assert.ok(Math.abs(first.totalTimeOffset - second.totalTimeOffset) <= 0.2, `expected deterministic t0, got ${first.totalTimeOffset} vs ${second.totalTimeOffset}`);
  assert.ok(Math.abs(first.rmse - second.rmse) <= 1e-9, `expected deterministic RMSE, got ${first.rmse} vs ${second.rmse}`);
});

test("snapshot helpers preserve and restore pre-diagnostic state objects", () => {
  const snapshot = {
    inputValue: "0 1",
    currentUnit: "A",
    thickness: "0.50",
    t0Offset: "0",
    baselineValue: 1,
    steadyValue: 2,
    referenceVisibility: { baseline: true, steady: false },
    plotViewport: { xMin: 0, xMax: 10 },
  };

  const copy = core.cloneState(snapshot);
  copy.plotViewport.xMin = 99;
  copy.referenceVisibility.baseline = false;

  assert.deepStrictEqual(snapshot, {
    inputValue: "0 1",
    currentUnit: "A",
    thickness: "0.50",
    t0Offset: "0",
    baselineValue: 1,
    steadyValue: 2,
    referenceVisibility: { baseline: true, steady: false },
    plotViewport: { xMin: 0, xMax: 10 },
  });

  const applied = core.applyRecommendationToState(snapshot, {
    baselineValue: 1.25,
    steadyValue: 2.5,
    t0Offset: 20,
  });

  assert.deepStrictEqual(applied.baselineValue, 1.25);
  assert.deepStrictEqual(applied.steadyValue, 2.5);
  assert.deepStrictEqual(applied.t0Offset, 20);
  assert.deepStrictEqual(snapshot.baselineValue, 1);
  assert.deepStrictEqual(snapshot.steadyValue, 2);
  assert.deepStrictEqual(snapshot.t0Offset, "0");
});

if (require.main === module) {
  run();
}

module.exports = { run, tests };
