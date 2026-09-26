/* Engineering input validation.
   error  → the calculation cannot be trusted (physically impossible input)
   warn   → legitimate but unusual; flagged for engineering review, never blocked */

const num = (v) => (v === '' || v == null ? NaN : Number(v));

export function validateProject(p) {
  const out = [];
  const E = (field, msg) => out.push({ field, level: 'error', msg });
  const W = (field, msg) => out.push({ field, level: 'warn', msg });
  const pipe = p.pipe;

  // Pipe dimensions
  if (pipe.material === 'steel') {
    const od = num(pipe.odIn), wt = num(pipe.wtMm);
    if (!(od > 0)) E('pipe.odIn', 'Pipe outside diameter must be greater than zero.');
    if (!(wt > 0)) E('pipe.wtMm', 'Wall thickness must be greater than zero.');
    if (od > 0 && wt > 0 && 2 * wt >= od * 25.4) E('pipe.wtMm', `Wall thickness × 2 (${(2 * wt).toFixed(2)} mm) must be less than the OD (${(od * 25.4).toFixed(1)} mm).`);
    if (od > 0 && wt > 0 && od * 25.4 / wt > 120) W('pipe.wtMm', `D/t = ${(od * 25.4 / wt).toFixed(0)} is very high — check ovality and handling limits.`);
  } else if (pipe.material === 'hdpe') {
    if (!(num(pipe.odMm) > 0)) E('pipe.odMm', 'Pipe outside diameter must be greater than zero.');
    if (!(num(pipe.sdr) > 2)) E('pipe.sdr', 'SDR must be greater than 2 (OD = SDR × wall thickness).');
  } else {
    const od = num(pipe.customOdMm), wt = num(pipe.customWtMm);
    if (!(od > 0)) E('pipe.customOdMm', 'Pipe outside diameter must be greater than zero.');
    if (!(wt > 0)) E('pipe.customWtMm', 'Wall thickness must be greater than zero.');
    if (od > 0 && wt > 0 && 2 * wt >= od) E('pipe.customWtMm', 'Wall thickness × 2 must be less than the outside diameter.');
  }

  // Material
  const rho = num(pipe.density), Em = num(pipe.E);
  if (!(rho > 0)) E('pipe.density', 'Pipe density must be positive.');
  else if (pipe.material === 'steel' && (rho < 7000 || rho > 8100)) W('pipe.density', `Density ${rho} kg/m³ is not typical of carbon steel (≈ 7,850 kg/m³). The TESPL push-force workbook uses 970 kg/m³ — confirm which value is intended.`);
  else if (pipe.material === 'hdpe' && (rho < 930 || rho > 970)) W('pipe.density', `Density ${rho} kg/m³ is outside the usual PE range (≈ 940–960 kg/m³).`);
  if (!(Em > 0)) E('pipe.E', "Young's modulus must be positive.");
  else if (pipe.material === 'steel' && (Em < 1.9e6 || Em > 2.2e6)) W('pipe.E', `E = ${Em.toLocaleString()} kg/cm² is far from steel (≈ 2.04 × 10⁶ kg/cm²). Buckling capacity scales with √E — it changes by a factor of ${Math.sqrt(2039432 / Em).toFixed(1)} relative to standard steel.`);
  else if (pipe.material === 'hdpe' && (Em < 4000 || Em > 14500)) W('pipe.E', `E = ${Em.toLocaleString()} kg/cm² is outside the usual short-term PE range (≈ 400–1,400 MPa).`);
  if (!(num(pipe.strength) > 0)) E('pipe.strength', 'Reference strength must be positive.');
  const af = num(pipe.allowFactor);
  if (!(af > 0)) E('pipe.allowFactor', 'Allowable stress factor must be positive.');
  else if (af > 1) W('pipe.allowFactor', 'Allowable stress factor above 1.0 permits stress beyond the reference strength.');

  // Mud & soil
  const mu = num(p.mud.mu), fm = num(p.mud.Fmud), rm = num(p.mud.rhoMud);
  if (!(mu >= 0)) E('mud.mu', 'Friction coefficient cannot be negative.');
  else if (mu > 0.7) W('mud.mu', `μ = ${mu} is high for a lubricated bore (typical 0.2–0.5).`);
  else if (mu < 0.1) W('mud.mu', `μ = ${mu} is low for pipe on the bore wall (typical 0.2–0.5).`);
  if (!(fm >= 0)) E('mud.Fmud', 'Fluid drag coefficient cannot be negative.');
  else if (fm > 0.01) W('mud.Fmud', `F_mud = ${fm} kg/cm² is high (PRCI 0.05 psi ≈ 0.0035 kg/cm²; ASTM F1962 ≈ 0.0017 kg/cm²).`);
  if (!(rm > 0)) E('mud.rhoMud', 'Mud density must be positive.');
  else if (rm < 1000 || rm > 1700) W('mud.rhoMud', `Mud density ${rm} kg/m³ is outside the usual drilling-fluid range (1,000–1,700 kg/m³).`);
  if (p.mud.holeRule === 'custom') {
    const dh = num(p.mud.holeCustomMm);
    if (!(dh > 0)) E('mud.holeCustomMm', 'Reamed hole diameter must be positive.');
  }

  // Profile
  const g = p.profile;
  const ea = num(g.entryAng), xa = num(g.exitAng), R1 = num(g.Ren), R2 = g.sameRadius ? R1 : num(g.Rex);
  if (!(ea >= 0) || ea >= 90) E('profile.entryAng', 'Entry angle must be between 0° and 90°.');
  else if (ea > 25) W('profile.entryAng', `Entry angle ${ea}° is steep for an HDD rig (typical 8–20°).`);
  if (!(xa >= 0) || xa >= 90) E('profile.exitAng', 'Exit angle must be between 0° and 90°.');
  else if (xa > 25) W('profile.exitAng', `Exit angle ${xa}° is steep (typical 5–20°).`);
  if (!(R1 > 0)) E('profile.Ren', 'Entry radius of curvature must be positive.');
  if (!(R2 > 0)) E('profile.Rex', 'Exit radius of curvature must be positive.');
  if (g.type === 'open') {
    if (!(num(g.entryDepth) >= 0)) E('profile.entryDepth', 'Bottom depth below entry must be zero or positive.');
    if (!(num(g.exitDepth) >= 0)) E('profile.exitDepth', 'Bottom depth below exit must be zero or positive.');
    if (!(num(g.planDist) > 0)) E('profile.planDist', 'Plan distance must be positive.');
  } else {
    if (!(num(g.width) > 0)) E('profile.width', 'Crossing width must be positive.');
    if (!(num(g.coverBed) >= 0)) E('profile.coverBed', 'Minimum cover cannot be negative.');
  }

  // Manual sections
  if (p.sections.source === 'manual') {
    p.sections.L.forEach((v, i) => { if (!(num(v) >= 0)) E(`sections.L${i}`, `L${i + 1} length must be zero or positive.`); });
    p.sections.d.forEach((v, i) => { if (!isFinite(num(v))) E(`sections.d${i}`, `L${i + 1} depth must be a number.`); else if (num(v) < 0) W(`sections.d${i}`, `L${i + 1} depth is negative — the mud pressure term reduces the push force.`); });
  }

  // Method
  if (p.method.key === 'S' && !p.method.corrected && !(num(p.method.T1) >= 0)) E('method.T1', 'Entry-curve initial tension T1 must be zero or positive.');

  // Buckling
  if (p.buckling.muMode === 'custom' && !(num(p.buckling.muB) > 0)) E('buckling.muB', 'Buckling friction coefficient must be positive.');

  // Clamp
  if (p.clamp.enabled) {
    const c = p.clamp;
    ['sf', 'muGrip', 'pads', 'padLength', 'padWidth', 'pMax'].forEach((k) => { if (!(num(c[k]) > 0)) E(`clamp.${k}`, 'Must be greater than zero.'); });
    if (c.bearingMode === 'custom' && !(num(c.sigmaBearing) > 0)) E('clamp.sigmaBearing', 'Allowable bearing stress must be positive.');
    if (num(c.muGrip) > 0.8) W('clamp.muGrip', `Grip friction ${c.muGrip} is high (typical 0.3–0.5 for elastomer pads).`);
  }
  return out;
}

export function fieldIssues(validation, field) {
  return validation.filter((v) => v.field === field);
}
