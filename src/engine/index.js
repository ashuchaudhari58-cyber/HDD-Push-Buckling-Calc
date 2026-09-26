/* Engine orchestrator: project (engineering units) → normalised sheet units → results. */

import { PSI_TO_KGCM2, MPA_TO_KGCM2, WATER_KGCM3, IN_TO_CM } from './constants.js';
import { MATERIALS, hdpeMinBendRatio } from './materials.js';
import { profileCore, obstacleProfile, sectionDepths, combinedRadius } from './profile.js';
import { pushSegmental } from './pushSegmental.js';
import { pushCapstan } from './pushCapstan.js';
import { buckling } from './buckling.js';
import { clampCheck } from './clamp.js';
import { validateProject } from './validate.js';

export const METHODS = {
  S: {
    key: 'S', label: 'Segmental — TESPL push force sheet', short: 'Segmental (TESPL)',
    source: 'Push force Calculation.xlsx',
    desc: 'Five-section build-up with the capstan equation on the curves and a mud pressure-head term. Reproduces the TESPL steel workbook exactly.',
    defaults: { weight: 'air', angleRef: 'exit', criterion: 'dp', piHelical: 3.14 },
  },
  C: {
    key: 'C', label: 'Capstan carry-through — ASTM F1962 / PPI', short: 'Capstan (F1962)',
    source: 'HDPE_Push_Clamp_Calc_V1.xlsx',
    desc: 'Tension carried through the bore with e^(μθ) on each curve; slurry hydrostatic head excluded from the axial sum. Reproduces the TESPL HDPE workbook.',
    defaults: { weight: 'effective', angleRef: 'entry', criterion: 'gao', piHelical: Math.PI },
  },
};

/* ---------- pipe geometry & material ---------- */
export function resolvePipe(p) {
  const pipe = p.pipe;
  const mat = MATERIALS[pipe.material] || MATERIALS.steel;
  let D, t, odLabel;
  if (pipe.material === 'steel') {
    D = pipe.odIn * IN_TO_CM; t = pipe.wtMm / 10;
    odLabel = `${fmtN(pipe.odIn, 3)}" (${fmtN(pipe.odIn * 25.4, 1)} mm) × ${fmtN(pipe.wtMm, 2)} mm WT`;
  } else if (pipe.material === 'hdpe') {
    D = pipe.odMm / 10; t = (pipe.odMm / pipe.sdr) / 10;
    odLabel = `OD ${fmtN(pipe.odMm, 0)} mm SDR ${fmtN(pipe.sdr, 1)} (WT ${fmtN(pipe.odMm / pipe.sdr, 2)} mm)`;
  } else {
    D = pipe.customOdMm / 10; t = pipe.customWtMm / 10;
    odLabel = `OD ${fmtN(pipe.customOdMm, 1)} mm × ${fmtN(pipe.customWtMm, 2)} mm WT`;
  }
  const strengthKg = pipe.strengthUnit === 'psi' ? pipe.strength * PSI_TO_KGCM2 : pipe.strength * MPA_TO_KGCM2;
  const gradeLabel = pipe.material === 'steel' ? `API 5L ${pipe.steelGrade}` : pipe.material === 'hdpe' ? pipe.hdpeGrade.replace('RC', '-RC') : 'Custom';
  return {
    material: pipe.material, mat, D, t, d: D - 2 * t, SDR: D / t,
    ODmm: D * 10, WTmm: t * 10, odLabel, gradeLabel,
    rhoPipe: pipe.density / 1e6, E: pipe.E,
    strengthKg, allowFactor: pipe.allowFactor, allowKg: pipe.allowFactor * strengthKg,
  };
}

export function holeDiameter(p, D) {
  const m = p.mud;
  if (m.holeRule === 'custom' && m.holeCustomMm > 0) return m.holeCustomMm / 10;
  if (m.holeRule === 'D+12') return D >= 24 * IN_TO_CM ? D + 12 * IN_TO_CM : D * 1.5;
  return D * 1.5;
}

/* ---------- profile ---------- */
export function resolveProfile(p) {
  const g = p.profile;
  const base = { entryAng: +g.entryAng, exitAng: +g.exitAng, Ren: +g.Ren, Rex: g.sameRadius ? +g.Ren : +g.Rex };
  if (g.type === 'open') {
    const core = profileCore({ ...base, entryDepth: +g.entryDepth, exitDepth: +g.exitDepth, planDist: +g.planDist });
    return { ...core, type: 'open', datum: 0, groundAt: null, coverCheck: [] };
  }
  return obstacleProfile({ ...g, ...base });
}

