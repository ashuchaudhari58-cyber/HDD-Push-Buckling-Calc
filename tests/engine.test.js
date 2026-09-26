/* Regression tests: every engine is compared with the cached values of the source workbooks.
   Run: npm test   (Node's built-in test runner, no extra dependencies) */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProject } from '../src/engine/index.js';
import { profileCore, obstacleProfile, combinedRadius } from '../src/engine/profile.js';
import { newProject } from '../src/engine/presets.js';

const REL = 1e-9;
function close(actual, expected, label, rel = REL) {
  const tol = Math.max(Math.abs(expected) * rel, 1e-12);
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: got ${actual}, expected ${expected} (tol ${tol})`);
}

test('Push force Calculation.xlsx — 18" X70 steel, segmental method', () => {
  const r = runProject(newProject('ref-steel-sheet'));
  const P = r.push.props;
  close(P.B, 1.9243025628581449, 'buoyant force G32');
  close(P.Wair, 0.17193997870000011, 'weight in air F35');
  close(P.Wnet, -1.7523625841581447, 'Wnet F41');
  const [s1, s2, s3, s4, s5] = r.push.sections;
  close(s1.terms.find((t) => t.key === 'fa').value, 1.9484724993842275, 'L1 Fa G45');
  close(s1.terms.find((t) => t.key === 'ff').value, 2.7500527164281334, 'L1 Ff G52');
  close(s1.terms.find((t) => t.key === 'fd').value, 2.6885340265739424, 'L1 Fd G57');
  close(s1.terms.find((t) => t.key === 'fp').value, 0.19311326491152034, 'L1 Fp F62');
  close(s2.terms.find((t) => t.key === 'fc').value, 6.2013549425406946, 'L2 curvature O42');
  close(s4.terms.find((t) => t.key === 'fc').value, 13.641006631882847, 'L4 curvature O65');
  close(s1.cum, 7.5801725072978243, 'cum L1 F78');
  close(s2.cum, 16.247056948527948, 'cum L2 F89');
  close(s3.cum, 21.871932473930549, 'cum L3 F101');
  close(s4.cum, 38.417190303267049, 'cum L4 F112');
  close(s5.cum, 43.440221146902964, 'total F124');
  close(r.buck.Fdp, 74.582648636537883, 'Dawson–Paslay U78');
  close(r.buck.Fgao, 124.28371345473769, 'Gao sinusoidal U83');
  close(r.buck.Fhel, 153.80169773992489, 'Gao helical U85');
  close(r.buck.I, 43836.238795237448, 'moment of inertia U73');
  assert.equal(r.buck.ok, true);
});

test('Legacy single-file calculator defaults (36" X70) — identical results', () => {
  const r = runProject(newProject('ref-legacy-36'));
  const exp = [100.66367318143725, 117.76569053693908, 762.0689881541387, 1235.6333345211674, 1339.0281611223347];
  r.push.sections.forEach((s, i) => close(s.cum, exp[i], `cum L${i + 1}`));
  close(r.push.props.Wnet, -7.348417723212577, 'Wnet');
  close(r.stress.sigma, 3723.867947851822, 'axial stress');
  close(r.stress.allow, 4429.341, 'allowable');
  close(r.stress.util, 0.8407273108690032, 'utilisation');
  close(r.stress.fosRef, 1.321607014244167, 'FoS vs SMYS');
  close(r.buck.Fdp, 8.85705640071418, 'sinusoidal DP');
  close(r.buck.Fgao, 14.759302329463504, 'Gao sinusoidal');
  close(r.buck.Fhel, 18.26470816351185, 'helical');
  assert.equal(r.buck.regime, 'helical');
});

test('HDPE_Push_Clamp_Calc_V1 — Push_900 + Clamp_Check', () => {
  const r = runProject(newProject('ref-hdpe-900'));
  const P = r.push.props;
  close(P.Ao, 6361.7251235193307, 'Ao B29');
  close(P.Wnet, -0.33811798580365693, 'Weff B34');
  close(r.push.sections[1].cum, 7.0690891286641069, 'T end L1 (entry curve) B44');
  close(r.push.sections[2].cum, 18.819237043486048, 'T end L2 (straight) B48');
  close(r.push.sections[3].cum, 27.586043872926965, 'T exit B53');
  close(r.Fmax, 27.586043872926965, 'peak B55');
  close(r.buck.Fdp, 21.493786502991274, 'DP B65');
  close(r.buck.Fgao, 31.838243781901078, 'Gao sinusoidal B69');
  close(r.buck.Fhel, 38.389170741186334, 'Gao helical B71');
  close(r.buck.sf, 1.154143157625702, 'SF B73');
  assert.equal(r.buck.ok, true, 'B74 OK');
  close(r.clamp.Fpush, 270.61909039341356, 'push kN B5');
  close(r.clamp.Freq, 1014.8215889753008, 'required clamp B10');
  close(r.clamp.Fcap, 240, 'capacity B19');
  close(r.clamp.pAllow, 1.125, 'allowable clamp pressure B25', 1e-9);
  close(r.clamp.pApplied, 2.1142116436985434, 'applied clamp pressure B26');
  assert.equal(r.clamp.capacityOk, false);
  assert.equal(r.clamp.wallOk, false);
});

test('HDPE_Push_Clamp_Calc_V1 — Push_630', () => {
  const r = runProject(newProject('ref-hdpe-630'));
  close(r.push.props.Wnet, -0.16567781304379192, 'Weff B33');
  close(r.push.sections[1].cum, 0.44957474620562538, 'T L1 B43');
  close(r.push.sections[2].cum, 5.7929526918588969, 'T L2 B47');
  close(r.Fmax, 6.5519911770054611, 'peak B54');
  close(r.buck.Fdp, 8.7873388280752689, 'DP B64');
  close(r.buck.Fgao, 13.016479705122665, 'Gao B68');
  close(r.buck.Fhel, 15.694705564544925, 'helical B70');
  close(r.buck.sf, 1.9866448768741702, 'SF B72');
});

test('crossing_profile_geometry_calculator.xlsx — Steel version (9°/10°, 14 m, R 750, 292.5 m)', () => {
  const g = profileCore({ entryAng: 9, exitAng: 10, entryDepth: 14, exitDepth: 14, Ren: 750, Rex: 750, planDist: 292.5 });
  close(g.AO, 89.494345100995261, 'AO G1');
  close(g.chordEn, 117.68864359176742, 'BC chord G2');
  close(g.OB, 59.026280118463838, 'OB G3');
  close(g.AB, 30.468064982531423, 'AB B11');
  close(g.BC, 117.80972450961724, 'BC B12');
  close(g.CD, 6.675555699461988e-2, 'CD B13', 1e-7);
  close(g.DE, 130.89969389957471, 'DE B14');
  close(g.EF, 15.006289119567882, 'EF B15');
  close(g.total, 294.25052806828592, 'HDD length B16');
  close(g.nodes.B.x, 30.092952543741287, 'B.x'); close(g.nodes.B.y, -4.766255446353294, 'B.y');
  close(g.nodes.C.x, 147.41880132391444, 'C.x'); close(g.nodes.C.y, -14, 'C.y');
  close(g.nodes.D.x, 147.48555688090906, 'D.x');
  close(g.nodes.E.x, 277.72169013110681, 'E.x'); close(g.nodes.E.y, -2.605814759156047, 'E.y');
  close(g.nodes.F.x, 292.5, 'F.x (verify = plan distance)');
  assert.ok(Math.abs(g.nodes.F.y) < 1e-9, 'F.y = 0');
  close(combinedRadius(750, 500), 416.02514716892182, 'combined radius I28');
});

test('crossing_profile_geometry_calculator.xlsx — Direct Pipe version (5°/0°, 12 m, R 1500, 800 m)', () => {
  const g = profileCore({ entryAng: 5, exitAng: 0, entryDepth: 12, exitDepth: 0, Ren: 1500, Rex: 1500, planDist: 800 });
  close(g.AB, 72.19314458527019, 'AB');
  close(g.BC, 130.89969389957471, 'BC');
  close(g.CD, 597.34795800409574, 'CD');
  close(g.total, 800.44079648894058, 'HDD length');
  assert.equal(g.feasible, true);
});

test('River-crossing setback helper matches HDD Profile Studio example', () => {
  const o = obstacleProfile({ type: 'river', width: 300, bedDepth: 6, sideSlope: 2, scour: 2, coverBed: 5, coverBank: 5, extraDepth: 0,
    entryGround: 0, exitGround: 0, entryAng: 12, exitAng: 8, Ren: 500, Rex: 500 });
  const r2 = (v) => Math.round(v * 100) / 100;
  assert.equal(r2(o.obstacle.setEntry), 101.71);
  assert.equal(r2(o.obstacle.setExit), 115.46);
  assert.equal(r2(o.total), 518.95);
  assert.equal(r2(o.nodes.F.x), 517.18);
  assert.deepEqual(o.lengths.map(r2), [9.97, 104.72, 276.0, 69.81, 58.45]);
  assert.ok(o.coverCheck.every((c) => c.ok), 'all cover points OK');
  assert.equal(r2(o.coverCheck[0].pipe), -12.86);
});

test('Sample projects run cleanly', () => {
  for (const key of ['sample-steel', 'sample-hdpe']) {
    const r = runProject(newProject(key));
    assert.ok(isFinite(r.Fmax) && r.Fmax > 0, `${key} force`);
    assert.equal(r.prof.feasible, true, `${key} profile feasible`);
    assert.equal(r.validation.filter((v) => v.level === 'error').length, 0, `${key} no input errors`);
  }
});
