import { useStore } from '../state/store.jsx';
import { PageHead, Card, Tex, Tag, Callout } from '../components/ui.jsx';

const EQ = [
  { g: 'Profile geometry — crossing_profile_geometry_calculator.xlsx', items: [
    ['Entry tangent to vertex', 'AO = h_{en} / sin θ_{en}'], ['Curve set-back', 'OB = R tan(θ/2)'], ['Entry tangent', 'AB = AO − OB'], ['Entry curve (arc)', 'BC = R_{en} θ_{en}'],
    ['Exit tangent', 'EF = h_{ex}/sin θ_{ex} − R_{ex} tan(θ_{ex}/2)'], ['Exit curve (arc)', 'DE = R_{ex} θ_{ex}'], ['Bottom run', 'CD = L_{plan} − C_{x} − DF″cos(θ_{ex}/2) − EF cos θ_{ex}'],
    ['Combined radius', 'R_{c} = √(R_{h}² R_{v}² / (R_{h}² + R_{v}²))'],
  ] },
  { g: 'Pipe section & weights', items: [
    ['Areas (Method S uses 3.14, Method C uses π)', 'A_{o} = πD²/4 ;  A_{i} = πd²/4 ;  A_{s} = A_{o} − A_{i}'], ['Buoyancy', 'B = A_{o} ρ_{mud}'], ['Weight in air', 'W_{a} = A_{s} ρ_{pipe}'],
    ['Contents', 'W_{c} = A_{i} ρ_{fill}  (empty ⇒ 0)'], ['Net submerged weight', 'W_{net} = W_{a} + W_{c} − B'],
  ] },
  { g: 'Method S — segmental (Push force Calculation.xlsx)', items: [
    ['Axial weight component', 'F_{a} = |W_{net} sin θ L| / 1000'], ['Soil friction', 'F_{f} = μ |W_{net} cos θ| L / 1000'], ['Mud drag', 'F_{d} = F_{mud} π D L / 1000'], ['Mud pressure head', 'F_{p} = ρ_{mud} h A_{s} / 1000'],
    ['Capstan terms', 't_{1} = μ²RW sinθ/(μ²+1),  t_{2} = RW sinθ/(μ²+1),  t_{3} = 2μRW cosθ/(μ²+1),  W = 0.0981|W_{net}|'],
    ['Parametric coefficient', 'A = (T_{1}·9806.65 + t_{1} − t_{2} + t_{3}) / e^{μθ₁}'], ['Curve tension', 'T_{2} = A e^{γθ₂} − t_{1} + t_{2} − t_{3} ;  F_{c} = 0.0001019716 T_{2}'],
    ['Section build-up', 'ΣF_{n} = ΣF_{n−1} + ΔF_{n}'],
  ] },
  { g: 'Method C — capstan carry-through (HDPE_Push_Clamp_Calc_V1.xlsx)', items: [
    ['Fluid drag', 'F_{d} = 3.14 D f_{d} L / 1000'], ['Bore friction', 'F_{f} = |W| cos θ L μ / 1000'], ['Axial weight', 'F_{a} = ±W sin θ L / 1000'],
    ['Entry curve', 'T_{C} = (T_{B} + F_{d} + F_{f} + F_{a}) e^{μθ_{en}}'], ['Straight', 'T_{D} = T_{C} + F_{d} + |W| L μ'], ['Exit curve', 'T_{E} = T_{D} e^{μθ_{ex}} + F_{d} + F_{f} − W sinθ L'], ['Peak', 'F_{max} = max(T)'],
  ] },
  { g: 'Stress & buckling', items: [
    ['Axial stress', 'σ = 1000 F_{max} / A_{s} ≤ f × S'], ['Second moment of area', 'I = π(D⁴ − d⁴)/64'], ['Dawson–Paslay (1984)', 'F_{DP} = 2√(E I w sin α / r_{c})'],
    ['Gao coefficients', 'P_{crs} = 1 + 0.193μ^{0.67} ;  A_{crs} = 0.774μ^{0.33} − 0.371μ'], ['Gao sinusoidal', 'F_{sin} = β_{crs} F_{DP}'], ['Gao helical', 'F_{hel} = √(30(π + 2μ)/(π(15 − 7μπ))) F_{DP}'],
    ['Bending (advisory)', 'σ_{b} = E D / 2R'],
  ] },
  { g: 'Thruster clamp (Clamp_Check)', items: [
    ['Required clamp force', 'F_{clamp} = 9.81 F_{max} SF / μ_{grip}'], ['Capacity', 'F_{cap} = 0.1 p_{max} n L_{pad} W_{pad}'], ['Wall limit', 'p_{allow} = 2σ_{bear}/(SDR − 1)'],
  ] },
];