/* ---------- main ---------- */
export function runProject(p) {
  const validation = validateProject(p);
  const pipe = resolvePipe(p);
  const prof = resolveProfile(p);
  const method = METHODS[p.method.key] || METHODS.S;

  // Section lengths & depths used by the push-force calculation
  let Lm, dm;
  if (p.sections.source === 'profile') {
    Lm = prof.lengths.map((v) => Math.max(0, v));
    dm = sectionDepths(prof, p.sections.depthBasis);
  } else {
    Lm = p.sections.L.map(Number);
    dm = p.sections.d.map(Number);
  }
  const Dhole = holeDiameter(p, pipe.D);
  const rhoMud = p.mud.rhoMud / 1e6;
  const rhoFill = p.pipe.contents === 'water' ? WATER_KGCM3 : rhoMud;
  const Ren = +p.profile.Ren, Rex = p.profile.sameRadius ? +p.profile.Ren : +p.profile.Rex;

  const x = {
    D: pipe.D, t: pipe.t, rhoPipe: pipe.rhoPipe, E: pipe.E,
    Fmud: +p.mud.Fmud, mu: +p.mud.mu, rhoMud, rhoFill, contents: p.pipe.contents,
    entryAng: +p.profile.entryAng, exitAng: +p.profile.exitAng, Ren, Rex,
    L: Lm.map((v) => v * 100), dp: dm.map((v) => v * 100),
    T1: +p.method.T1, corrected: !!p.method.corrected,
  };
  const push = method.key === 'C' ? pushCapstan(x) : pushSegmental(x);
  const Fmax = push.peak;

  // Axial stress
  const As = push.props.As;
  const sigma = Fmax * 1000 / As;
  const allow = pipe.allowKg;
  const stress = {
    As, sigma, allow, util: sigma / allow, reserve: allow / sigma,
    fosRef: pipe.strengthKg / sigma, ok: sigma <= allow,
    Fallow: allow * As / 1000,                     // force at which σ = σ_allow (ton)
  };

  // Buckling
  const bs = p.buckling;
  const weight = bs.weight === 'auto' ? method.defaults.weight : bs.weight;
  const angleRef = bs.angleRef === 'auto' ? method.defaults.angleRef : bs.angleRef;
  const criterion = bs.criterion === 'auto' ? method.defaults.criterion : bs.criterion;
  const muB = bs.muMode === 'soil' ? +p.mud.mu : +bs.muB;
  const w = weight === 'air' ? push.props.Wair : Math.abs(push.props.Wnet);
  const refAng = angleRef === 'entry' ? +p.profile.entryAng : +p.profile.exitAng;
  const clearance = (Dhole - pipe.D) / 2;
  const bk = buckling({ E: pipe.E, D: pipe.D, d: pipe.d, w, inclinationDeg: 90 - refAng, clearance, muB, piHelical: method.defaults.piHelical });
  const Fsin = criterion === 'gao' ? bk.Fgao : bk.Fdp;
  const regime = Fmax < Fsin ? 'none' : Fmax < bk.Fhel ? 'sinusoidal' : 'helical';

  // Force vs chainage (section boundaries; linear between them)
  const forceProfile = [{ s: 0, F: 0, sec: 0 }];
  let s = 0;
  push.sections.forEach((sec, i) => { s += sec.L / 100; forceProfile.push({ s, F: sec.cum, sec: i + 1 }); });
  const onset = (Flim) => chainageAtForce(forceProfile, Flim);
  const buck = {
    ...bk, weight, angleRef, criterion, refAng, Dhole, Fsin, regime,
    ok: Fmax < Fsin, sf: Fsin / Fmax,
    onsetSin: onset(Fsin), onsetHel: onset(bk.Fhel),
    governing: Math.min(Fsin, bk.Fhel),
  };

  // Bending / radius guidance (advisory)
  const Rmin = Math.min(Ren, Rex);
  const bending = {
    Rmin,
    sigmaB: pipe.E * pipe.D / (2 * Rmin * 100),                 // kg/cm²  σb = E·D/(2R)
    strain: pipe.D / (2 * Rmin * 100),
    guide: pipe.material === 'hdpe' ? hdpeMinBendRatio(pipe.SDR) * pipe.D / 100 : 1200 * pipe.D / 100,
    guideBasis: pipe.material === 'hdpe' ? `PPI field-bending guidance: ${hdpeMinBendRatio(pipe.SDR)} × OD for SDR ${fmtN(pipe.SDR, 1)}` : 'HDD rule of thumb: 100 ft of radius per inch of OD (= 1,200 × OD)',
  };
  bending.ok = Rmin >= bending.guide - 1e-9;
  bending.combined = sigma + bending.sigmaB;
  const planR = +p.profile.planRadius > 0 ? combinedRadius(+p.profile.planRadius, Rmin) : null;

  // Clamp
  const c = p.clamp;
  const sigmaBearing = c.bearingMode === 'custom' ? +c.sigmaBearing : pipe.allowKg / 10.1971621;
  const clamp = c.enabled ? clampCheck({ peakTon: Fmax, sf: +c.sf, muGrip: +c.muGrip, pads: +c.pads, padLength: +c.padLength, padWidth: +c.padWidth, pMax: +c.pMax, sigmaBearing, SDR: pipe.SDR }) : null;
  if (clamp) clamp.sigmaBearing = sigmaBearing;

  // Consistency: manual lengths vs profile
  let consistency = null;
  if (p.sections.source === 'manual' && prof.feasible) {
    consistency = prof.lengths.map((v, i) => ({ i, manual: Lm[i], profile: v, diff: Lm[i] - v, rel: v > 0 ? (Lm[i] - v) / v : null }));
  }

  const checks = buildChecks({ p, pipe, prof, push, stress, buck, bending, clamp, consistency, validation, planR });
  const overall = summarise(checks);

  return {
    pipe, prof, method, push, Fmax, stress, buck, bending, planR, clamp, consistency,
    sectionsUsed: { L: Lm, d: dm, source: p.sections.source },
    forceProfile, checks, overall, validation, x,
    totalLength: Lm.reduce((a, b) => a + b, 0),
  };
}

