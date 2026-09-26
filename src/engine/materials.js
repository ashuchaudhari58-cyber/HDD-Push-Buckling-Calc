/* Pipe material library.
   Values marked `source` come from the TESPL workbooks or from the cited standard; values marked
   "typical" are defaults the user must confirm against the pipe manufacturer's data sheet. */

export const MATERIALS = {
  steel: {
    key: 'steel',
    label: 'Carbon steel line pipe',
    short: 'Steel',
    spec: 'API 5L / ISO 3183',
    image: 'images/steel-pipe-sm.webp',
    blurb: 'Welded or seamless line pipe for oil, gas and water transmission. Strength basis: SMYS.',
    density: 7850,              // kg/m³  (carbon steel)
    E: 2039432,                 // kg/cm² (200 GPa)
    strengthLabel: 'SMYS',
    strengthUnit: 'psi',
    allowFactor: 0.9,           // x SMYS; 0.90 HDD installation practice (legacy calculator default)
    notes: [
      'Density 7,850 kg/m³ and E = 200 GPa (2.039 × 10⁶ kg/cm²) are standard values for carbon steel.',
      'SMYS follows the TESPL sheet convention: grade number × 1,000 psi (e.g. X70 → 70,000 psi).',
    ],
  },
  hdpe: {
    key: 'hdpe',
    label: 'Polyethylene (HDPE) pressure pipe',
    short: 'HDPE',
    spec: 'ISO 4427 / ASTM F714',
    image: 'images/hdpe-pipe-sm.webp',
    blurb: 'Fused PE80 / PE100 pipe. Dimensions by OD and SDR. Strength basis: MRS.',
    density: 960,               // kg/m³  (HDPE_Push_Clamp_Calc_V1: 9.6e-4 kg/cm³)
    E: 6118.43,                 // kg/cm² short-term flexural modulus (~600 MPa) — HDPE_Push_Clamp_Calc_V1
    strengthLabel: 'MRS',
    strengthUnit: 'MPa',
    allowFactor: 0.9,           // x MRS → 9 MPa for PE100, the allowable used in HDPE_Push_Clamp_Calc_V1
    notes: [
      'Density 960 kg/m³ and short-term E = 6,118.43 kg/cm² (≈600 MPa) are the values in HDPE_Push_Clamp_Calc_V1 — confirm with the resin supplier.',
      'Allowable axial stress = 0.9 × MRS reproduces the 9 MPa allowable used in HDPE_Push_Clamp_Calc_V1 for PE100. Confirm for grade, temperature and load duration.',
    ],
  },
  custom: {
    key: 'custom',
    label: 'Custom material',
    short: 'Custom',
    spec: 'User defined',
    image: 'images/pipe-yard-sm.webp',
    blurb: 'Enter density, modulus and strength from the manufacturer data sheet.',
    density: 7850,
    E: 2039432,
    strengthLabel: 'Reference strength',
    strengthUnit: 'MPa',
    allowFactor: 0.72,
    notes: ['All properties are user inputs.'],
  },
};

/* API 5L grades. SMYS per the TESPL sheet convention (grade × 1000 psi); Grade B = 35,000 psi.
   `mpa` shows the API 5L (PSL2) tabulated SMYS for reference only — it is not used in the calculation. */
export const STEEL_GRADES = [
  { key: 'B', label: 'Grade B', psi: 35000, mpa: 245 },
  { key: 'X42', label: 'X42', psi: 42000, mpa: 290 },
  { key: 'X46', label: 'X46', psi: 46000, mpa: 320 },
  { key: 'X52', label: 'X52', psi: 52000, mpa: 360 },
  { key: 'X56', label: 'X56', psi: 56000, mpa: 390 },
  { key: 'X60', label: 'X60', psi: 60000, mpa: 415 },
  { key: 'X65', label: 'X65', psi: 65000, mpa: 450 },
  { key: 'X70', label: 'X70', psi: 70000, mpa: 485 },
  { key: 'X80', label: 'X80', psi: 80000, mpa: 555 },
];

/* ASME B36.10M nominal pipe sizes → outside diameter (inches). */
export const STEEL_NPS = [
  { nps: '4', od: 4.5 }, { nps: '6', od: 6.625 }, { nps: '8', od: 8.625 }, { nps: '10', od: 10.75 },
  { nps: '12', od: 12.75 }, { nps: '14', od: 14 }, { nps: '16', od: 16 }, { nps: '18', od: 18 },
  { nps: '20', od: 20 }, { nps: '22', od: 22 }, { nps: '24', od: 24 }, { nps: '26', od: 26 },
  { nps: '28', od: 28 }, { nps: '30', od: 30 }, { nps: '32', od: 32 }, { nps: '34', od: 34 },
  { nps: '36', od: 36 }, { nps: '40', od: 40 }, { nps: '42', od: 42 }, { nps: '48', od: 48 },
];

/* Common line-pipe wall thicknesses (fractional inch → mm). Suggestions only; any value is allowed. */
export const STEEL_WT_MM = [6.35, 7.14, 7.92, 8.74, 9.53, 10.31, 11.13, 11.91, 12.7, 14.27, 15.88, 17.48, 19.05, 20.62, 22.23, 23.83, 25.4];

export const HDPE_GRADES = [
  { key: 'PE80', label: 'PE80', mrs: 8 },
  { key: 'PE100', label: 'PE100', mrs: 10 },
  { key: 'PE100RC', label: 'PE100-RC', mrs: 10 },
];

/* ISO 4427 nominal outside diameters (mm). */
export const HDPE_OD_MM = [63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1200, 1400, 1600];
export const HDPE_SDR = [7.4, 9, 11, 13.6, 17, 21, 26, 33];

/* PPI Handbook of PE Pipe — minimum field-bending radius as a multiple of OD, by SDR.
   Used only as ENGINEERING GUIDANCE (advisory), never as a pass/fail criterion. */
export function hdpeMinBendRatio(sdr) {
  if (sdr <= 9) return 20;
  if (sdr <= 13.6) return 25;
  if (sdr <= 21) return 27;
  if (sdr <= 26) return 34;
  if (sdr <= 32.5) return 42;
  return 50;
}

export function steelGrade(key) {
  return STEEL_GRADES.find((g) => g.key === key) || STEEL_GRADES[7];
}
export function hdpeGrade(key) {
  return HDPE_GRADES.find((g) => g.key === key) || HDPE_GRADES[1];
}

/* Library property set for a material + grade (used by "apply library values"). */
export function libraryProps(material, grade) {
  const m = MATERIALS[material] || MATERIALS.steel;
  if (material === 'steel') {
    return { density: m.density, E: m.E, strength: steelGrade(grade).psi, strengthUnit: 'psi', allowFactor: m.allowFactor };
  }
  if (material === 'hdpe') {
    return { density: m.density, E: m.E, strength: hdpeGrade(grade).mrs, strengthUnit: 'MPa', allowFactor: m.allowFactor };
  }
  return { density: m.density, E: m.E, strength: 485, strengthUnit: 'MPa', allowFactor: m.allowFactor };
}