const CONVENTIONS = [
  ['sheet', 'Method S areas use 3.14; mud drag uses π (cells H25, G56).'],
  ['sheet', 'Method S entry-curve initial tension T1 = 4.11 t is a fixed input (O31). The "corrected" option links it to the force entering the bend.'],
  ['sheet', 'Method S exit-curve growth exponent references an empty cell (H38 → 0). The "corrected" option uses μ.'],
  ['sheet', 'Method S computes the L3 mud-pressure term (F99) but does not add it to the L3 net force (F100 = F96 + F97).'],
  ['sheet', 'Method S buckling uses the pipe weight in air and α = 90° − exit angle; Method C uses |W_eff| and α = 90° − entry angle.'],
  ['sheet', 'Method S helical coefficient writes 3.14 (U84); Method C writes π (B70).'],
  ['sheet', 'Method C excludes the slurry hydrostatic head from the axial sum and assumes the pipe is flooded (V1 README).'],
  ['sheet', 'Clamp check converts tonne-force to kN with × 9.81 (Clamp_Check B5).'],
];
const ASSUMPTIONS = [
  ['assumed', 'Force between section boundaries is interpolated linearly for the chart, simulation and buckling-onset chainage.'],
  ['assumed', 'When lengths come from the profile, the mud-pressure depth of each section is the depth at its deeper end (or the mean, if selected), measured below the entry point on the entry side and below the exit point on the exit side.'],
  ['assumed', 'Reamed hole diameter = 1.5 × OD unless another rule is selected; the radial clearance for buckling is (D_hole − D)/2.'],
  ['assumed', 'Steel SMYS follows the sheet convention grade × 1000 psi; HDPE allowable = 0.9 × MRS reproduces the 9 MPa used in V1 for PE100.'],
  ['assumed', 'The pipe is laterally supported by the bore wall (constrained buckling); soil and fluid are homogeneous along each section.'],
];
const GUIDANCE = [
  ['guidance', 'Radius of curvature: steel ≥ 1,200 × OD (100 ft per inch of diameter); HDPE per PPI field-bending ratios by SDR.'],
  ['guidance', 'Typical pipe–bore friction 0.2–0.5; drilling-fluid density 1,000–1,700 kg/m³; HDD entry angles 8–20°.'],
  ['guidance', 'Long crossings with high compressive push force are normally installed by pull-back or with pull-back assistance.'],
];
const REFS = [
  ['PRCI / ASCE', 'Installation of Pipelines by Horizontal Directional Drilling — An Engineering Design Guide (PR-227-9424). Segmental friction, fluid drag and pressure model.'],
  ['ASTM F1962', 'Standard Guide for Use of Maxi-HDD for Placement of Polyethylene Pipe or Conduit Under Obstacles, Including River Crossings. Capstan treatment of curves, fluid drag.'],
  ['PPI', 'Handbook of Polyethylene Pipe, Chapter 12 (Horizontal Directional Drilling) and field-bending guidance.'],
  ['Dawson & Paslay (1984)', 'Drillpipe Buckling in Inclined Holes. Journal of Petroleum Technology 36(10), 1734–1738.'],
  ['Gao & Miska (2010)', 'Effects of Friction on Post-Buckling Behavior and Axial Load Transfer in a Horizontal Well. SPE Journal. Friction-corrected sinusoidal (β_crs) and helical (β_crh) loads.'],
  ['Euler–Eytelwein', 'Capstan (belt-friction) equation for tension build-up around a curved surface.'],
  ['API 5L / ISO 3183', 'Line pipe specification — SMYS by grade.'],
  ['ISO 4427 / ISO 12162', 'Polyethylene pipe dimensions (OD, SDR) and MRS classification (PE80, PE100).'],
  ['ASME B31.4 / B31.8', 'Liquid and gas transmission piping — design-factor basis for allowable stress.'],
  ['TESPL workbooks', 'Push force Calculation.xlsx · HDPE_Push_Clamp_Calc_V1.xlsx · crossing_profile_geometry_calculator.xlsx — reproduced exactly (see Overview → Engine verification).'],
];

