/* HDD crossing profile geometry.
   profileCore() is a line-for-line port of crossing_profile_geometry_calculator.xlsx ("Insert Data"):
     AO = h_en / sin θen              BC" (chord) = 2 R sin(θ/2)          OB = OC = (BC"/2) / cos(θ/2)
     AB = AO − OB   BC = R·θ   CD = plan − C.x − DF"·cos(θex/2) − EF·cos θex   DE = R·θex   EF = FP − DP
   obstacleProfile() adds the crossing-type helper (river / canal / road / rail) that sizes the bottom
   depth from the cover requirement and the entry/exit setbacks from the bank edges. */

const D2R = Math.PI / 180;

export const CROSSING_TYPES = [
  { key: 'open', label: 'Open ground', hint: 'Enter plan distance and bottom depths directly (profile workbook method)' },
  { key: 'river', label: 'River crossing', hint: 'Bank to bank · cover below the scoured bed' },
  { key: 'canal', label: 'Canal / drain / nala', hint: 'Trapezoidal channel · cover below the bed' },
  { key: 'road', label: 'Road / highway', hint: 'Right-of-way · cover below road level' },
  { key: 'rail', label: 'Railway', hint: 'Track corridor · cover below formation level' },
];

export function profileCore({ entryAng, exitAng, entryDepth, exitDepth, Ren, Rex, planDist }) {
  const ten = entryAng * Math.PI / 180;               // G9
  const tex = exitAng * Math.PI / 180;                // G10
  const AO = entryAng === 0 ? 0 : entryDepth / Math.sin(ten);        // G1
  const chordEn = 2 * Ren * Math.sin(ten / 2);                        // G2
  const OB = (chordEn / 2) / Math.cos(ten / 2);                       // G3
  const FP = exitAng === 0 ? 0 : exitDepth / Math.sin(tex);          // G5
  const chordEx = 2 * Rex * Math.sin(tex / 2);                        // G6
  const DP = (chordEx / 2) / Math.cos(tex / 2);                       // G7

  const AB = AO - OB;                                                 // B11
  const BC = Ren * ten;                                               // B12
  const DE = Rex * tex;                                               // B14
  const EF = FP - DP;                                                 // B15

  const A = { x: 0, y: 0 };
  const B = { x: AB * Math.cos(ten), y: -AB * Math.sin(ten) };                              // B21,C21
  const C = { x: B.x + chordEn * Math.cos(ten / 2), y: B.y - chordEn * Math.sin(ten / 2) }; // B22,C22
  const CD = planDist - C.x - chordEx * Math.cos(tex / 2) - EF * Math.cos(tex);            // B13
  const D = { x: C.x + CD, y: C.y };                                                        // B23,C23
  const E = { x: D.x + chordEx * Math.cos(tex / 2), y: D.y + chordEx * Math.sin(tex / 2) }; // B24,C24
  const F = { x: E.x + EF * Math.cos(tex), y: E.y + EF * Math.sin(tex) };                   // B25,C25

  const lengths = [AB, BC, CD, DE, EF];
  const total = lengths.reduce((a, b) => a + b, 0);                   // B16
  const issues = [];
  if (entryAng <= 0 && entryDepth > 0) issues.push({ key: 'entryAng', msg: 'Entry angle must be greater than 0° to reach the bottom depth.' });
  if (exitAng <= 0 && exitDepth > 0) issues.push({ key: 'exitAng', msg: 'Exit angle must be greater than 0° to rise to the exit point.' });
  if (AB < -1e-9) issues.push({ key: 'entryDepth', msg: `Entry curve alone drops ${fmt(Ren * (1 - Math.cos(ten)))} m, deeper than the ${fmt(entryDepth)} m bottom depth. Increase the depth, reduce the entry angle or reduce the entry radius.` });
  if (EF < -1e-9) issues.push({ key: 'exitDepth', msg: `Exit curve alone rises ${fmt(Rex * (1 - Math.cos(tex)))} m, more than the ${fmt(exitDepth)} m exit depth. Increase the depth, reduce the exit angle or reduce the exit radius.` });
  if (CD < -1e-9) issues.push({ key: 'planDist', msg: `Plan distance is too short for the tangents and curves: at least ${fmt(planDist - CD)} m is needed.` });

  return {
    inputs: { entryAng, exitAng, entryDepth, exitDepth, Ren, Rex, planDist },
    ten, tex, AO, OB, FP, DP, chordEn, chordEx,
    AB, BC, CD, DE, EF, lengths, total,
    nodes: { A, B, C, D, E, F },
    horizontal: [B.x - A.x, C.x - B.x, D.x - C.x, E.x - D.x, F.x - E.x],
    vertical: [A.y - B.y, B.y - C.y, 0, E.y - D.y, F.y - E.y],
    planCheck: F.x,                                                    // B17 (verify = plan distance)
    feasible: issues.length === 0,
    issues,
  };
}

