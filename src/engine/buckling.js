/* Constrained buckling of a pipe pushed inside a borehole.
   Dawson & Paslay (1984) sinusoidal load, Gao & Miska (2010) friction-corrected sinusoidal and helical loads.
   The two TESPL workbooks differ in one constant: Push force Calculation.xlsx writes 3.14 in the helical
   coefficient (U84) while HDPE_Push_Clamp_Calc_V1 writes PI() (B70). `piHelical` reproduces either. */

export function buckling({ E, D, d, w, inclinationDeg, clearance, muB, piHelical = Math.PI }) {
  const I = Math.PI * (Math.pow(D, 4) - Math.pow(d, 4)) / 64;                 // cm⁴
  const alpha = inclinationDeg * Math.PI / 180;                               // pipe axis to gravity
  const Fdp = (2 * Math.sqrt((E * I * w * Math.sin(alpha)) / Math.abs(clearance))) / 1000; // ton
  const Pcrs = 1 + 0.193 * Math.pow(muB, 0.67);
  const Acrs = 0.774 * Math.pow(muB, 0.33) - 0.371 * muB;
  const Bcrs = (0.5 * Pcrs * Pcrs * (1 - 1.5 * Acrs * Acrs)) + ((1 / (2 * Pcrs * Pcrs)) * (1 + 0.125 * Acrs * Acrs + (8 * muB) / (Math.PI * Acrs)));
  const Bcrh = Math.sqrt((30 * (piHelical + 2 * muB)) / (piHelical * (15 - 7 * muB * Math.PI)));
  return {
    I, alpha, w, clearance, muB,
    Pcrs, Acrs, Bcrs, Bcrh,
    Fdp,                 // sinusoidal initiation (Dawson–Paslay)
    Fgao: Fdp * Bcrs,    // sinusoidal with friction (Gao et al. 2010)
    Fhel: Fdp * Bcrh,    // helical lock-up (Gao et al. 2010)
  };
}

/* Classify a compressive installation force against the buckling loads.
   criterion 'dp' (Push force Calculation.xlsx / legacy app) or 'gao' (HDPE_Push_Clamp_Calc_V1). */
export function classifyBuckling(F, b, criterion) {
  const Fsin = criterion === 'gao' ? b.Fgao : b.Fdp;
  if (F < Fsin) return { state: 'pass', label: 'No buckling', Fsin, sf: Fsin / F };
  if (F < b.Fhel) return { state: 'warn', label: 'Sinusoidal buckling onset', Fsin, sf: Fsin / F };
  return { state: 'fail', label: 'Helical buckling / lock-up', Fsin, sf: Fsin / F };
}
