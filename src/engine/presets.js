/* Project schema, the default sample project, and verification presets that reproduce the source workbooks. */

export const SCHEMA_VERSION = 2;

const today = () => new Date().toISOString().slice(0, 10);
export const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'p' + Math.random().toString(36).slice(2) + Date.now().toString(36));

function base() {
  return {
    schema: SCHEMA_VERSION,
    id: uid(),
    template: 'sample-steel',
    meta: {
      name: 'Untitled project', docNo: 'HDD-PF-001', client: '', location: '', feature: '', contractor: '',
      preparedBy: '', checkedBy: '', approvedBy: '', date: today(), revision: '0', status: 'Draft', notes: '',
    },
    revisions: [{ rev: '0', date: today(), by: '', description: 'First issue' }],
    pipe: {
      material: 'steel', steelGrade: 'X70', nps: '18', odIn: 18, wtMm: 12.7,
      hdpeGrade: 'PE100', odMm: 630, sdr: 11, customOdMm: 457.2, customWtMm: 12.7,
      density: 7850, E: 2039432, strength: 70000, strengthUnit: 'psi', allowFactor: 0.9,
      contents: 'empty',
    },
    mud: { Fmud: 0.0035, mu: 0.3, rhoMud: 1172.7117, soilDensity: 2660, holeRule: '1.5D', holeCustomMm: 700 },
    profile: {
      type: 'river', entryAng: 12, exitAng: 10, Ren: 600, Rex: 600, sameRadius: true,
      entryDepth: 15, exitDepth: 15, planDist: 500,
      width: 250, bedDepth: 5, sideSlope: 2, scour: 2, coverBed: 8, coverBank: 5, extraDepth: 0,
      entryGround: 0, exitGround: 0, waterLevel: 1.5,
      fixEntry: false, entrySetback: 0, fixExit: false, exitSetback: 0,
      planRadius: 0, stationStep: 10,
    },
    sections: {
      source: 'profile', depthBasis: 'deeper',
      L: [53.48, 43.633, 54.694, 52.36, 36.72],
      d: [9.29, 13.086, 13.086, 13.086, 7.63],
    },
    method: { key: 'S', T1: 4.11, corrected: false },
    buckling: { muMode: 'soil', muB: 0.2, weight: 'auto', angleRef: 'auto', criterion: 'auto' },
    clamp: { enabled: true, sf: 1.5, muGrip: 0.4, pads: 4, padLength: 100, padWidth: 50, pMax: 1.2, bearingMode: 'auto', sigmaBearing: 9 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const deep = (o) => JSON.parse(JSON.stringify(o));
function merge(target, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && target[k] && typeof target[k] === 'object') merge(target[k], src[k]);
    else target[k] = src[k];
  }
  return target;
}

export const PRESETS = [
  {
    key: 'sample-steel', group: 'Sample projects', title: '18" X70 steel — river crossing',
    desc: 'Profile-driven sample: 250 m river, 12°/10° entry/exit, R 600 m, TESPL segmental method. Library steel properties.',
    image: 'images/hdd-rig-site-sm.webp',
    build: () => merge(base(), { template: 'sample-steel', meta: { name: 'Sample — 18" X70 river crossing', docNo: 'HDD-PF-001' } }),
  },
  {
    key: 'sample-hdpe', group: 'Sample projects', title: '630 mm PE100 SDR 11 — road crossing',
    desc: 'Profile-driven sample: 80 m right-of-way, 10°/8°, R 250 m, capstan carry-through method, thruster clamp check.',
    image: 'images/hdpe-pipe-sm.webp',
    build: () => merge(base(), {
      template: 'sample-hdpe',
      meta: { name: 'Sample — 630 mm PE100 road crossing', docNo: 'HDD-PF-002' },
      pipe: { material: 'hdpe', hdpeGrade: 'PE100', odMm: 630, sdr: 11, density: 960, E: 6118.43, strength: 10, strengthUnit: 'MPa', allowFactor: 0.9, contents: 'mud' },
      mud: { Fmud: 0.00172, mu: 0.3, rhoMud: 1200 },
      profile: { type: 'road', entryAng: 10, exitAng: 8, Ren: 250, Rex: 250, sameRadius: true, width: 80, coverBed: 4, coverBank: 3, bedDepth: 0, sideSlope: 0, scour: 0 },
      method: { key: 'C' },
      buckling: { muMode: 'custom', muB: 0.2 },
      clamp: { pads: 2, padLength: 60, padWidth: 40, pMax: 0.8, bearingMode: 'auto' },
    }),
  },
  {
    key: 'ref-steel-sheet', group: 'Verification — reproduce the TESPL workbooks', title: 'Push force Calculation.xlsx',
    desc: '18" × 12.7 mm X70, manual section lengths & depths exactly as the workbook. Expected total 43.440 t; buckling 74.58 / 124.28 / 153.80 t.',
    image: 'images/steel-pipe-sm.webp',
    expect: { total: 43.440221146902964 },
    build: () => merge(base(), {
      template: 'ref-steel-sheet',
      meta: { name: 'Verification — Push force Calculation.xlsx', docNo: 'VER-PF-STEEL', notes: 'Inputs exactly as the TESPL workbook (27 Jun 2026 revision). Pipe density 970 kg/m³ is the workbook value.' },
      pipe: { material: 'steel', steelGrade: 'X70', nps: '18', odIn: 18, wtMm: 12.7, density: 970, E: 2141412, strength: 70000, strengthUnit: 'psi', allowFactor: 0.9, contents: 'empty' },
      mud: { Fmud: 0.0035, mu: 0.3, rhoMud: 1172.7117, holeRule: '1.5D' },
      profile: { type: 'open', entryAng: 12, exitAng: 10, Ren: 750, Rex: 750, sameRadius: true, entryDepth: 14, exitDepth: 14, planDist: 240 },
      sections: { source: 'manual', L: [53.48, 43.633, 54.694, 52.36, 36.72], d: [9.29, 13.086, 13.086, 13.086, 7.63] },
      method: { key: 'S', T1: 4.11, corrected: false },
      buckling: { muMode: 'soil', weight: 'auto', angleRef: 'auto', criterion: 'auto' },
      clamp: { enabled: false },
    }),
  },
  {
    key: 'ref-hdpe-900', group: 'Verification — reproduce the TESPL workbooks', title: 'HDPE_Push_Clamp_Calc_V1 — Push_900',
    desc: '900 mm PE100 SDR 17, 8°/8°, R 900 m, 200 m straight. Expected peak 27.586 t (270.62 kN); Gao sinusoidal 31.84 t; clamp check fails as in the workbook.',
    image: 'images/hdpe-pipe-sm.webp',
    expect: { total: 27.586043872926965 },
    build: () => merge(base(), {
      template: 'ref-hdpe-900',
      meta: { name: 'Verification — HDPE Push_900', docNo: 'TESPL-HDD-CAL-PUSH-001', notes: 'Inputs exactly as HDPE_Push_Clamp_Calc_V1, sheets Push_900 and Clamp_Check (sample placeholders in the workbook).' },
      pipe: { material: 'hdpe', hdpeGrade: 'PE100', odMm: 900, sdr: 17, density: 960, E: 6118.43, strength: 10, strengthUnit: 'MPa', allowFactor: 0.9, contents: 'mud' },
      mud: { Fmud: 0.00172, mu: 0.3, rhoMud: 1200, holeRule: '1.5D' },
      profile: { type: 'open', entryAng: 8, exitAng: 8, Ren: 900, Rex: 900, sameRadius: true, entryDepth: 10, exitDepth: 10, planDist: 468.2 },
      sections: { source: 'manual', L: [0, 900 * 8 * Math.PI / 180, 200, 900 * 8 * Math.PI / 180, 0], d: [0, 0, 0, 0, 0] },
      method: { key: 'C' },
      buckling: { muMode: 'custom', muB: 0.2, weight: 'auto', angleRef: 'auto', criterion: 'auto' },
      clamp: { enabled: true, sf: 1.5, muGrip: 0.4, pads: 2, padLength: 60, padWidth: 40, pMax: 0.5, bearingMode: 'custom', sigmaBearing: 9 },
    }),
  },
  {
    key: 'ref-hdpe-630', group: 'Verification — reproduce the TESPL workbooks', title: 'HDPE_Push_Clamp_Calc_V1 — Push_630',
    desc: '630 mm PE100 SDR 17, 10°/10°, R 70 m, 140 m straight, μ 0.25. Expected peak 6.552 t (64.28 kN).',
    image: 'images/hdpe-pipe-sm.webp',
    expect: { total: 6.5519911770054611 },
    build: () => merge(base(), {
      template: 'ref-hdpe-630',
      meta: { name: 'Verification — HDPE Push_630', docNo: 'TESPL-HDD-CAL-PUSH-001', notes: 'Inputs exactly as HDPE_Push_Clamp_Calc_V1, sheet Push_630.' },
      pipe: { material: 'hdpe', hdpeGrade: 'PE100', odMm: 630, sdr: 17, density: 960, E: 6118.43, strength: 10, strengthUnit: 'MPa', allowFactor: 0.9, contents: 'mud' },
      mud: { Fmud: 0.00172, mu: 0.25, rhoMud: 1200, holeRule: '1.5D' },
      profile: { type: 'open', entryAng: 10, exitAng: 10, Ren: 70, Rex: 70, sameRadius: true, entryDepth: 10, exitDepth: 10, planDist: 250 },
      sections: { source: 'manual', L: [0, 70 * 10 * Math.PI / 180, 140, 70 * 10 * Math.PI / 180, 0], d: [0, 0, 0, 0, 0] },
      method: { key: 'C' },
      buckling: { muMode: 'custom', muB: 0.2, weight: 'auto', angleRef: 'auto', criterion: 'auto' },
      clamp: { enabled: true, sf: 1.5, muGrip: 0.4, pads: 2, padLength: 60, padWidth: 40, pMax: 0.5, bearingMode: 'custom', sigmaBearing: 9 },
    }),
  },
  {
    key: 'ref-legacy-36', group: 'Verification — reproduce the TESPL workbooks', title: 'Legacy calculator (36" X70, 2.57 km)',
    desc: 'Defaults of the previous single-file calculator (earlier workbook revision). Expected total 1,339.03 t, axial utilisation 84.1 %.',
    image: 'images/pipe-string-sm.webp',
    expect: { total: 1339.0281611223347 },
    build: () => merge(base(), {
      template: 'ref-legacy-36',
      meta: { name: 'Verification — legacy calculator (36")', docNo: 'VER-PF-LEGACY', notes: 'Defaults of legacy/index.html. E = 3,568.95 kg/cm² and density 970 kg/m³ are the source-sheet values (flagged by validation).' },
      pipe: { material: 'steel', steelGrade: 'X70', nps: '36', odIn: 36, wtMm: 12.7, density: 970, E: 3568.95, strength: 70000, strengthUnit: 'psi', allowFactor: 0.9, contents: 'empty' },
      mud: { Fmud: 0.0035, mu: 0.3, rhoMud: 1172.7117, holeRule: '1.5D' },
      profile: { type: 'open', entryAng: 12, exitAng: 10, Ren: 750, Rex: 750, sameRadius: true, entryDepth: 24, exitDepth: 24, planDist: 2560 },
      sections: { source: 'manual', L: [213.9, 103.7, 2007.2, 0.883, 239.5], d: [8.37, 9.87, 0, -51.67, -76.9] },
      method: { key: 'S', T1: 4.11, corrected: false },
      buckling: { muMode: 'soil', weight: 'auto', angleRef: 'auto', criterion: 'auto' },
      clamp: { enabled: false },
    }),
  },
];

export function newProject(key = 'sample-steel') {
  const p = PRESETS.find((x) => x.key === key) || PRESETS[0];
  const out = p.build();
  out.id = uid();
  out.createdAt = out.updatedAt = Date.now();
  return out;
}

/* Bring an older / partial saved project up to the current schema without losing values. */
export function migrate(obj) {
  const b = base();
  const out = merge(deep(b), deep(obj || {}));
  out.schema = SCHEMA_VERSION;
  if (!out.id) out.id = uid();
  if (!Array.isArray(out.sections.L) || out.sections.L.length !== 5) out.sections.L = b.sections.L;
  if (!Array.isArray(out.sections.d) || out.sections.d.length !== 5) out.sections.d = b.sections.d;
  if (!Array.isArray(out.revisions)) out.revisions = b.revisions;
  return out;
}
