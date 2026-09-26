/* METHOD C — Capstan carry-through push force (HDPE_Push_Clamp_Calc_V1.xlsx, ASTM F1962 / PPI basis).
   Tension is carried forward through the bore; curves multiply by e^(μ·Δθ). Slurry hydrostatic head is
   NOT in the axial sum (V1 README: it acts normal to the pipe; its effect enters through buoyancy).
   V1 models entry curve + straight + exit curve. Here the same equations are generalised to five
   sections (entry tangent and exit tangent added as straight inclined runs). With L1 = L5 = 0 the
   results are identical to the workbook (Push_900: 27.586 t, Push_630: 6.552 t).
     entry tangent  T_B = T_A + drag + fric + axial
     entry curve    T_C = (T_B + drag + fric + axial) · e^(μ·θen)      (V1 B44, with T_B = 0)
     straight       T_D = T_C + drag + |W|·L·μ                           (V1 B48)
     exit curve     T_E = T_D · e^(μ·θex) + drag + fric − W·sinθex·L     (V1 B53)
     exit tangent   T_F = T_E + drag + fric − W·sinθex·L
   drag = 3.14·D·fd·L,  fric = |W|·cosθ·L·μ,  axial = W·sinθ·L  (all /1000 → ton)                        */

export function pushCapstan(x) {
  const { D, t, rhoPipe, Fmud, mu, rhoMud, entryAng, exitAng, L, contents, rhoFill } = x;
  const d = D - 2 * t;
  const Ao = Math.PI * D * D / 4;
  const Ai = Math.PI * d * d / 4;
  const As = Ao - Ai;
  const Wp = As * rhoPipe;                         // B31 pipe wall weight, kg/cm
  const Ws = contents === 'empty' ? 0 : Ai * rhoFill; // B32 contents (V1: flooded with slurry)
  const Fb = Ao * rhoMud;                          // B33 buoyancy
  const Weff = Wp + Ws - Fb;                       // B34 effective weight (+down / −up)
  const N = Math.abs(Weff);                        // B35
  const en = entryAng * Math.PI / 180, ex = exitAng * Math.PI / 180;

  const drag = (l) => 3.14 * D * Fmud * l / 1000;
  const fric = (a, l) => N * Math.cos(a) * l * mu / 1000;
  const eEn = Math.exp(mu * en), eEx = Math.exp(mu * ex);

  // L1 entry tangent
  const a1 = { fd: drag(L[0]), ff: fric(en, L[0]), fa: Weff * Math.sin(en) * L[0] / 1000 };
  const T1 = a1.fd + a1.ff + a1.fa;
  // L2 entry curve
  const a2 = { fd: drag(L[1]), ff: fric(en, L[1]), fa: Weff * Math.sin(en) * L[1] / 1000 };
  const T2 = (T1 + a2.fd + a2.ff + a2.fa) * eEn;
  a2.fc = T2 - (T1 + a2.fd + a2.ff + a2.fa);       // capstan increment, for reporting
  // L3 straight
  const a3 = { fd: drag(L[2]), ff: N * L[2] * mu / 1000, fa: 0 };
  const T3 = T2 + a3.fd + a3.ff;
  // L4 exit curve
  const a4 = { fd: drag(L[3]), ff: fric(ex, L[3]), fa: -Weff * Math.sin(ex) * L[3] / 1000 };
  const T4 = T3 * eEx + a4.fd + a4.ff + a4.fa;
  a4.fc = T3 * eEx - T3;
  // L5 exit tangent
  const a5 = { fd: drag(L[4]), ff: fric(ex, L[4]), fa: -Weff * Math.sin(ex) * L[4] / 1000 };
  const T5 = T4 + a5.fd + a5.ff + a5.fa;

  const term = (key, label, value, included = true, note) => ({ key, label, value, included, note });
  const sections = [
    { n: 1, key: 'L1', name: 'Entry tangent', type: 'tangent', L: L[0], angle: entryAng,
      terms: [term('fd', 'Fluid drag', a1.fd), term('ff', 'Bore friction', a1.ff), term('fa', 'Axial weight component', a1.fa)], net: T1, cum: T1 },
    { n: 2, key: 'L2', name: 'Entry curve', type: 'curve', L: L[1], angle: entryAng,
      terms: [term('fd', 'Fluid drag', a2.fd), term('ff', 'Bore friction', a2.ff), term('fa', 'Axial weight component', a2.fa), term('fc', `Capstan growth e^(μθ) = ${eEn.toFixed(4)}`, a2.fc)], net: T2 - T1, cum: T2, capstanFactor: eEn },
    { n: 3, key: 'L3', name: 'Horizontal section', type: 'straight', L: L[2], angle: 0,
      terms: [term('fd', 'Fluid drag', a3.fd), term('ff', 'Bore friction', a3.ff)], net: T3 - T2, cum: T3 },
    { n: 4, key: 'L4', name: 'Exit curve', type: 'curve', L: L[3], angle: exitAng,
      terms: [term('fc', `Capstan growth on carried force e^(μθ) = ${eEx.toFixed(4)}`, a4.fc), term('fd', 'Fluid drag', a4.fd), term('ff', 'Bore friction', a4.ff), term('fa', 'Axial weight component', a4.fa)], net: T4 - T3, cum: T4, capstanFactor: eEx },
    { n: 5, key: 'L5', name: 'Exit tangent', type: 'tangent', L: L[4], angle: exitAng,
      terms: [term('fd', 'Fluid drag', a5.fd), term('ff', 'Bore friction', a5.ff), term('fa', 'Axial weight component', a5.fa)], net: T5 - T4, cum: T5 },
  ];
  const peak = Math.max(T1, T2, T3, T4, T5);         // V1 B55: MAX over the tension points

  return {
    method: 'C',
    props: { D, t, d, Ao, Ai, As, B: Fb, Wair: Wp, Wfill: Ws, Wnet: Weff, N, piArea: Math.PI, eEn, eEx },
    sections,
    total: T5,
    peak,
  };
}