/* Horizontal extent from A to C (entry) or from D to F (exit) for a given depth. */
function sideExtent(depth, angDeg, R) {
  const t = angDeg * D2R;
  if (angDeg <= 0) return { tangent: 0, run: 0 };
  const chord = 2 * R * Math.sin(t / 2);
  const tangent = depth / Math.sin(t) - (chord / 2) / Math.cos(t / 2);
  return { tangent, run: tangent * Math.cos(t) + chord * Math.cos(t / 2) };
}

/* Crossing-type helper. Levels relative to bank top / road level = 0 (positive up). */
export function obstacleProfile(p) {
  const W = +p.width || 0;
  const b = p.type === 'road' || p.type === 'rail' ? 0 : +p.bedDepth || 0;
  const s = p.type === 'road' || p.type === 'rail' ? 0 : +p.sideSlope || 0;
  const sc = p.type === 'river' ? +p.scour || 0 : 0;
  const cmin = +p.coverBed || 0;
  const cb = +p.coverBank || 0;
  const ex = +p.extraDepth || 0;
  const ge = +p.entryGround || 0;
  const gx = +p.exitGround || 0;
  const zBottom = -(b + sc + cmin + ex);
  const hen = ge - zBottom;
  const hex = gx - zBottom;
  const toe = s * b;

  const en = sideExtent(hen, p.entryAng, p.Ren);
  const exs = sideExtent(hex, p.exitAng, p.Rex);

  // minimum setback: bottom run starts at the bank toe, and the pipe is at least `cb` below
  // bank top at the bank edge (drop from the entry point = entry ground level + cb)
  const minSetEntry = Math.max(en.run - toe, dropToX(ge + cb, hen, p.entryAng, p.Ren));
  const minSetExit = Math.max(exs.run - toe, dropToX(gx + cb, hex, p.exitAng, p.Rex));
  const setEntry = p.fixEntry && +p.entrySetback > 0 ? +p.entrySetback : minSetEntry;
  const setExit = p.fixExit && +p.exitSetback > 0 ? +p.exitSetback : minSetExit;
  const planDist = setEntry + W + setExit;

  const core = profileCore({ entryAng: p.entryAng, exitAng: p.exitAng, entryDepth: hen, exitDepth: hex, Ren: p.Ren, Rex: p.Rex, planDist });

  const edgeL = setEntry, edgeR = setEntry + W, toeL = edgeL + toe, toeR = edgeR - toe;
  const ground = (x) => groundAt(x, { ge, gx, edgeL, edgeR, toeL, toeR, b, planDist });
  const pts = [
    { key: 'edgeL', label: p.type === 'road' || p.type === 'rail' ? 'Corridor edge (entry side)' : 'Bank edge (entry side)', x: edgeL, req: cb },
    { key: 'toeL', label: 'Bank toe (entry side)', x: toeL, req: sc + cmin, skip: toe === 0 },
    { key: 'centre', label: 'Centre line', x: (edgeL + edgeR) / 2, req: sc + cmin },
    { key: 'toeR', label: 'Bank toe (exit side)', x: toeR, req: sc + cmin, skip: toe === 0 },
    { key: 'edgeR', label: p.type === 'road' || p.type === 'rail' ? 'Corridor edge (exit side)' : 'Bank edge (exit side)', x: edgeR, req: cb },
  ].filter((q) => !q.skip);
  if (toe === 0) { pts[0].req = Math.max(cb, sc + cmin); pts[pts.length - 1].req = Math.max(cb, sc + cmin); }

  const coverCheck = pts.map((q) => {
    const pipe = ge + pipeElevationAtX(core, q.x);
    const g = ground(q.x);
    const cover = g - pipe;
    return { ...q, ground: g, pipe, cover, ok: cover >= q.req - 1e-6 };
  });

  const issues = [...core.issues];
  if (p.fixEntry && setEntry < minSetEntry - 1e-6) issues.push({ key: 'entrySetback', msg: `Entry setback ${fmt(setEntry)} m is less than the minimum ${fmt(minSetEntry)} m for the cover requirement.` });
  if (p.fixExit && setExit < minSetExit - 1e-6) issues.push({ key: 'exitSetback', msg: `Exit setback ${fmt(setExit)} m is less than the minimum ${fmt(minSetExit)} m for the cover requirement.` });
  if (coverCheck.some((c) => !c.ok)) issues.push({ key: 'cover', msg: 'Cover requirement is not met at one or more check points.' });

  return {
    ...core,
    feasible: issues.length === 0,
    issues,
    obstacle: { type: p.type, W, b, s, sc, cmin, cb, ex, ge, gx, zBottom, hen, hex, toe, edgeL, edgeR, toeL, toeR, minSetEntry, minSetExit, setEntry, setExit, planDist },
    coverCheck,
    groundAt: ground,
    datum: ge,
  };
}

