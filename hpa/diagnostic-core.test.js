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
