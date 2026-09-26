import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check, AlertTriangle, X, ArrowRight, Waves, Route as RouteIcon, TrainFront, Droplets, Mountain } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, NumField, SelectField, Toggle, Seg, Callout, fmt, Tag, Status } from '../components/ui.jsx';
import { CrossSection, ProfileSVG } from '../components/drawings.jsx';
import { MATERIALS, STEEL_GRADES, STEEL_NPS, STEEL_WT_MM, HDPE_GRADES, HDPE_OD_MM, HDPE_SDR, libraryProps } from '../engine/materials.js';
import { CROSSING_TYPES } from '../engine/profile.js';
import { METHODS } from '../engine/index.js';
import { asset } from '../lib/asset.js';

const SECTIONS = [
  { id: 'pipe', no: 1, title: 'Pipe & material', prefix: 'pipe.' },
  { id: 'mud', no: 2, title: 'Drilling fluid & soil', prefix: 'mud.' },
  { id: 'profile', no: 3, title: 'Crossing profile', prefix: 'profile.' },
  { id: 'sections', no: 4, title: 'Section lengths', prefix: 'sections.' },
  { id: 'method', no: 5, title: 'Calculation method', prefix: 'method.' },
  { id: 'buckling', no: 6, title: 'Buckling model', prefix: 'buckling.' },
  { id: 'clamp', no: 7, title: 'Thruster & clamp', prefix: 'clamp.' },
];
const CROSS_ICON = { open: Mountain, river: Waves, canal: Droplets, road: RouteIcon, rail: TrainFront };