export default function Basis() {
  const { results: r } = useStore();
  return (
    <div className="page wide">
      <PageHead no="09" eyebrow="Reference & output" title="Calculation basis" lede="Equations, workbook conventions, assumptions, engineering guidance and references. The app distinguishes CALCULATED results from ASSUMPTIONS and ENGINEERING GUIDANCE — guidance is never presented as a calculated result." />
      <div className="grid g2">
        {EQ.map((grp) => (
          <Card key={grp.g} title={grp.g} pad={false}>
            <table className="t">
              <tbody>{grp.items.map(([k, f]) => <tr key={k}><td className="l" style={{ width: '38%' }}>{k}</td><td className="l wrap mono" style={{ fontFamily: 'var(--mono)' }}><Tex>{f}</Tex></td></tr>)}</tbody>
            </table>
          </Card>
        ))}
      </div>

      <div className="grid g3" style={{ marginTop: 18 }}>
        <Card title="Workbook conventions reproduced">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{CONVENTIONS.map(([k, t], i) => <li key={i} style={{ fontSize: 12.5 }}><Tag kind={k} /> <span className="dim2">{t}</span></li>)}</ul>
        </Card>
        <Card title="Assumptions">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{ASSUMPTIONS.map(([k, t], i) => <li key={i} style={{ fontSize: 12.5 }}><Tag kind={k} /> <span className="dim2">{t}</span></li>)}</ul>
        </Card>
        <Card title="Engineering guidance (advisory)">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{GUIDANCE.map(([k, t], i) => <li key={i} style={{ fontSize: 12.5 }}><Tag kind={k} /> <span className="dim2">{t}</span></li>)}</ul>
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Units">
          <table className="t"><tbody>
            {[['Length (calculation)', 'cm — inputs in m / mm / in are converted'], ['Force', 'tonne-force (t); kN shown = t × 9.80665 (clamp: × 9.81 per workbook)'], ['Stress', 'kg/cm² (1 kg/cm² = 0.0980665 MPa)'], ['Density', 'kg/cm³ in the calculation (kg/m³ ÷ 10⁶)'], ['Weight per length', 'kg/cm'], ['Angles', 'degrees in, radians in the equations']].map(([a, b]) => <tr key={a}><td className="l">{a}</td><td className="l wrap">{b}</td></tr>)}
          </tbody></table>
        </Card>
        <Card title="Current material & criteria basis">
          <table className="t"><tbody>
            <tr><td className="l">Material</td><td className="l wrap">{r.pipe.mat.label} — {r.pipe.gradeLabel}</td></tr>
            <tr><td className="l">Strength basis</td><td className="l wrap">{r.pipe.mat.strengthLabel} = {r.pipe.strengthKg.toFixed(1)} kg/cm²; allowable = {r.pipe.allowFactor} × {r.pipe.mat.strengthLabel}</td></tr>
            <tr><td className="l">Push-force method</td><td className="l wrap">{r.method.label} ({r.method.source})</td></tr>
            <tr><td className="l">Buckling criterion</td><td className="l wrap">{r.buck.criterion === 'gao' ? 'F < Gao sinusoidal' : 'F < Dawson–Paslay sinusoidal'}; weight {r.buck.weight}; α = 90° − {r.buck.angleRef} angle</td></tr>
            <tr><td className="l">Soil basis</td><td className="l wrap">Generalised soil: one friction coefficient and fluid drag for all sections (no geological layering is modelled).</td></tr>
          </tbody></table>
        </Card>
      </div>

      <h2 className="sh">References</h2>
      <div className="card" style={{ padding: '6px 0' }}>
        <ol style={{ margin: 0, padding: '6px 18px 6px 38px', display: 'grid', gap: 8, fontSize: 12.8 }}>{REFS.map(([a, b]) => <li key={a}><b>{a}</b> — <span className="dim2">{b}</span></li>)}</ol>
      </div>
      <div style={{ marginTop: 16 }}><Callout kind="brand">Engineering results depend on the input data, assumptions, calculation methodology and applicable project criteria. The software does not replace project-specific engineering review.</Callout></div>
    </div>
  );
}

export { EQ, CONVENTIONS, ASSUMPTIONS, GUIDANCE, REFS };