/* horizontal distance from A at which the pipe has dropped `drop` metres (entry side) */
function dropToX(drop, depth, angDeg, R) {
  if (drop <= 0) return 0;
  const core = profileCore({ entryAng: angDeg, exitAng: angDeg, entryDepth: depth, exitDepth: depth, Ren: R, Rex: R, planDist: 1e6 });
  if (drop >= depth) return core.nodes.C.x;
  // walk the entry side
  const { B, C } = core.nodes;
  if (drop <= -B.y) return drop / Math.tan(core.ten);
  // on the entry arc: y = C.y + R(1 − cos ψ), x = C.x + R sin ψ, ψ ∈ [−θ, 0]
  const cosPsi = 1 - (-drop - C.y) / R;
  const psi = -Math.acos(Math.min(1, Math.max(-1, cosPsi)));
  return C.x + R * Math.sin(psi);
}

function groundAt(x, g) {
  const { ge, gx, edgeL, edgeR, toeL, toeR, b, planDist } = g;
  if (x <= edgeL) return edgeL > 0 ? ge + (0 - ge) * (x / edgeL) : 0;
  if (x >= edgeR) { const span = planDist - edgeR; return span > 0 ? 0 + (gx - 0) * ((x - edgeR) / span) : 0; }
  if (x < toeL) return -b * ((x - edgeL) / Math.max(1e-9, toeL - edgeL));
  if (x > toeR) return -b * ((edgeR - x) / Math.max(1e-9, edgeR - toeR));
  return -b;
}

/* Pipe elevation (relative to A) at horizontal distance x from A. */
export function pipeElevationAtX(core, x) {
  const { A, B, C, D, E, F } = core.nodes;
  const Ren = core.inputs.Ren, Rex = core.inputs.Rex;
  if (x <= A.x) return A.y;
  if (x <= B.x) return A.y + (B.y - A.y) * ((x - A.x) / Math.max(1e-12, B.x - A.x));
  if (x <= C.x) { const psi = Math.asin(Math.max(-1, Math.min(1, (x - C.x) / Ren))); return C.y + Ren * (1 - Math.cos(psi)); }
  if (x <= D.x) return C.y;
  if (x <= E.x) { const psi = Math.asin(Math.max(-1, Math.min(1, (x - D.x) / Rex))); return D.y + Rex * (1 - Math.cos(psi)); }
  if (x <= F.x) return E.y + (F.y - E.y) * ((x - E.x) / Math.max(1e-12, F.x - E.x));
  return F.y;
}