export default function Inputs() {
  const st = useStore();
  const { project: p, results: r } = st;
  const [closed, setClosed] = useState({});
  const loc = useLocation();
  // deep links such as #/inputs#sec-profile scroll to the section (after the layout resets scroll)
  useEffect(() => { if (!loc.hash) return undefined; const t = setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 120); return () => clearTimeout(t); }, [loc.hash]);
  const toggle = (id) => setClosed((c) => ({ ...c, [id]: !c[id] }));
  const secIssues = (prefix) => r.validation.filter((v) => v.field.startsWith(prefix));

  const grade = p.pipe.material === 'steel' ? p.pipe.steelGrade : p.pipe.hdpeGrade;
  const lib = libraryProps(p.pipe.material, grade);
  const mat = MATERIALS[p.pipe.material];
  const isObs = p.profile.type !== 'open';

  return (
    <div className="page wide">
      <PageHead no="02" title="Design inputs" lede={`Design parameters for ${p.meta.docNo} Rev ${p.meta.revision}. Values recalculate as you type. Hard physical limits block the calculation; unusual values raise engineering warnings but are never blocked. ↑/↓ steps a value (Shift ×10, Alt ×0.1) · Esc reverts.`}>
        <button className="btn sm" onClick={() => setClosed({})}>Expand all</button>
        <button className="btn sm" onClick={() => setClosed(Object.fromEntries(SECTIONS.map((s) => [s.id, true])))}>Collapse all</button>
      </PageHead>

      <nav className="sec-chips" aria-label="Input sections">
        {SECTIONS.map((s) => {
          const iss = secIssues(s.prefix); const err = iss.some((i) => i.level === 'error');
          return (
            <a key={s.id} href={`#sec-${s.id}`} onClick={(e) => { e.preventDefault(); setClosed((c) => ({ ...c, [s.id]: false })); document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
              <span className="n">{s.no}</span>{s.title}
              {err ? <X size={12} className="fail-t" /> : iss.length ? <AlertTriangle size={12} className="warn-t" /> : <Check size={12} className="ok-t" />}
            </a>
          );
        })}
      </nav>

      <SecCtx.Provider value={{ closed, toggle, secIssues }}>
      <div className="split">
        <div>
          {/* 1 PIPE & MATERIAL */}
          <Sec s={SECTIONS[0]} desc="Select the pipe material and size. Material properties are filled from the library and can be overridden with manufacturer data (overrides are marked “modified”).">
            <div className="choices" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 18 }}>
              {Object.values(MATERIALS).map((m) => (
                <button key={m.key} type="button" className={`choice ${p.pipe.material === m.key ? 'on' : ''}`} onClick={() => st.set('pipe.material', m.key)} aria-pressed={p.pipe.material === m.key}>
                  <div className="ph" style={{ backgroundImage: `url(${asset(m.image)})` }} />
                  <div className="bd"><b>{m.short}<span className="rad" /></b><small>{m.spec} · {m.blurb}</small></div>
                </button>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: 20 }}>
              <div>
                <div className="fsub">Size & grade</div>
                {p.pipe.material === 'steel' && (
                  <div className="fgrid c3">
                    <SelectField path="pipe.steelGrade" label="API 5L grade" options={STEEL_GRADES.map((g) => ({ value: g.key, label: `${g.label} — SMYS ${g.psi.toLocaleString()} psi` }))} help="Selecting a grade applies its SMYS (sheet convention: grade × 1000 psi)." />
                    <SelectField path="pipe.nps" label="Nominal pipe size" options={[...STEEL_NPS.map((n) => ({ value: n.nps, label: `NPS ${n.nps} — OD ${n.od} in` })), { value: 'custom', label: 'Custom OD' }]} onChange={(v) => { const n = STEEL_NPS.find((x) => x.nps === v); st.set('pipe.nps', v, n ? { odIn: n.od } : {}); }} />
                    <NumField path="pipe.odIn" label="Outside diameter" sym="D" unit="in" hint={`= ${fmt(p.pipe.odIn * 25.4, 1)} mm`} onChange={(v) => { st.set('pipe.odIn', v); }} />
                    <NumField path="pipe.wtMm" label="Wall thickness" sym="t" unit="mm" hint={`D/t = ${fmt((p.pipe.odIn * 25.4) / p.pipe.wtMm, 1)}`} />
                    <SelectField label="Standard wall thickness" value={STEEL_WT_MM.includes(+p.pipe.wtMm) ? String(p.pipe.wtMm) : ''} onChange={(v) => v && st.set('pipe.wtMm', +v)} options={[{ value: '', label: '— pick a standard WT —' }, ...STEEL_WT_MM.map((w) => ({ value: String(w), label: `${w} mm (${(w / 25.4).toFixed(3)} in)` }))]} />
                  </div>
                )}
                {p.pipe.material === 'hdpe' && (
                  <div className="fgrid c3">
                    <SelectField path="pipe.hdpeGrade" label="PE material class" options={HDPE_GRADES.map((g) => ({ value: g.key, label: `${g.label} — MRS ${g.mrs} MPa` }))} />
                    <SelectField label="Standard OD (ISO 4427)" value={HDPE_OD_MM.includes(+p.pipe.odMm) ? String(p.pipe.odMm) : ''} onChange={(v) => v && st.set('pipe.odMm', +v)} options={[{ value: '', label: '— custom —' }, ...HDPE_OD_MM.map((d) => ({ value: String(d), label: `${d} mm` }))]} />
                    <NumField path="pipe.odMm" label="Outside diameter" sym="D" unit="mm" />
                    <SelectField label="Standard SDR" value={HDPE_SDR.includes(+p.pipe.sdr) ? String(p.pipe.sdr) : ''} onChange={(v) => v && st.set('pipe.sdr', +v)} options={[{ value: '', label: '— custom —' }, ...HDPE_SDR.map((s) => ({ value: String(s), label: `SDR ${s}` }))]} />
                    <NumField path="pipe.sdr" label="Standard dimension ratio" sym="SDR" unit="—" hint={`t = ${fmt(p.pipe.odMm / p.pipe.sdr, 2)} mm · ID = ${fmt(p.pipe.odMm * (1 - 2 / p.pipe.sdr), 1)} mm`} />
                  </div>
                )}
                {p.pipe.material === 'custom' && (
                  <div className="fgrid c3">
                    <NumField path="pipe.customOdMm" label="Outside diameter" sym="D" unit="mm" />
                    <NumField path="pipe.customWtMm" label="Wall thickness" sym="t" unit="mm" />
                  </div>
                )}

                <div className="fsub">Material properties</div>
                <div className="fgrid c3">
                  <NumField path="pipe.density" label="Pipe material density" sym="ρ_{pipe}" unit="kg/m³" libValue={lib.density} hint={`${fmt(p.pipe.density / 1e6, 7)} kg/cm³`} />
                  <NumField path="pipe.E" label={p.pipe.material === 'hdpe' ? 'Short-term modulus' : "Young's modulus"} sym="E" unit="kg/cm²" libValue={lib.E} hint={`= ${fmt(p.pipe.E * 0.0980665, 0)} MPa`} />
                  <NumField path="pipe.strength" label={mat.strengthLabel} sym={mat.strengthLabel === 'SMYS' ? 'S' : 'S_{ref}'} unit={p.pipe.strengthUnit} libValue={lib.strength} hint={p.pipe.strengthUnit === 'psi' ? `= ${fmt(p.pipe.strength * 0.070307, 1)} kg/cm² = ${fmt(p.pipe.strength * 0.00689476, 1)} MPa` : `= ${fmt(p.pipe.strength * 10.1971621, 1)} kg/cm²`} />
                  <NumField path="pipe.allowFactor" label="Allowable stress factor" sym="f" unit={`× ${mat.strengthLabel}`} libValue={lib.allowFactor} hint="Steel: 0.90 HDD practice · 0.72 ASME B31.8 · HDPE: 0.9 × MRS (V1 sheet)" />
                  <NumField label="Allowable axial stress" sym="σ_{allow}" unit="kg/cm²" readOnly value={r.pipe.allowKg} decimals={2} hint={`= ${fmt(r.pipe.allowKg * 0.0980665, 2)} MPa`} />
                  <SelectField path="pipe.contents" label="Pipe contents during push" options={[{ value: 'empty', label: 'Empty (TESPL steel sheet)' }, { value: 'mud', label: 'Flooded with drilling fluid (V1 HDPE sheet)' }, { value: 'water', label: 'Water-filled (ballast)' }]} help="Changes the net submerged weight W_net = W_pipe + W_contents − buoyancy." />
                </div>
              </div>
              <div>
                <div className="fsub">Pipe in reamed hole</div>
                <CrossSection r={r} size={250} />
                <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                  A<sub>s</sub> = {fmt(r.push.props.As, 2)} cm² · W<sub>net</sub> = {fmt(r.push.props.Wnet, 4)} kg/cm
                </div>
                <ul className="muted" style={{ fontSize: 11.5, paddingLeft: 16, marginTop: 10 }}>{mat.notes.map((n, i) => <li key={i} style={{ marginBottom: 4 }}>{n}</li>)}</ul>
              </div>
            </div>
          </Sec>

          {/* 2 MUD & SOIL */}
          <Sec s={SECTIONS[1]} desc="Drilling-fluid drag, pipe-to-bore friction, fluid density (buoyancy) and the reamed hole size used for buoyancy clearance and buckling.">
            <div className="fgrid c3">
              <NumField path="mud.Fmud" label="Fluid drag coefficient" sym="F_{mud}" unit="kg/cm²" hint={`= ${fmt(p.mud.Fmud / 0.070307, 4)} psi · PRCI 0.05 psi ≈ 0.0035 · ASTM F1962 ≈ 0.0017`} />
              <NumField path="mud.mu" label="Pipe–soil friction coefficient" sym="μ" unit="—" range={{ lo: 0.2, hi: 0.5, min: 0, max: 0.8 }} hint="Typical 0.2–0.5 for a lubricated bore" />
              <NumField path="mud.rhoMud" label="Drilling-fluid density" sym="ρ_{mud}" unit="kg/m³" hint={`SG ${fmt(p.mud.rhoMud / 1000, 3)} · ${fmt(p.mud.rhoMud / 1e6, 7)} kg/cm³`} />
              <NumField path="mud.soilDensity" label="Soil density (recorded)" sym="D_{s}" unit="kg/m³" hint="Recorded for the report — not used in the push-force equations (as in the workbook)." />
              <SelectField path="mud.holeRule" label="Reamed hole diameter" options={[{ value: '1.5D', label: '1.5 × OD (TESPL sheets)' }, { value: 'D+12', label: 'OD + 12 in for OD ≥ 24 in, else 1.5 × OD' }, { value: 'custom', label: 'Specified diameter' }]} />
              {p.mud.holeRule === 'custom'
                ? <NumField path="mud.holeCustomMm" label="Reamed hole diameter" sym="D_{hole}" unit="mm" />
                : <NumField label="Reamed hole diameter" sym="D_{hole}" unit="mm" readOnly value={r.buck.Dhole * 10} decimals={1} hint={`Radial clearance ${fmt(r.buck.clearance * 10, 1)} mm`} />}
            </div>
          </Sec>

          {/* 3 PROFILE */}
          <Sec s={SECTIONS[2]} desc="Crossing type and bore geometry. Entry/exit angles, radii and bottom depth define the tangents, curves and bottom run (crossing_profile_geometry_calculator.xlsx); crossing types size the depth from the cover requirement and the setbacks from the banks."
            right={<Link className="btn xs" to="/profile" onClick={(e) => e.stopPropagation()}>Open profile <ArrowRight size={12} /></Link>}>
            <div className="choices" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginBottom: 16 }}>
              {CROSSING_TYPES.map((c) => {
                const Icon = CROSS_ICON[c.key];
                return (
                  <button key={c.key} type="button" className={`choice compact ${p.profile.type === c.key ? 'on' : ''}`} onClick={() => st.set('profile.type', c.key)} aria-pressed={p.profile.type === c.key}>
                    <div className="bd"><b><span className="row" style={{ gap: 7 }}><Icon size={15} /> {c.label}</span><span className="rad" /></b><small>{c.hint}</small></div>
                  </button>
                );
              })}
            </div>
            <div className="fsub">Bore profile</div>
            <div className="fgrid c4">
              <NumField path="profile.entryAng" label="Entry angle" sym="θ_{en}" unit="°" range={{ lo: 8, hi: 20, min: 0, max: 30 }} hint={`${fmt(Math.tan((p.profile.entryAng * Math.PI) / 180) * 100, 1)} % slope`} />
              <NumField path="profile.exitAng" label="Exit angle" sym="θ_{ex}" unit="°" range={{ lo: 5, hi: 20, min: 0, max: 30 }} hint={`${fmt(Math.tan((p.profile.exitAng * Math.PI) / 180) * 100, 1)} % slope`} />
              <NumField path="profile.Ren" label="Entry radius of curvature" sym="R_{en}" unit="m" hint={`Guidance ≥ ${fmt(r.bending.guide, 0)} m`} />
              {p.profile.sameRadius
                ? <NumField label="Exit radius of curvature" sym="R_{ex}" unit="m" readOnly value={p.profile.Ren} hint="Same as entry" />
                : <NumField path="profile.Rex" label="Exit radius of curvature" sym="R_{ex}" unit="m" />}
            </div>
            <div style={{ margin: '10px 0 4px' }}><Toggle path="profile.sameRadius" label="Exit radius equal to entry radius (workbook uses one ROC)" /></div>
            {!isObs && (
              <>
                <div className="fsub">Depth & plan distance</div>
                <div className="fgrid c3">
                  <NumField path="profile.entryDepth" label="Bottom depth below entry point" sym="h_{en}" unit="m" />
                  <NumField path="profile.exitDepth" label="Bottom depth below exit point" sym="h_{ex}" unit="m" />
                  <NumField path="profile.planDist" label="Total plan distance" sym="L_{plan}" unit="m" hint={`Minimum for this geometry ≈ ${fmt(p.profile.planDist - r.prof.CD, 1)} m`} />
                </div>
              </>
            )}
            {isObs && (
              <>
                <div className="fsub">{p.profile.type === 'road' || p.profile.type === 'rail' ? 'Corridor & cover' : 'Channel geometry & cover'}</div>
                <div className="fgrid c4">
                  <NumField path="profile.width" label={p.profile.type === 'road' ? 'Right-of-way width' : p.profile.type === 'rail' ? 'Track corridor width' : 'Width, bank edge to bank edge'} sym="W" unit="m" />
                  {(p.profile.type === 'river' || p.profile.type === 'canal') && <NumField path="profile.bedDepth" label="Bed depth below bank top" sym="b" unit="m" />}
                  {(p.profile.type === 'river' || p.profile.type === 'canal') && <NumField path="profile.sideSlope" label="Bank side slope" sym="s" unit="H:1V" hint="0 = vertical banks" />}
                  {p.profile.type === 'river' && <NumField path="profile.scour" label="Design scour depth" sym="d_{sc}" unit="m" />}
                  <NumField path="profile.coverBed" label={p.profile.type === 'road' ? 'Min cover below road level' : p.profile.type === 'rail' ? 'Min cover below formation' : 'Min cover below (scoured) bed'} sym="c_{min}" unit="m" />
                  <NumField path="profile.coverBank" label={p.profile.type === 'road' || p.profile.type === 'rail' ? 'Min cover at corridor edges' : 'Min cover under banks'} sym="c_{b}" unit="m" />
                  <NumField path="profile.extraDepth" label="Extra design depth" sym="Δh" unit="m" />
                  {(p.profile.type === 'river' || p.profile.type === 'canal') && <NumField path="profile.waterLevel" label="Water level below bank top" unit="m" hint="Drawing only" />}
                  <NumField path="profile.entryGround" label="Entry ground vs bank top" unit="m" hint="+ above / − below" />
                  <NumField path="profile.exitGround" label="Exit ground vs bank top" unit="m" hint="+ above / − below" />
                </div>
                <div className="fsub">Setbacks</div>
                <div className="fgrid c4">
                  <div className="fld"><label className="lb">Entry setback</label><Toggle path="profile.fixEntry" label="Fix (rig position set)" /></div>
                  {p.profile.fixEntry ? <NumField path="profile.entrySetback" label="Entry setback" unit="m" /> : <NumField label="Entry setback (minimum)" unit="m" readOnly value={r.prof.obstacle?.minSetEntry} decimals={2} />}
                  <div className="fld"><label className="lb">Exit setback</label><Toggle path="profile.fixExit" label="Fix (exit position set)" /></div>
                  {p.profile.fixExit ? <NumField path="profile.exitSetback" label="Exit setback" unit="m" /> : <NumField label="Exit setback (minimum)" unit="m" readOnly value={r.prof.obstacle?.minSetExit} decimals={2} />}
                </div>
              </>
            )}
            <div className="fsub">Optional</div>
            <div className="fgrid c4">
              <NumField path="profile.planRadius" label="Plan (horizontal) curve radius" sym="R_{h}" unit="m" hint="0 = straight in plan. Enables the combined-radius check." />
              <NumField path="profile.stationStep" label="Station table interval" unit="m" />
            </div>
            <div style={{ marginTop: 14 }}>
              {r.prof.feasible
                ? <Callout kind="ok">Profile is feasible — HDD length {fmt(r.prof.total, 2)} m over {fmt(r.prof.nodes.F.x, 2)} m plan distance{r.prof.obstacle ? ` · setbacks ${fmt(r.prof.obstacle.setEntry, 2)} m entry / ${fmt(r.prof.obstacle.setExit, 2)} m exit` : ''}.</Callout>
                : <Callout kind="fail"><b>Profile requires attention.</b> {r.prof.issues.map((i) => i.msg).join(' ')}</Callout>}
            </div>
            <div style={{ marginTop: 12 }}><ProfileSVG r={r} height={250} showDims={false} id="inprof" waterLevel={p.profile.waterLevel} /></div>
          </Sec>

          {/* 4 SECTIONS */}
          <Sec s={SECTIONS[3]} desc="Lengths and depths of the five push-force sections. Take them from the profile (recommended), or enter them manually to reproduce a drawing or an existing calculation sheet.">
            <div className="row" style={{ marginBottom: 14 }}>
              <Seg value={p.sections.source} onChange={(v) => st.set('sections.source', v)} options={[{ value: 'profile', label: 'From profile geometry' }, { value: 'manual', label: 'Manual (as per drawing / sheet)' }]} />
              {p.sections.source === 'profile' && (
                <>
                  <span className="muted" style={{ fontSize: 12 }}>Depth for the mud-pressure term:</span>
                  <Seg size="sm" value={p.sections.depthBasis} onChange={(v) => st.set('sections.depthBasis', v)} options={[{ value: 'deeper', label: 'Deeper end (conservative)' }, { value: 'mean', label: 'Mean of section' }]} />
                </>
              )}
            </div>
            <div className="tbl-wrap">
              <table className="t">
                <thead><tr><th className="l">Section</th><th className="l">Type</th><th>Length, m</th><th>Depth, m</th><th>Profile length, m</th><th>Difference</th></tr></thead>
                <tbody>
                  {['Entry tangent (AB)', 'Entry curve (BC)', 'Horizontal (CD)', 'Exit curve (DE)', 'Exit tangent (EF)'].map((nm, i) => {
                    const manual = p.sections.source === 'manual';
                    const Lp = r.prof.lengths[i];
                    const Lu = r.sectionsUsed.L[i];
                    const diff = manual && r.prof.feasible && Lp > 0 ? (Lu - Lp) / Lp : null;
                    return (
                      <tr key={i}>
                        <td className="l"><b>L{i + 1}</b> · {nm}</td>
                        <td className="l">{i === 1 || i === 3 ? 'Arc' : 'Straight'}</td>
                        <td style={{ width: 150 }}>{manual ? <CellNum path={`sections.L`} i={i} /> : fmt(Lu, 3)}</td>
                        <td style={{ width: 150 }}>{manual ? <CellNum path={`sections.d`} i={i} /> : fmt(r.sectionsUsed.d[i], 3)}</td>
                        <td>{r.prof.feasible ? fmt(Lp, 3) : '—'}</td>
                        <td className={diff != null && Math.abs(diff) > 0.05 ? 'warn-t' : ''}>{diff != null ? `${diff > 0 ? '+' : ''}${fmt(diff * 100, 1)} %` : '—'}</td>
                      </tr>
                    );
                  })}
                  <tr className="tot"><td className="l" colSpan={2}>Total length along the bore</td><td>{fmt(r.totalLength, 3)}</td><td /><td>{r.prof.feasible ? fmt(r.prof.total, 3) : '—'}</td><td /></tr>
                </tbody>
              </table>
            </div>
            {p.sections.source === 'manual' && <div style={{ marginTop: 10 }}><Callout kind="warn">Manual lengths are used in the push-force calculation. The profile drawing and its checks remain for reference and are reported as advisory. Angles and radii still come from section 03.</Callout></div>}
          </Sec>

          {/* 5 METHOD */}
          <Sec s={SECTIONS[4]} desc="Choose how resistances accumulate along the bore. Both methods reproduce a TESPL workbook exactly; compare them on the Results page.">
            <div className="choices" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {Object.values(METHODS).map((m) => (
                <button key={m.key} type="button" className={`choice ${p.method.key === m.key ? 'on' : ''}`} onClick={() => st.set('method.key', m.key)} aria-pressed={p.method.key === m.key}>
                  <div className="bd">
                    <b><span>Method {m.key} · {m.label}</span><span className="rad" /></b>
                    <small style={{ marginTop: 6 }}>{m.desc}</small>
                    <small style={{ marginTop: 6 }}><Tag kind="sheet">{m.source}</Tag> {m.key === 'S' ? 'Typical for steel' : 'Typical for HDPE'}</small>
                  </div>
                </button>
              ))}
            </div>
            {((p.pipe.material === 'hdpe' && p.method.key === 'S') || (p.pipe.material === 'steel' && p.method.key === 'C')) && (
              <div style={{ marginTop: 12 }}><Callout kind="warn">The TESPL workbooks use Method {p.pipe.material === 'hdpe' ? 'C for HDPE' : 'S for steel'}. The selected method is valid for any material; this is a reminder only.</Callout></div>
            )}
            {p.method.key === 'S' && (
              <>
                <div className="fsub">Segmental method options</div>
                <div className="fgrid c3">
                  <NumField path="method.T1" label="Entry-curve initial tension" sym="T_{1}" unit="t" readOnly={p.method.corrected} hint={p.method.corrected ? 'Corrected model: T1 = force entering the bend' : 'Workbook value 4.11 t (cell O31)'} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <Toggle path="method.corrected" label="Use engineering-corrected curve model (link the entry-curve initial tension to the force entering the bend and apply the μ growth term on the exit curve). Off = reproduce the workbook exactly." />
                </div>
              </>
            )}
            {p.method.key === 'C' && <div style={{ marginTop: 12 }}><Callout>Hydrostatic slurry head is excluded from the axial sum (it acts normal to the pipe; its effect enters through buoyancy). Capstan factor e<sup>μθ</sup> carries the tension through each curve. Section depths are not used.</Callout></div>}
          </Sec>

          {/* 6 BUCKLING */}
          <Sec s={SECTIONS[5]} desc="Constrained buckling of the pipe pushed inside the bore (Dawson–Paslay; Gao et al. 2010). 'Method default' follows the convention of the workbook that belongs to the selected method.">
            <div className="fgrid c4">
              <SelectField path="buckling.muMode" label="Pipe / bore friction for buckling" options={[{ value: 'soil', label: 'Same as soil friction μ (steel sheet)' }, { value: 'custom', label: 'Separate value (V1 sheet: 0.2)' }]} />
              {p.buckling.muMode === 'custom' ? <NumField path="buckling.muB" label="Buckling friction coefficient" sym="μ_{b}" unit="—" /> : <NumField label="Buckling friction coefficient" sym="μ_{b}" unit="—" readOnly value={p.mud.mu} />}
              <SelectField path="buckling.weight" label="Weight per unit length" options={[{ value: 'auto', label: `Method default (${METHODS[p.method.key].defaults.weight === 'air' ? 'in air' : 'effective'})` }, { value: 'air', label: 'Pipe weight in air (steel sheet)' }, { value: 'effective', label: 'Effective submerged |W_net| (V1)' }]} />
              <SelectField path="buckling.angleRef" label="Inclination reference angle" options={[{ value: 'auto', label: `Method default (${METHODS[p.method.key].defaults.angleRef} angle)` }, { value: 'exit', label: 'Exit angle (steel sheet)' }, { value: 'entry', label: 'Entry angle (V1)' }]} />
              <SelectField path="buckling.criterion" label="Acceptance criterion" options={[{ value: 'auto', label: `Method default (${METHODS[p.method.key].defaults.criterion === 'dp' ? 'Dawson–Paslay' : 'Gao sinusoidal'})` }, { value: 'dp', label: 'F < Dawson–Paslay sinusoidal' }, { value: 'gao', label: 'F < Gao sinusoidal' }]} />
            </div>
            <div className="row" style={{ marginTop: 12, fontSize: 12.5 }}>
              <span className="muted">Resolved:</span>
              <span className="chip">w = {r.buck.weight === 'air' ? 'W_air' : '|W_net|'} = {fmt(r.buck.w, 4)} kg/cm</span>
              <span className="chip">α = 90° − {fmt(r.buck.refAng, 1)}°</span>
              <span className="chip">μ_b = {fmt(r.buck.muB, 3)}</span>
              <span className="chip">criterion {r.buck.criterion === 'gao' ? 'Gao' : 'D–P'}</span>
            </div>
          </Sec>

          {/* 7 CLAMP */}
          <Sec s={SECTIONS[6]} desc="Pipe thruster grip: clamp force needed to transmit the push force through friction, the thruster's clamp capacity, and the pipe-wall bearing limit (HDPE_Push_Clamp_Calc_V1 → Clamp_Check).">
            <div style={{ marginBottom: 12 }}><Toggle path="clamp.enabled" label="Include thruster clamp check" /></div>
            {p.clamp.enabled && (
              <div className="fgrid c4">
                <NumField path="clamp.sf" label="Push demand safety factor" sym="SF" unit="—" />
                <NumField path="clamp.muGrip" label="Grip friction, pad / pipe" sym="μ_{grip}" unit="—" hint="0.3–0.5 elastomer or serrated pads" />
                <NumField path="clamp.pads" label="Number of clamp pads" sym="n" unit="—" />
                <NumField path="clamp.padLength" label="Pad length (along pipe)" unit="cm" />
                <NumField path="clamp.padWidth" label="Pad contact width (arc)" unit="cm" />
                <NumField path="clamp.pMax" label="Max clamp pressure" sym="p_{max}" unit="MPa" hint="Thruster machine specification" />
                <SelectField path="clamp.bearingMode" label="Allowable wall bearing stress" options={[{ value: 'auto', label: `= allowable axial stress (${fmt(r.pipe.allowKg * 0.0980665, 2)} MPa)` }, { value: 'custom', label: 'Specified value' }]} />
                {p.clamp.bearingMode === 'custom' && <NumField path="clamp.sigmaBearing" label="Allowable bearing stress" sym="σ_{bear}" unit="MPa" hint="V1 sheet: 9 MPa (PE, ~MRS/SF)" />}
              </div>
            )}
          </Sec>
        </div>

        {/* live aside */}
        <div className="aside">
          <div className="card live">
            <div className="card-h"><h3>Current design</h3><span className="sub">live · Rev {p.meta.revision}</span></div>
            <div style={{ padding: '10px 12px' }}>
              <div className={`banner ${r.overall.state}`} style={{ padding: '10px 12px', gap: 10 }}>
                <span className={`st ${r.overall.state}`}>{r.overall.state === 'fail' ? <X size={16} /> : <Check size={16} />}</span>
                <div><div className="t" style={{ fontSize: 12.5 }}>{r.overall.title}</div><div className="s" style={{ fontSize: 11.5 }}>{r.overall.sub}</div></div>
              </div>
            </div>
            <div className="lv"><span>Installation force F<sub>max</sub></span><b className="brand-t">{fmt(r.Fmax, 2)}<i>t</i></b></div>
            <div className="lv"><span>Push force</span><b>{fmt(r.Fmax * 9.80665, 1)}<i>kN</i></b></div>
            <div className="lv"><span>Axial stress σ</span><b>{fmt(r.stress.sigma, 1)}<i>kg/cm²</i></b></div>
            <div className="lv"><span>Utilisation</span><b className={r.stress.ok ? 'ok-t' : 'fail-t'}>{fmt(r.stress.util * 100, 1)}<i>%</i></b></div>
            <div className="lv"><span>Buckling load (criterion)</span><b>{fmt(r.buck.Fsin, 2)}<i>t</i></b></div>
            <div className="lv"><span>Buckling SF</span><b className={r.buck.ok ? 'ok-t' : 'fail-t'}>{fmt(r.buck.sf, 2)}</b></div>
            <div className="lv"><span>HDD length</span><b>{fmt(r.totalLength, 1)}<i>m</i></b></div>
            {r.clamp && <div className="lv"><span>Clamp demand / capacity</span><b className={r.clamp.capacityOk ? 'ok-t' : 'fail-t'}>{fmt(r.clamp.Freq, 0)} / {fmt(r.clamp.Fcap, 0)}<i>kN</i></b></div>}
            <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {r.checks.map((c) => <span key={c.key} className={`chip ${c.state === 'pass' ? 'ok' : c.state}`} title={`${c.label}: ${c.value} (${c.limit})`}>{c.state === 'pass' ? <Check size={11} /> : c.state === 'warn' ? <AlertTriangle size={11} /> : <X size={11} />}{c.group}</span>)}
            </div>
            <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
              <Link className="btn sm primary" to="/results" style={{ flex: 1 }}>Results <ArrowRight size={13} /></Link>
              <Link className="btn sm" to="/steps" style={{ flex: 1 }}>Steps</Link>
            </div>
          </div>
          {r.validation.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-h"><h3>Input review</h3><span className="sub">{r.validation.length} item(s)</span></div>
              <div className="card-b" style={{ display: 'grid', gap: 8 }}>
                {r.validation.map((v, i) => <div key={i} style={{ fontSize: 12 }}><Status state={v.level === 'error' ? 'fail' : 'warn'}>{v.level === 'error' ? 'Error' : 'Review'}</Status> <span className="dim2">{v.msg}</span></div>)}
              </div>
            </div>
          )}
        </div>
      </div>
      </SecCtx.Provider>
    </div>
  );
}

