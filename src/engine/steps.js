/* Calculation trace: every step with its formula, the values substituted and the result.
   Markup in sym / formula strings: X_{sub} → subscript, X^{sup} → superscript (rendered by <Tex>). */

import { PSI_TO_KGCM2, MPA_TO_KGCM2, G_N_PER_TON, N_TO_TON } from './constants.js';

export function g(v, sig = 5) {
  if (v == null || !isFinite(v)) return '—';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-4) return v.toExponential(Math.max(1, sig - 1)).replace('e', '×10^{').replace(/$/, '}').replace('+', '');
  const dp = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
  return Number(v.toFixed(Math.min(dp, 8))).toLocaleString('en-US', { maximumFractionDigits: Math.min(dp, 8) });
}

export function buildSteps(p, r) {
  const groups = [];
  let n = 0;
  const G = (key, title, blurb) => { const grp = { key, title, blurb, steps: [] }; groups.push(grp); return grp; };
  const S = (grp, o) => { n += 1; grp.steps.push({ id: String(n).padStart(2, '0'), tag: 'calc', ...o }); };
  const { pipe, push, stress, buck, bending, clamp, prof } = r;
  const P = push.props;
  const isS = push.method === 'S';
  const piA = isS ? '3.14' : 'π';
  const x = r.x;

  /* A — pipe section */
  const A = G('A', 'Pipe section properties', `${pipe.gradeLabel} · ${pipe.odLabel}`);
  if (pipe.material === 'steel') {
    S(A, { sym: 'D', label: 'Outside diameter', formula: 'D = OD_{in} × 2.54', subst: `${g(p.pipe.odIn)} × 2.54`, value: pipe.D, unit: 'cm', tag: 'input' });
    S(A, { sym: 't', label: 'Wall thickness', formula: 't = WT_{mm} / 10', subst: `${g(p.pipe.wtMm)} / 10`, value: pipe.t, unit: 'cm', tag: 'input' });
  } else if (pipe.material === 'hdpe') {
    S(A, { sym: 'D', label: 'Outside diameter', formula: 'D = OD_{mm} / 10', subst: `${g(p.pipe.odMm)} / 10`, value: pipe.D, unit: 'cm', tag: 'input' });
    S(A, { sym: 't', label: 'Wall thickness', formula: 't = D / SDR', subst: `${g(pipe.D)} / ${g(p.pipe.sdr)}`, value: pipe.t, unit: 'cm' });
  } else {
    S(A, { sym: 'D', label: 'Outside diameter', formula: 'D = OD_{mm} / 10', subst: `${g(p.pipe.customOdMm)} / 10`, value: pipe.D, unit: 'cm', tag: 'input' });
    S(A, { sym: 't', label: 'Wall thickness', formula: 't = WT_{mm} / 10', subst: `${g(p.pipe.customWtMm)} / 10`, value: pipe.t, unit: 'cm', tag: 'input' });
  }
  S(A, { sym: 'd', label: 'Internal diameter', formula: 'd = D − 2t', subst: `${g(pipe.D)} − 2 × ${g(pipe.t)}`, value: pipe.d, unit: 'cm' });
  S(A, { sym: 'A_{o}', label: 'Outer cross-sectional area', formula: `A_{o} = ${piA} D^{2} / 4`, subst: `${piA} × ${g(pipe.D)}^{2} / 4`, value: P.Ao, unit: 'cm²', note: isS ? 'Workbook uses 3.14 for areas (H25).' : 'V1 workbook uses π (B29).' });
  S(A, { sym: 'A_{i}', label: 'Inner cross-sectional area', formula: `A_{i} = ${piA} d^{2} / 4`, subst: `${piA} × ${g(pipe.d)}^{2} / 4`, value: P.Ai, unit: 'cm²' });
  S(A, { sym: 'A_{s}', label: 'Steel / wall area', formula: 'A_{s} = A_{o} − A_{i}', subst: `${g(P.Ao)} − ${g(P.Ai)}`, value: P.As, unit: 'cm²' });
  S(A, { sym: 'SDR', label: 'Dimension ratio', formula: 'SDR = D / t', subst: `${g(pipe.D)} / ${g(pipe.t)}`, value: pipe.SDR, unit: '—' });
  S(A, { sym: 'D_{hole}', label: 'Reamed hole diameter', formula: p.mud.holeRule === 'custom' ? 'D_{hole} = input' : p.mud.holeRule === 'D+12' ? 'D_{hole} = D + 12 in (D ≥ 24 in), else 1.5 D' : 'D_{hole} = 1.5 D', subst: p.mud.holeRule === 'custom' ? `${g(p.mud.holeCustomMm)} mm` : `${g(pipe.D)} cm`, value: buck.Dhole, unit: 'cm', tag: p.mud.holeRule === 'custom' ? 'input' : 'assumed' });

  /* B — material */
  const B = G('B', 'Material properties', pipe.mat.label);
  S(B, { sym: 'ρ_{pipe}', label: 'Pipe material density', formula: 'ρ = ρ_{kg/m³} / 10^{6}', subst: `${g(p.pipe.density)} / 10^{6}`, value: pipe.rhoPipe, unit: 'kg/cm³', tag: 'input' });
  S(B, { sym: 'E', label: pipe.material === 'hdpe' ? 'Short-term flexural modulus' : "Young's modulus", formula: 'E', subst: `${g(p.pipe.E)} kg/cm² = ${g(p.pipe.E * 0.0980665)} MPa`, value: pipe.E, unit: 'kg/cm²', tag: 'input' });
  const conv = p.pipe.strengthUnit === 'psi' ? `${g(p.pipe.strength)} psi × ${PSI_TO_KGCM2}` : `${g(p.pipe.strength)} MPa × ${MPA_TO_KGCM2}`;
  S(B, { sym: pipe.mat.strengthLabel === 'SMYS' ? 'S' : 'S_{ref}', label: pipe.mat.strengthLabel, formula: p.pipe.strengthUnit === 'psi' ? 'S = S_{psi} × 0.070307' : 'S = S_{MPa} × 10.197', subst: conv, value: pipe.strengthKg, unit: 'kg/cm²', tag: 'input' });
  S(B, { sym: 'σ_{allow}', label: 'Allowable axial stress', formula: 'σ_{allow} = f × S', subst: `${g(pipe.allowFactor)} × ${g(pipe.strengthKg)}`, value: pipe.allowKg, unit: 'kg/cm²', tag: 'assumed' });

  /* C — weights */
  const C = G('C', 'Weight & buoyancy per unit length', `Pipe contents: ${({ empty: 'empty', mud: 'flooded with drilling fluid', water: 'water-filled' })[p.pipe.contents]}`);
  S(C, { sym: 'ρ_{mud}', label: 'Drilling-fluid density', formula: 'ρ_{mud} = ρ_{kg/m³} / 10^{6}', subst: `${g(p.mud.rhoMud)} / 10^{6}`, value: x.rhoMud, unit: 'kg/cm³', tag: 'input' });
  S(C, { sym: 'B', label: 'Buoyant force (displaced fluid)', formula: 'B = A_{o} × ρ_{mud}', subst: `${g(P.Ao)} × ${g(x.rhoMud)}`, value: P.B, unit: 'kg/cm' });
  S(C, { sym: 'W_{a}', label: 'Pipe weight in air', formula: 'W_{a} = A_{s} × ρ_{pipe}', subst: `${g(P.As)} × ${g(pipe.rhoPipe)}`, value: P.Wair, unit: 'kg/cm' });
  if (p.pipe.contents !== 'empty') S(C, { sym: 'W_{c}', label: 'Weight of contents', formula: 'W_{c} = A_{i} × ρ_{fill}', subst: `${g(P.Ai)} × ${g(x.rhoFill)}`, value: P.Wfill, unit: 'kg/cm', tag: 'assumed' });
  S(C, { sym: 'W_{net}', label: 'Net submerged (effective) weight', formula: p.pipe.contents === 'empty' ? 'W_{net} = W_{a} − B' : 'W_{net} = W_{a} + W_{c} − B', subst: p.pipe.contents === 'empty' ? `${g(P.Wair)} − ${g(P.B)}` : `${g(P.Wair)} + ${g(P.Wfill)} − ${g(P.B)}`, value: P.Wnet, unit: 'kg/cm', note: P.Wnet < 0 ? 'Negative ⇒ the pipe is buoyant and bears on the crown of the bore.' : 'Positive ⇒ the pipe bears on the invert of the bore.' });

  /* D — profile */
  const D = G('D', 'Profile geometry', r.sectionsUsed.source === 'profile' ? 'Section lengths and depths are taken from the profile' : 'Section lengths and depths are manual inputs; profile shown for reference');
  const pr = prof.inputs;
  S(D, { sym: 'AO', label: 'Entry tangent to vertex', formula: 'AO = h_{en} / sin θ_{en}', subst: `${g(pr.entryDepth)} / sin ${g(pr.entryAng)}°`, value: prof.AO, unit: 'm' });
  S(D, { sym: 'OB', label: 'Vertex to curve start (entry)', formula: 'OB = R_{en} tan(θ_{en}/2)', subst: `${g(pr.Ren)} × tan(${g(pr.entryAng / 2)}°)`, value: prof.OB, unit: 'm' });
  S(D, { sym: 'AB', label: 'L1 entry tangent', formula: 'AB = AO − OB', subst: `${g(prof.AO)} − ${g(prof.OB)}`, value: prof.AB, unit: 'm' });
  S(D, { sym: 'BC', label: 'L2 entry curve (arc)', formula: 'BC = R_{en} θ_{en}', subst: `${g(pr.Ren)} × ${g(prof.ten)} rad`, value: prof.BC, unit: 'm' });
  S(D, { sym: 'FP', label: 'Exit tangent to vertex', formula: 'FP = h_{ex} / sin θ_{ex}', subst: `${g(pr.exitDepth)} / sin ${g(pr.exitAng)}°`, value: prof.FP, unit: 'm' });
  S(D, { sym: 'EF', label: 'L5 exit tangent', formula: 'EF = FP − R_{ex} tan(θ_{ex}/2)', subst: `${g(prof.FP)} − ${g(prof.DP)}`, value: prof.EF, unit: 'm' });
  S(D, { sym: 'DE', label: 'L4 exit curve (arc)', formula: 'DE = R_{ex} θ_{ex}', subst: `${g(pr.Rex)} × ${g(prof.tex)} rad`, value: prof.DE, unit: 'm' });
  S(D, { sym: 'CD', label: 'L3 bottom run', formula: 'CD = L_{plan} − C_{x} − DF″ cos(θ_{ex}/2) − EF cos θ_{ex}', subst: `${g(pr.planDist)} − ${g(prof.nodes.C.x)} − ${g(prof.chordEx * Math.cos(prof.tex / 2))} − ${g(prof.EF * Math.cos(prof.tex))}`, value: prof.CD, unit: 'm' });
  S(D, { sym: 'L', label: 'HDD length along the bore', formula: 'L = AB + BC + CD + DE + EF', subst: prof.lengths.map((v) => g(v)).join(' + '), value: prof.total, unit: 'm' });
  if (r.sectionsUsed.source === 'profile') {
    S(D, { sym: 'h_{1…5}', label: `Section depths (${p.sections.depthBasis === 'mean' ? 'mean of section ends' : 'deeper end of section'})`, formula: 'from node depths', subst: r.sectionsUsed.d.map((v) => g(v, 4)).join(' / '), value: null, unit: 'm', tag: 'assumed' });
  }

  /* E — sections */
  const L = x.L, dp = x.dp;
  const secG = G('E', `Installation force by section — ${r.method.short}`, r.method.source);
  push.sections.forEach((sec, i) => {
    const Lc = L[i], th = sec.angle * Math.PI / 180;
    const head = `L${i + 1} · ${sec.name}`;
    S(secG, { sym: `L_{${i + 1}}`, label: `${head} — length`, formula: `L_{${i + 1}} = m × 100`, subst: `${g(Lc / 100)} × 100`, value: Lc, unit: 'cm', tag: r.sectionsUsed.source === 'manual' ? 'input' : 'calc', section: i });
    if (isS) {
      if (sec.type !== 'curve') {
        const fa = sec.terms.find((t) => t.key === 'fa'), ff = sec.terms.find((t) => t.key === 'ff'), fd = sec.terms.find((t) => t.key === 'fd'), fp = sec.terms.find((t) => t.key === 'fp');
        if (sec.type === 'tangent') S(secG, { sym: 'F_{a}', label: 'Axial weight component', formula: 'F_{a} = |W_{net} sin θ · L| / 1000', subst: `|${g(P.Wnet)} × sin(${g(th)}) × ${g(Lc)}| / 1000`, value: fa.value, unit: 't', section: i });
        S(secG, { sym: 'F_{f}', label: 'Soil friction', formula: 'F_{f} = μ |W_{net} cos θ| L / 1000', subst: `${g(x.mu)} × |${g(P.Wnet)} × cos(${g(th)})| × ${g(Lc)} / 1000`, value: ff.value, unit: 't', section: i });
        S(secG, { sym: 'F_{d}', label: 'Mud drag', formula: 'F_{d} = F_{mud} π D L / 1000', subst: `${g(x.Fmud)} × π × ${g(pipe.D)} × ${g(Lc)} / 1000`, value: fd.value, unit: 't', section: i });
        S(secG, { sym: 'F_{p}', label: 'Mud pressure head', formula: 'F_{p} = ρ_{mud} h A_{s} / 1000', subst: `${g(x.rhoMud)} × ${g(dp[i])} × ${g(P.As)} / 1000`, value: fp.value, unit: 't', section: i, tag: fp.included ? 'calc' : 'sheet', note: fp.note });
        S(secG, { sym: `ΔF_{${i + 1}}`, label: 'Section force', formula: sec.type === 'tangent' ? 'ΔF = F_{f} + F_{d} + F_{p} + F_{a}' : 'ΔF = F_{f} + F_{d}   (F_{p} not added — workbook F100)', subst: sec.terms.filter((t) => t.included).map((t) => g(t.value)).join(' + '), value: sec.net, unit: 't', section: i, strong: true });
      } else {
        const c = sec.capstan;
        const first = i === 1;
        S(secG, { sym: 'W', label: 'Capstan weight term', formula: 'W = |W_{net}| × 0.0981', subst: `|${g(P.Wnet)}| × 0.0981`, value: c.W, unit: '—', section: i });
        S(secG, { sym: 'T_{in}', label: first ? (r.x.corrected ? 'Initial tension = force entering the bend (corrected model)' : 'Initial tension T1 (fixed workbook input, O31)') : 'Initial tension = cumulative force at end of L3 (F101)', formula: first ? (r.x.corrected ? 'T_{in} = ΣF_{L1}' : 'T_{in} = T_{1}') : 'T_{in} = ΣF_{L3}', subst: g(c.Tin), value: c.Tin, unit: 't', section: i, tag: first && !r.x.corrected ? 'sheet' : 'calc' });
        S(secG, { sym: 'θ_{1}, θ_{2}', label: 'Capstan angles', formula: first ? 'θ_{1} = θ_{en}, θ_{2} = π/2' : 'θ_{1} = π/2, θ_{2} = θ_{ex}', subst: `${g(c.th1)} rad, ${g(c.th2)} rad`, value: null, unit: 'rad', section: i });
        S(secG, { sym: 'term_{1,2,3}(θ_{1})', label: 'Capstan terms at θ₁', formula: 'μ²RW sinθ/(μ²+1), RW sinθ/(μ²+1), 2μRW cosθ/(μ²+1)', subst: `${g(c.term1a)}, ${g(c.term2a)}, ${g(c.term3a)}  (R = ${g(c.R)} m)`, value: null, unit: 'N', section: i });
        S(secG, { sym: 'A', label: 'Parametric coefficient', formula: 'A = (T_{in}·9806.65 + t_{1} − t_{2} + t_{3}) / e^{μθ₁}', subst: `(${g(c.Tin)} × ${G_N_PER_TON} + ${g(c.term1a)} − ${g(c.term2a)} + ${g(c.term3a)}) / e^{${g(x.mu)}×${g(c.th1)}}`, value: c.A, unit: 'N', section: i });
        S(secG, { sym: 'T_{2}', label: 'Tension at θ₂', formula: 'T_{2} = A e^{γθ₂} − t_{1} + t_{2} − t_{3}', subst: `${g(c.A)} × e^{${g(c.gm)}×${g(c.th2)}} − ${g(c.term1b)} + ${g(c.term2b)} − ${g(c.term3b)}`, value: c.Tnewton, unit: 'N', section: i, note: c.gm === 0 ? 'γ = 0: the workbook references an empty cell (H38) for the exit-curve growth exponent.' : 'γ = μ' });
        S(secG, { sym: 'F_{c}', label: 'Force due to curvature', formula: 'F_{c} = T_{2} × 0.0001019716', subst: `${g(c.Tnewton)} × ${N_TO_TON}`, value: c.T, unit: 't', section: i });
        const fd = sec.terms.find((t) => t.key === 'fd'), fp = sec.terms.find((t) => t.key === 'fp');
        S(secG, { sym: 'F_{d}', label: 'Mud drag', formula: 'F_{d} = F_{mud} π D L / 1000', subst: `${g(x.Fmud)} × π × ${g(pipe.D)} × ${g(Lc)} / 1000`, value: fd.value, unit: 't', section: i });
        S(secG, { sym: 'F_{p}', label: 'Mud pressure head', formula: 'F_{p} = ρ_{mud} h A_{s} / 1000', subst: `${g(x.rhoMud)} × ${g(dp[i])} × ${g(P.As)} / 1000`, value: fp.value, unit: 't', section: i });
        S(secG, { sym: `ΔF_{${i + 1}}`, label: 'Section force', formula: 'ΔF = F_{c} + F_{d} + F_{p}', subst: sec.terms.map((t) => g(t.value)).join(' + '), value: sec.net, unit: 't', section: i, strong: true });
      }
    } else {
      const fd = sec.terms.find((t) => t.key === 'fd'), ff = sec.terms.find((t) => t.key === 'ff'), fa = sec.terms.find((t) => t.key === 'fa');
      S(secG, { sym: 'F_{d}', label: 'Fluid drag', formula: 'F_{d} = 3.14 D f_{d} L / 1000', subst: `3.14 × ${g(pipe.D)} × ${g(x.Fmud)} × ${g(Lc)} / 1000`, value: fd.value, unit: 't', section: i });
      S(secG, { sym: 'F_{f}', label: 'Bore friction', formula: sec.type === 'straight' ? 'F_{f} = |W| L μ / 1000' : 'F_{f} = |W| cos θ L μ / 1000', subst: sec.type === 'straight' ? `${g(P.N)} × ${g(Lc)} × ${g(x.mu)} / 1000` : `${g(P.N)} × cos(${g(th)}) × ${g(Lc)} × ${g(x.mu)} / 1000`, value: ff.value, unit: 't', section: i });
      if (fa) S(secG, { sym: 'F_{a}', label: `Axial weight component (${i < 2 ? 'entry side, +W sinθ' : 'exit side, −W sinθ'})`, formula: i < 2 ? 'F_{a} = W sin θ L / 1000' : 'F_{a} = −W sin θ L / 1000', subst: `${i < 2 ? '' : '−'}${g(P.Wnet)} × sin(${g(th)}) × ${g(Lc)} / 1000`, value: fa.value, unit: 't', section: i });
      if (sec.type === 'curve') S(secG, { sym: 'e^{μθ}', label: 'Capstan factor', formula: 'e^{μθ}', subst: `e^{${g(x.mu)} × ${g(th)}}`, value: sec.capstanFactor, unit: '—', section: i });
      const prev = i === 0 ? 0 : push.sections[i - 1].cum;
      let formula, subst;
      if (i === 1) { formula = 'T = (T_{prev} + F_{d} + F_{f} + F_{a}) e^{μθ_{en}}'; subst = `(${g(prev)} + ${g(fd.value)} + ${g(ff.value)} + ${g(fa.value)}) × ${g(sec.capstanFactor)}`; }
      else if (i === 3) { formula = 'T = T_{prev} e^{μθ_{ex}} + F_{d} + F_{f} + F_{a}'; subst = `${g(prev)} × ${g(sec.capstanFactor)} + ${g(fd.value)} + ${g(ff.value)} + ${g(fa.value)}`; }
      else { formula = 'T = T_{prev} + ΣF'; subst = `${g(prev)} + ${sec.terms.map((t) => g(t.value)).join(' + ')}`; }
      S(secG, { sym: `T_{${i + 1}}`, label: 'Carried tension at end of section', formula, subst, value: sec.cum, unit: 't', section: i, strong: true });
    }
    if (isS) S(secG, { sym: `ΣF_{${i + 1}}`, label: `Cumulative force to end of L${i + 1}`, formula: i === 0 ? 'ΣF = ΔF_{1}' : `ΣF = ΣF_{${i}} + ΔF_{${i + 1}}`, subst: i === 0 ? g(sec.net) : `${g(push.sections[i - 1].cum)} + ${g(sec.net)}`, value: sec.cum, unit: 't', section: i, strong: true });
  });
  S(secG, { sym: 'F_{max}', label: 'Maximum installation (push) force', formula: isS ? 'F_{max} = ΣF_{5}' : 'F_{max} = max(T_{1…5})', subst: isS ? g(push.total) : push.sections.map((s) => g(s.cum)).join(', '), value: push.peak, unit: 't', strong: true, key: true });

  /* F — axial stress */
  const Fg = G('F', 'Axial stress check', `σ ≤ ${g(pipe.allowFactor)} × ${pipe.mat.strengthLabel}`);
  S(Fg, { sym: 'σ', label: 'Applied axial stress', formula: 'σ = F_{max} × 1000 / A_{s}', subst: `${g(push.peak)} × 1000 / ${g(P.As)}`, value: stress.sigma, unit: 'kg/cm²' });
  S(Fg, { sym: 'U', label: 'Utilisation', formula: 'U = σ / σ_{allow}', subst: `${g(stress.sigma)} / ${g(stress.allow)}`, value: stress.util * 100, unit: '%', strong: true });
  S(Fg, { sym: 'RF', label: 'Reserve factor', formula: 'RF = σ_{allow} / σ', subst: `${g(stress.allow)} / ${g(stress.sigma)}`, value: stress.reserve, unit: '—' });
  S(Fg, { sym: 'FoS', label: `Factor of safety vs ${pipe.mat.strengthLabel}`, formula: 'FoS = S / σ', subst: `${g(pipe.strengthKg)} / ${g(stress.sigma)}`, value: stress.fosRef, unit: '—' });
  S(Fg, { sym: 'F_{allow}', label: 'Push force at the allowable stress', formula: 'F_{allow} = σ_{allow} A_{s} / 1000', subst: `${g(stress.allow)} × ${g(P.As)} / 1000`, value: stress.Fallow, unit: 't' });

  /* G — buckling */
  const Bk = G('G', 'Buckling check (constrained in the bore)', `Criterion: ${buck.criterion === 'gao' ? 'Gao et al. sinusoidal' : 'Dawson–Paslay sinusoidal'} · weight basis: ${buck.weight === 'air' ? 'pipe in air' : 'effective (submerged)'}`);
  S(Bk, { sym: 'I', label: 'Second moment of area', formula: 'I = π (D^{4} − d^{4}) / 64', subst: `π × (${g(pipe.D)}^{4} − ${g(pipe.d)}^{4}) / 64`, value: buck.I, unit: 'cm⁴' });
  S(Bk, { sym: 'α', label: 'Inclination of pipe axis to gravity', formula: `α = 90° − θ_{${buck.angleRef === 'entry' ? 'en' : 'ex'}}`, subst: `90 − ${g(buck.refAng)}`, value: 90 - buck.refAng, unit: '°', tag: 'assumed' });
  S(Bk, { sym: 'r_{c}', label: 'Radial clearance, pipe to bore', formula: 'r_{c} = (D_{hole} − D) / 2', subst: `(${g(buck.Dhole)} − ${g(pipe.D)}) / 2`, value: buck.clearance, unit: 'cm' });
  S(Bk, { sym: 'w', label: 'Weight per unit length', formula: buck.weight === 'air' ? 'w = W_{a}' : 'w = |W_{net}|', subst: g(buck.w), value: buck.w, unit: 'kg/cm', tag: 'assumed' });
  S(Bk, { sym: 'F_{DP}', label: 'Sinusoidal buckling load (Dawson–Paslay)', formula: 'F_{DP} = 2 √(E I w sin α / r_{c}) / 1000', subst: `2 × √(${g(pipe.E)} × ${g(buck.I)} × ${g(buck.w)} × sin ${g(90 - buck.refAng)}° / ${g(buck.clearance)}) / 1000`, value: buck.Fdp, unit: 't', strong: true });
  S(Bk, { sym: 'μ_{b}', label: 'Friction coefficient, pipe / bore wall', formula: 'μ_{b}', subst: p.buckling.muMode === 'soil' ? 'same as soil friction μ' : 'input', value: buck.muB, unit: '—', tag: 'input' });
  S(Bk, { sym: 'P_{crs}', label: 'Gao coefficient', formula: 'P_{crs} = 1 + 0.193 μ_{b}^{0.67}', subst: `1 + 0.193 × ${g(buck.muB)}^{0.67}`, value: buck.Pcrs, unit: '—' });
  S(Bk, { sym: 'A_{crs}', label: 'Gao coefficient', formula: 'A_{crs} = 0.774 μ_{b}^{0.33} − 0.371 μ_{b}', subst: `0.774 × ${g(buck.muB)}^{0.33} − 0.371 × ${g(buck.muB)}`, value: buck.Acrs, unit: '—' });
  S(Bk, { sym: 'β_{crs}', label: 'Friction factor, sinusoidal', formula: 'β_{crs} = ½P²(1 − 1.5A²) + (1/2P²)(1 + 0.125A² + 8μ_{b}/(πA))', subst: `P = ${g(buck.Pcrs)}, A = ${g(buck.Acrs)}`, value: buck.Bcrs, unit: '—' });
  S(Bk, { sym: 'F_{sin}', label: 'Sinusoidal buckling load (Gao et al. 2010)', formula: 'F_{sin} = β_{crs} F_{DP}', subst: `${g(buck.Bcrs)} × ${g(buck.Fdp)}`, value: buck.Fgao, unit: 't', strong: true });
  S(Bk, { sym: 'β_{crh}', label: 'Friction factor, helical', formula: `β_{crh} = √(30(${isS ? '3.14' : 'π'} + 2μ_{b}) / (${isS ? '3.14' : 'π'}(15 − 7μ_{b}π)))`, subst: `μ_{b} = ${g(buck.muB)}`, value: buck.Bcrh, unit: '—' });
  S(Bk, { sym: 'F_{hel}', label: 'Helical buckling load (Gao et al. 2010)', formula: 'F_{hel} = β_{crh} F_{DP}', subst: `${g(buck.Bcrh)} × ${g(buck.Fdp)}`, value: buck.Fhel, unit: 't', strong: true });
  S(Bk, { sym: 'SF_{b}', label: 'Safety factor against the buckling criterion', formula: 'SF = F_{crit} / F_{max}', subst: `${g(buck.Fsin)} / ${g(push.peak)}`, value: buck.sf, unit: '—', strong: true, key: true });
  if (buck.onsetSin != null) S(Bk, { sym: 's_{sin}', label: 'Chainage where the push force reaches the sinusoidal load', formula: 'linear between section boundaries', subst: `F(s) = ${g(buck.Fsin)} t`, value: buck.onsetSin, unit: 'm', tag: 'assumed', note: 'Interpolated — the workbook gives forces only at section boundaries.' });

  /* H — bending (advisory) */
  const Hb = G('H', 'Bending & radius (advisory)', 'Engineering guidance — not part of the workbook acceptance criteria');
  S(Hb, { sym: 'R_{min}', label: 'Smallest radius of curvature', formula: 'R_{min} = min(R_{en}, R_{ex})', subst: `min(${g(x.Ren)}, ${g(x.Rex)})`, value: bending.Rmin, unit: 'm', tag: 'input' });
  S(Hb, { sym: 'σ_{b}', label: 'Elastic bending stress in the curve', formula: 'σ_{b} = E D / (2R)', subst: `${g(pipe.E)} × ${g(pipe.D)} / (2 × ${g(bending.Rmin * 100)})`, value: bending.sigmaB, unit: 'kg/cm²', tag: 'calc' });
  S(Hb, { sym: 'R_{guide}', label: 'Radius guidance', formula: pipe.material === 'hdpe' ? 'R ≥ k × OD (PPI)' : 'R ≥ 1200 × OD', subst: bending.guideBasis, value: bending.guide, unit: 'm', tag: 'guidance' });

  /* I — clamp */
  if (clamp) {
    const Cl = G('I', 'Thruster clamp check', 'HDPE_Push_Clamp_Calc_V1 — Clamp_Check');
    S(Cl, { sym: 'F_{push}', label: 'Peak push force', formula: 'F_{push} = F_{max} × 9.81', subst: `${g(push.peak)} × 9.81`, value: clamp.Fpush, unit: 'kN' });
    S(Cl, { sym: 'F_{clamp}', label: 'Required clamp (normal) force', formula: 'F_{clamp} = F_{push} × SF / μ_{grip}', subst: `${g(clamp.Fpush)} × ${g(+p.clamp.sf)} / ${g(+p.clamp.muGrip)}`, value: clamp.Freq, unit: 'kN', strong: true });
    S(Cl, { sym: 'A_{pad}', label: 'Total pad contact area', formula: 'A = n × L_{pad} × W_{pad}', subst: `${g(+p.clamp.pads)} × ${g(+p.clamp.padLength)} × ${g(+p.clamp.padWidth)}`, value: clamp.Apad, unit: 'cm²', tag: 'input' });
    S(Cl, { sym: 'F_{cap}', label: 'Clamp force capacity', formula: 'F_{cap} = p_{max} × A × 0.1', subst: `${g(+p.clamp.pMax)} × ${g(clamp.Apad)} × 0.1`, value: clamp.Fcap, unit: 'kN', strong: true });
    S(Cl, { sym: 'σ_{bear}', label: 'Allowable wall bearing stress', formula: p.clamp.bearingMode === 'custom' ? 'input' : 'σ_{bear} = σ_{allow}', subst: `${g(clamp.sigmaBearing)} MPa`, value: clamp.sigmaBearing, unit: 'MPa', tag: p.clamp.bearingMode === 'custom' ? 'input' : 'assumed' });
    S(Cl, { sym: 'p_{allow}', label: 'Allowable clamp pressure on the wall', formula: 'p_{allow} = 2σ_{bear} / (SDR − 1)', subst: `2 × ${g(clamp.sigmaBearing)} / (${g(clamp.SDR)} − 1)`, value: clamp.pAllow, unit: 'MPa' });
    S(Cl, { sym: 'p', label: 'Clamp pressure actually applied', formula: 'p = F_{clamp} / (A × 0.1)', subst: `${g(clamp.Freq)} / (${g(clamp.Apad)} × 0.1)`, value: clamp.pApplied, unit: 'MPa', strong: true });
  }

  return { groups, count: n };
}