/* Position and pitch at chainage s measured ALONG the bore from A. */
export function pointAtChainage(core, s) {
  const { A, B, C, D, E } = core.nodes;
  const [AB, BC, CD, DE, EF] = core.lengths.map((v) => Math.max(0, v));
  const Ren = core.inputs.Ren, Rex = core.inputs.Rex, ten = core.ten, tex = core.tex;
  let u = Math.max(0, Math.min(s, AB + BC + CD + DE + EF));
  if (u <= AB) return { x: A.x + u * Math.cos(ten), y: A.y - u * Math.sin(ten), pitch: -ten, seg: 0 };
  u -= AB;
  if (u <= BC) { const psi = -ten + u / Ren; return { x: C.x + Ren * Math.sin(psi), y: C.y + Ren * (1 - Math.cos(psi)), pitch: psi, seg: 1 }; }
  u -= BC;
  if (u <= CD) return { x: C.x + u, y: C.y, pitch: 0, seg: 2 };
  u -= CD;
  if (u <= DE) { const psi = u / Rex; return { x: D.x + Rex * Math.sin(psi), y: D.y + Rex * (1 - Math.cos(psi)), pitch: psi, seg: 3 }; }
  u -= DE;
  return { x: E.x + u * Math.cos(tex), y: E.y + u * Math.sin(tex), pitch: tex, seg: 4 };
}

/* Polyline of the bore for drawing: n points along the bore. */
export function samplePath(core, n = 240) {
  const L = core.lengths.reduce((a, v) => a + Math.max(0, v), 0);
  const out = [];
  for (let i = 0; i <= n; i++) out.push({ s: (L * i) / n, ...pointAtChainage(core, (L * i) / n) });
  return out;
}

/* Station–elevation table at a horizontal interval. */
export function stationTable(core, step = 10, datum = 0) {
  const rows = [];
  const Fx = core.nodes.F.x;
  const xs = [];
  for (let x = 0; x < Fx - 1e-9; x += step) xs.push(x);
  xs.push(Fx);
  let prev = null, s = 0;
  for (const x of xs) {
    const y = pipeElevationAtX(core, x);
    if (prev) s += Math.hypot(x - prev.x, y - prev.y);
    rows.push({ x, elev: datum + y, depth: -y, s });
    prev = { x, y };
  }
  return rows;
}

/* Section depths for the mud-pressure-head term when lengths come from the profile.
   basis 'deeper' = depth at the deeper end of each section (conservative), 'mean' = average of the two ends.
   Entry-side sections are measured below the entry point, exit-side sections below the exit point. */
export function sectionDepths(core, basis = 'deeper') {
  const { A, B, C, D, E, F } = core.nodes;
  const dA = 0, dB = A.y - B.y, dC = A.y - C.y;
  const dD = F.y - D.y, dE = F.y - E.y, dF = 0;
  const bottom = Math.max(dC, dD);
  if (basis === 'mean') return [(dA + dB) / 2, (dB + dC) / 2, bottom, (dD + dE) / 2, (dE + dF) / 2];
  return [Math.max(dA, dB), Math.max(dB, dC), bottom, Math.max(dD, dE), Math.max(dE, dF)];
}

/* Combined (plan + vertical) radius — profile workbook I28: sqrt(Rh²·Rv² / (Rh² + Rv²)) */
export function combinedRadius(Rh, Rv) {
  if (!(Rh > 0) || !(Rv > 0)) return null;
  return Math.sqrt((Rh * Rh * Rv * Rv) / (Rh * Rh + Rv * Rv));
}

function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }); }
