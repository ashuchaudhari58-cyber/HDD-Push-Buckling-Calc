/* METHOD S — TESPL segmental push force (Push force Calculation.xlsx).
   Five sections accumulated in the direction of push: L1 entry tangent, L2 entry curve, L3 horizontal,
   L4 exit curve, L5 exit tangent. Straight sections: axial weight + soil friction + mud drag + mud
   pressure head. Curves: capstan relation (sheet cells O23–O65) + mud drag + mud pressure head.
   Reproduces the workbook exactly, including these sheet conventions (all reported in the trace):
     • cross-section areas use 3.14 (H25/H26), mud drag uses PI() (G56)
     • entry-curve initial tension T1 is a fixed input (O31: 4.11 t) — "corrected" links it to the
       force entering the bend
     • exit-curve growth exponent references an empty cell (H38 → 0) — "corrected" uses μ
     • the L3 mud-pressure term is computed (F99) but not added to the L3 net force (F100 = F96 + F97) */

import { G_N_PER_TON, N_TO_TON } from './constants.js';

export function pushSegmental(x) {
  const { D, t, rhoPipe, Fmud, mu, rhoMud, entryAng, exitAng, Ren, Rex, L, dp, T1, corrected, contents, rhoFill } = x;
  const PI = Math.PI;
  const d = D - 2 * t;
  const Ao = (3.14 * D * D) / 4;
  const Ai = (3.14 * d * d) / 4;
  const As = Ao - Ai;
  const B = Ao * rhoMud;                       // buoyant force, kg/cm
  const Wair = As * rhoPipe;                   // empty pipe in air, kg/cm
  const Wfill = contents === 'empty' ? 0 : Ai * rhoFill;
  const Wnet = Wair + Wfill - B;               // net (submerged) weight, kg/cm
  const en = entryAng * PI / 180, ex = exitAng * PI / 180;

  const Fa = (a, l) => Math.abs(Wnet * Math.sin(a) * l) / 1000;
  const Ff = (a, l) => mu * Math.abs(Wnet * Math.cos(a)) * l / 1000;
  const Fd = (l) => Fmud * PI * D * l / 1000;
  const Fp = (dep) => rhoMud * dep * As / 1000;

  function capstan(th1, th2, Tin, gm, Rm) {
    const W = Math.abs(Wnet) * 0.0981, k = mu * mu + 1;
    const t1 = (th) => (mu * mu * Rm * W * Math.sin(th)) / k;
    const t2 = (th) => (Rm * W * Math.sin(th)) / k;
    const t3 = (th) => (2 * mu * Rm * W * Math.cos(th)) / k;
    const A = (Tin * G_N_PER_TON + t1(th1) - t2(th1) + t3(th1)) / Math.exp(mu * th1);
    const Tn = A * Math.exp(gm * th2) - t1(th2) + t2(th2) - t3(th2);
    return { W, k, A, term1a: t1(th1), term2a: t2(th1), term3a: t3(th1), term1b: t1(th2), term2b: t2(th2), term3b: t3(th2), Tnewton: Tn, T: Tn * N_TO_TON, th1, th2, Tin, gm, R: Rm };
  }

  // Section 1 — entry tangent
  const s1 = { fa: Fa(en, L[0]), ff: Ff(en, L[0]), fd: Fd(L[0]), fp: Fp(dp[0]) };
  s1.net = s1.ff + s1.fd + s1.fp + s1.fa;
  const c1 = s1.net;
  // Section 2 — entry curve
  const entryT1 = corrected ? c1 : T1;
  const cap2 = capstan(en, PI / 2, entryT1, mu, Ren);
  const s2 = { fc: cap2.T, fd: Fd(L[1]), fp: Fp(dp[1]) };
  s2.net = s2.fc + s2.fd + s2.fp;
  const c2 = c1 + s2.net;
  // Section 3 — horizontal
  const s3 = { fa: 0, ff: Ff(0, L[2]), fd: Fd(L[2]), fp: Fp(dp[2]) };
  s3.net = s3.ff + s3.fd;                      // F100: mud pressure not included (sheet)
  const c3 = c2 + s3.net;
  // Section 4 — exit curve
  const exitGrowth = corrected ? mu : 0;
  const cap4 = capstan(PI / 2, ex, c3, exitGrowth, Rex);
  const s4 = { fc: cap4.T, fd: Fd(L[3]), fp: Fp(dp[3]) };
  s4.net = s4.fc + s4.fd + s4.fp;
  const c4 = c3 + s4.net;
  // Section 5 — exit tangent
  const s5 = { fa: Fa(ex, L[4]), ff: Ff(ex, L[4]), fd: Fd(L[4]), fp: Fp(dp[4]) };
  s5.net = s5.fa + s5.ff + s5.fd + s5.fp;
  const c5 = c4 + s5.net;

  const term = (key, label, value, included = true, note) => ({ key, label, value, included, note });
  const sections = [
    { n: 1, key: 'L1', name: 'Entry tangent', type: 'tangent', L: L[0], depth: dp[0], angle: entryAng,
      terms: [term('fa', 'Axial weight component', s1.fa), term('ff', 'Soil friction', s1.ff), term('fd', 'Mud drag', s1.fd), term('fp', 'Mud pressure head', s1.fp)], net: s1.net, cum: c1 },
    { n: 2, key: 'L2', name: 'Entry curve', type: 'curve', L: L[1], depth: dp[1], R: Ren, angle: entryAng,
      terms: [term('fc', 'Curvature (capstan)', s2.fc), term('fd', 'Mud drag', s2.fd), term('fp', 'Mud pressure head', s2.fp)], net: s2.net, cum: c2, capstan: cap2 },
    { n: 3, key: 'L3', name: 'Horizontal section', type: 'straight', L: L[2], depth: dp[2], angle: 0,
      terms: [term('fa', 'Axial weight component', 0), term('ff', 'Soil friction', s3.ff), term('fd', 'Mud drag', s3.fd), term('fp', 'Mud pressure head', s3.fp, false, 'Computed but not added to the L3 net force, as in the workbook (F100 = F96 + F97)')], net: s3.net, cum: c3 },
    { n: 4, key: 'L4', name: 'Exit curve', type: 'curve', L: L[3], depth: dp[3], R: Rex, angle: exitAng,
      terms: [term('fc', 'Curvature (capstan)', s4.fc), term('fd', 'Mud drag', s4.fd), term('fp', 'Mud pressure head', s4.fp)], net: s4.net, cum: c4, capstan: cap4 },
    { n: 5, key: 'L5', name: 'Exit tangent', type: 'tangent', L: L[4], depth: dp[4], angle: exitAng,
      terms: [term('fa', 'Axial weight component', s5.fa), term('ff', 'Soil friction', s5.ff), term('fd', 'Mud drag', s5.fd), term('fp', 'Mud pressure head', s5.fp)], net: s5.net, cum: c5 },
  ];

  return {
    method: 'S',
    props: { D, t, d, Ao, Ai, As, B, Wair, Wfill, Wnet, piArea: 3.14 },
    sections,
    total: c5,
    peak: c5,
    entryT1, exitGrowth,
  };
}