/* Section card — module level so inputs keep focus across re-renders; open/closed state comes from context. */
const SecCtx = createContext(null);
function Sec({ s, desc, right, children }) {
  const { closed, toggle, secIssues } = useContext(SecCtx);
  const iss = secIssues(s.prefix);
  const err = iss.filter((i) => i.level === 'error').length, wrn = iss.length - err;
  const isClosed = !!closed[s.id];
  return (
    <section className={`isec ${isClosed ? 'closed' : ''}`} id={`sec-${s.id}`}>
      <div className="hd" onClick={() => toggle(s.id)} role="button" aria-expanded={!isClosed} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggle(s.id)}>
        <span className="no">{String(s.no).padStart(2, '0')}</span>
        <div><h3>{s.title}</h3><p>{desc}</p></div>
        <div className="r" onClick={(e) => e.stopPropagation()}>
          {err ? <span className="chip fail"><X size={11} /> {err} error{err > 1 ? 's' : ''}</span> : wrn ? <span className="chip warn"><AlertTriangle size={11} /> {wrn} to review</span> : <span className="chip ok"><Check size={11} /> Valid</span>}
          {right}
          <button className="btn icon ghost sm" onClick={() => toggle(s.id)} aria-label={isClosed ? 'Expand section' : 'Collapse section'}>{isClosed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
        </div>
      </div>
      <div className="bd">{children}</div>
    </section>
  );
}

function CellNum({ path, i }) {
  const st = useStore();
  const arr = path === 'sections.L' ? st.project.sections.L : st.project.sections.d;
  const [txt, setTxt] = useState(String(arr[i]));
  const [focus, setFocus] = useState(false);
  const shown = focus ? txt : String(+Number(arr[i]).toPrecision(10));
  return (
    <input className="cell num" inputMode="decimal" value={shown} aria-label={`${path} ${i + 1}`}
      onFocus={() => { setFocus(true); setTxt(String(arr[i])); }} onBlur={() => setFocus(false)}
      onChange={(e) => { setTxt(e.target.value); const v = Number(e.target.value); if (e.target.value.trim() !== '' && isFinite(v)) { const next = [...arr]; next[i] = v; st.set(path, next); } }} />
  );
}