export function chainageAtForce(fp, Flim) {
  for (let i = 1; i < fp.length; i++) {
    const a = fp[i - 1], b = fp[i];
    if (b.F >= Flim && a.F < Flim) return a.s + (b.s - a.s) * ((Flim - a.F) / (b.F - a.F || 1));
    if (a.F >= Flim && i === 1) return a.s;
  }
  return null;
}

export function forceAtChainage(fp, s) {
  if (s <= 0) return fp[0].F;
  for (let i = 1; i < fp.length; i++) {
    if (s <= fp[i].s) { const a = fp[i - 1], b = fp[i]; const f = (s - a.s) / ((b.s - a.s) || 1); return a.F + (b.F - a.F) * f; }
  }
  return fp[fp.length - 1].F;
}

function buildChecks({ p, pipe, prof, push, stress, buck, bending, clamp, consistency, validation, planR }) {
  const out = [];
  const add = (c) => out.push(c);
  // When section lengths are entered manually the profile does not drive the calculation: its checks are advisory.
  const profKind = p.sections.source === 'manual' ? 'guidance' : 'criterion';
  const bad = profKind === 'guidance' ? 'warn' : 'fail';
  add({ key: 'geom', group: 'Profile', kind: profKind, label: 'Profile geometry is feasible', state: prof.feasible ? 'pass' : bad,
    value: prof.feasible ? 'Feasible' : `${prof.issues.length} issue(s)`, limit: 'AB, CD, EF ≥ 0', basis: 'crossing_profile_geometry_calculator.xlsx', detail: prof.issues.map((i) => i.msg).join(' ') });
  if (prof.coverCheck && prof.coverCheck.length) {
    const nBad = prof.coverCheck.filter((c) => !c.ok).length;
    add({ key: 'cover', group: 'Profile', kind: profKind, label: 'Minimum cover at check points', state: nBad ? bad : 'pass',
      value: `${prof.coverCheck.length - nBad} of ${prof.coverCheck.length} points`, limit: 'cover ≥ required', basis: 'Crossing cover requirement (input)' });
  }
  add({ key: 'stress', group: 'Structural', kind: 'criterion', label: 'Axial stress within allowable', state: stress.ok ? 'pass' : 'fail',
    value: `${fmtN(stress.sigma, 1)} kg/cm²`, limit: `≤ ${fmtN(stress.allow, 1)} kg/cm²`, ratio: stress.util, basis: `${fmtN(pipe.allowFactor, 2)} × ${pipe.mat.strengthLabel}` });
  add({ key: 'buck', group: 'Structural', kind: 'criterion', label: `Push force below ${buck.criterion === 'gao' ? 'Gao sinusoidal' : 'Dawson–Paslay sinusoidal'} buckling load`, state: buck.ok ? 'pass' : 'fail',
    value: `${fmtN(push.peak, 2)} t`, limit: `< ${fmtN(buck.Fsin, 2)} t`, ratio: push.peak / buck.Fsin,
    basis: buck.criterion === 'gao' ? 'HDPE_Push_Clamp_Calc_V1 (B74)' : 'Push force Calculation.xlsx / legacy calculator',
    detail: buck.regime === 'none' ? 'No buckling predicted.' : buck.regime === 'sinusoidal' ? 'Sinusoidal (lateral snaking) buckling regime — below helical lock-up.' : 'Helical buckling / lock-up regime.' });
  add({ key: 'helical', group: 'Structural', kind: 'criterion', label: 'Push force below helical lock-up load', state: push.peak < buck.Fhel ? 'pass' : 'fail',
    value: `${fmtN(push.peak, 2)} t`, limit: `< ${fmtN(buck.Fhel, 2)} t`, ratio: push.peak / buck.Fhel, basis: 'Gao et al. (2010)' });
  if (clamp) {
    add({ key: 'clampCap', group: 'Thruster', kind: 'criterion', label: 'Thruster grip capacity ≥ required clamp force', state: clamp.capacityOk ? 'pass' : 'fail',
      value: `${fmtN(clamp.Freq, 1)} kN required`, limit: `${fmtN(clamp.Fcap, 1)} kN available`, ratio: clamp.capacityRatio, basis: 'HDPE_Push_Clamp_Calc_V1 — Clamp_Check D30' });
    add({ key: 'clampWall', group: 'Thruster', kind: 'criterion', label: 'Clamp pressure within pipe-wall limit', state: clamp.wallOk ? 'pass' : 'fail',
      value: `${fmtN(clamp.pApplied, 3)} MPa`, limit: `≤ ${fmtN(clamp.pAllow, 3)} MPa`, ratio: clamp.wallRatio, basis: 'p = 2σ/(SDR − 1) — Clamp_Check D31' });
  }
  add({ key: 'radius', group: 'Guidance', kind: 'guidance', label: 'Radius of curvature vs guidance', state: bending.ok ? 'pass' : 'warn',
    value: `${fmtN(bending.Rmin, 1)} m`, limit: `≥ ${fmtN(bending.guide, 1)} m`, basis: bending.guideBasis });
  if (planR) add({ key: 'combinedR', group: 'Guidance', kind: 'guidance', label: 'Combined (plan + vertical) radius vs guidance', state: planR >= bending.guide ? 'pass' : 'warn',
    value: `${fmtN(planR, 1)} m`, limit: `≥ ${fmtN(bending.guide, 1)} m`, basis: 'Profile workbook I28 · √(Rh²Rv²/(Rh²+Rv²))' });
  if (consistency) {
    const worst = consistency.reduce((m, c) => (c.rel != null && Math.abs(c.rel) > Math.abs(m.rel ?? 0) ? c : m), { rel: 0 });
    const ok = Math.abs(worst.rel || 0) <= 0.05;
    add({ key: 'consistency', group: 'Guidance', kind: 'guidance', label: 'Manual section lengths agree with profile geometry (±5 %)', state: ok ? 'pass' : 'warn',
      value: worst.i != null ? `L${worst.i + 1}: ${fmtN(worst.manual, 2)} m vs ${fmtN(worst.profile, 2)} m` : '—', limit: '±5 %', basis: 'Consistency check (manual vs profile)' });
  }
  const vWarn = validation.filter((v) => v.level === 'warn');
  const vErr = validation.filter((v) => v.level === 'error');
  add({ key: 'inputs', group: 'Inputs', kind: vErr.length ? 'criterion' : 'guidance', label: 'Inputs are valid and within typical ranges', state: vErr.length ? 'fail' : vWarn.length ? 'warn' : 'pass',
    value: vErr.length ? `${vErr.length} error(s)` : vWarn.length ? `${vWarn.length} warning(s)` : 'All valid', limit: 'Validation rules', basis: 'Input validation layer' });
  return out;
}

function summarise(checks) {
  const crit = checks.filter((c) => c.kind === 'criterion');
  const fail = crit.filter((c) => c.state === 'fail').length;
  const passC = crit.filter((c) => c.state === 'pass').length;
  const adv = checks.filter((c) => c.kind === 'guidance' && c.state === 'warn').length;
  const state = fail ? 'fail' : adv ? 'warn' : 'pass';
  const title = fail ? 'DESIGN NOT ACCEPTABLE' : 'DESIGN ACCEPTABLE';
  const sub = `${passC} of ${crit.length} design criteria met${adv ? ` · ${adv} advisory item${adv > 1 ? 's' : ''} require${adv > 1 ? '' : 's'} review` : ''}`;
  return { state, title, sub, fail, pass: passC, total: crit.length, advisory: adv };
}

export function fmtN(v, dp = 2) {
  if (v == null || !isFinite(v)) return '—';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
