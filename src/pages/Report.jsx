import { Printer } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { fmt, fmtAuto, Tex } from '../components/ui.jsx';
import { ProfileSVG, ForceChart } from '../components/drawings.jsx';
import { MATERIALS } from '../engine/materials.js';
import { CROSSING_TYPES } from '../engine/profile.js';
import { CONVENTIONS, ASSUMPTIONS, GUIDANCE, REFS } from './Basis.jsx';
import { asset } from '../lib/asset.js';

const ST = { pass: '✓ Within limit', warn: '⚠ Review', fail: '✕ Limit exceeded' };

export default function Report() {
  const { project: p, results: r, steps } = useStore();
  const m = p.meta;
  const date = m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const H = ({ n, children }) => <h2 className="rh"><span>{n}</span>{children}</h2>;
  const nClamp = r.clamp ? 7 : null, nBend = r.clamp ? 8 : 7, nBasis = nBend + 1, nApp = nBasis + 1;
  const Row = ({ k, v, u, note }) => <tr><td className="l">{k}</td><td>{v}</td><td className="l u">{u}</td>{note !== undefined && <td className="l nt">{note}</td>}</tr>;
  const ctype = CROSSING_TYPES.find((c) => c.key === p.profile.type)?.label;
  const PageFoot = () => <div className="pfoot"><span>{m.docNo} · Rev {m.revision}</span><span>{m.name}</span><span>HDD Push &amp; Buckling Studio</span></div>;

  return (
    <div className="report-wrap">
      <div className="report-bar no-print">
        <div><b>Report preview</b> <span className="muted">— A4, printed from your browser. Choose “Save as PDF” as the printer to create a PDF.</span></div>
        <button className="btn primary" onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</button>
      </div>

      <div className="paper">
        {/* COVER */}
        <section className="sheet cover">
          <div className="cv-top">
            <img src={asset('brand/logo-256.png')} alt="" />
            <div><div className="cv-app">HDD PUSH &amp; BUCKLING STUDIO</div><div className="cv-sub">Engineering calculation</div></div>
            <div className="cv-doc">{m.docNo}<br /><span>Rev {m.revision} · {m.status}</span></div>
          </div>
          <div className="cv-photo" style={{ backgroundImage: `url(${asset('images/hdd-rig-site.webp')})` }} />
          <div className="cv-title">Installation Push Force &amp; Buckling Calculation</div>
          <div className="cv-proj">{m.name}</div>
          <div className="cv-meta">
            <table className="rt">
              <tbody>
                <tr><td className="l">Client / owner</td><td className="l">{m.client || '—'}</td><td className="l">Location</td><td className="l">{m.location || '—'}</td></tr>
                <tr><td className="l">Feature crossed</td><td className="l">{m.feature || ctype}</td><td className="l">HDD contractor</td><td className="l">{m.contractor || '—'}</td></tr>
                <tr><td className="l">Pipe</td><td className="l">{r.pipe.gradeLabel} · {r.pipe.odLabel}</td><td className="l">Method</td><td className="l">{r.method.label}</td></tr>
                <tr><td className="l">Date</td><td className="l">{date}</td><td className="l">Result</td><td className="l"><b className={`rs-${r.overall.state}`}>{r.overall.title}</b></td></tr>
              </tbody>
            </table>
          </div>
          <table className="rt sign">
            <thead><tr><th className="l">Rev</th><th className="l">Date</th><th className="l">Description</th><th className="l">Prepared</th><th className="l">Checked</th><th className="l">Approved</th></tr></thead>
            <tbody><tr><td className="l">{m.revision}</td><td className="l">{date}</td><td className="l">{p.revisions[p.revisions.length - 1]?.description || '—'}</td><td className="l">{m.preparedBy || ' '}</td><td className="l">{m.checkedBy || ' '}</td><td className="l">{m.approvedBy || ' '}</td></tr></tbody>
          </table>
          <p className="disc">Engineering results are dependent on the input data, assumptions, calculation methodology and applicable project criteria. The software does not replace project-specific engineering review.</p>
          <PageFoot />
        </section>

        {/* SUMMARY */}
        <section className="sheet">
          <H n={1}>Summary of results</H>
          <div className={`rbanner rs-${r.overall.state}`}><b>{r.overall.title}</b> — {r.overall.sub}</div>
          <table className="rt kpis">
            <tbody>
              <tr>
                <td><span>Installation force</span><b>{fmt(r.Fmax, 2)} t</b><small>{fmt(r.Fmax * 9.80665, 1)} kN</small></td>
                <td><span>Axial stress</span><b>{fmt(r.stress.sigma, 1)} kg/cm²</b><small>{fmt(r.stress.util * 100, 1)} % of allowable</small></td>
                <td><span>Buckling criterion</span><b>{fmt(r.buck.Fsin, 2)} t</b><small>SF {fmt(r.buck.sf, 2)}</small></td>
                <td><span>HDD length</span><b>{fmt(r.totalLength, 1)} m</b><small>{r.sectionsUsed.source === 'profile' ? 'from profile' : 'manual sections'}</small></td>
              </tr>
            </tbody>
          </table>
          <h3 className="rh3">Design criteria and guidance</h3>
          <table className="rt">
            <thead><tr><th className="l">Check</th><th className="l">Type</th><th>Value</th><th>Limit</th><th className="l">Status</th></tr></thead>
            <tbody>{r.checks.map((c) => <tr key={c.key}><td className="l">{c.label}</td><td className="l">{c.kind === 'criterion' ? 'Criterion' : 'Guidance'}</td><td>{c.value}</td><td>{c.limit}</td><td className={`l rs-${c.state}`}>{ST[c.state]}</td></tr>)}</tbody>
          </table>
          {m.notes && <><h3 className="rh3">Project notes</h3><p className="rp">{m.notes}</p></>}
          <h3 className="rh3">Revision history</h3>
          <table className="rt">
            <thead><tr><th className="l">Rev</th><th className="l">Date</th><th className="l">By</th><th className="l">Description</th></tr></thead>
            <tbody>{p.revisions.map((v, i) => <tr key={i}><td className="l">{v.rev}</td><td className="l">{v.date}</td><td className="l">{v.by || '—'}</td><td className="l">{v.description}</td></tr>)}</tbody>
          </table>
          <PageFoot />
        </section>

        {/* INPUTS */}
        <section className="sheet">
          <H n={2}>Design inputs</H>
          <div className="two">
            <div>
              <h3 className="rh3">Pipe &amp; material — {MATERIALS[p.pipe.material].label}</h3>
              <table className="rt"><tbody>
                <Row k="Grade / class" v={r.pipe.gradeLabel} u="" />
                <Row k="Outside diameter D" v={fmt(r.pipe.ODmm, 1)} u="mm" />
                <Row k="Wall thickness t" v={fmt(r.pipe.WTmm, 2)} u="mm" />
                <Row k="Dimension ratio D/t" v={fmt(r.pipe.SDR, 2)} u="—" />
                <Row k="Density ρ" v={fmt(p.pipe.density, 0)} u="kg/m³" />
                <Row k="Modulus E" v={fmt(p.pipe.E, 0)} u="kg/cm²" />
                <Row k={r.pipe.mat.strengthLabel} v={`${fmt(p.pipe.strength, p.pipe.strengthUnit === 'psi' ? 0 : 1)} ${p.pipe.strengthUnit}`} u={`${fmt(r.pipe.strengthKg, 1)} kg/cm²`} />
                <Row k="Allowable stress" v={fmt(r.pipe.allowKg, 1)} u={`kg/cm² (${fmt(p.pipe.allowFactor, 2)} × ${r.pipe.mat.strengthLabel})`} />
                <Row k="Contents during push" v={{ empty: 'Empty', mud: 'Flooded (drilling fluid)', water: 'Water-filled' }[p.pipe.contents]} u="" />
              </tbody></table>
              <h3 className="rh3">Drilling fluid &amp; soil</h3>
              <table className="rt"><tbody>
                <Row k="Fluid drag coefficient F_mud" v={fmtAuto(+p.mud.Fmud)} u="kg/cm²" />
                <Row k="Pipe–soil friction μ" v={fmt(+p.mud.mu, 3)} u="—" />
                <Row k="Drilling-fluid density" v={fmt(+p.mud.rhoMud, 1)} u="kg/m³" />
                <Row k="Soil density (recorded)" v={fmt(+p.mud.soilDensity, 0)} u="kg/m³" />
                <Row k="Reamed hole diameter" v={fmt(r.buck.Dhole * 10, 1)} u={`mm (${p.mud.holeRule === 'custom' ? 'specified' : p.mud.holeRule === 'D+12' ? 'OD + 12 in' : '1.5 × OD'})`} />
              </tbody></table>
            </div>
            <div>
              <h3 className="rh3">Crossing profile — {ctype}</h3>
              <table className="rt"><tbody>
                <Row k="Entry / exit angle" v={`${fmt(+p.profile.entryAng, 2)}° / ${fmt(+p.profile.exitAng, 2)}°`} u="" />
                <Row k="Entry / exit radius" v={`${fmt(r.prof.inputs.Ren, 1)} / ${fmt(r.prof.inputs.Rex, 1)}`} u="m" />
                {p.profile.type === 'open' ? <>
                  <Row k="Bottom depth below entry / exit" v={`${fmt(+p.profile.entryDepth, 2)} / ${fmt(+p.profile.exitDepth, 2)}`} u="m" />
                  <Row k="Plan distance" v={fmt(+p.profile.planDist, 2)} u="m" />
                </> : <>
                  <Row k="Crossing width" v={fmt(+p.profile.width, 2)} u="m" />
                  {(p.profile.type === 'river' || p.profile.type === 'canal') && <Row k="Bed depth / side slope" v={`${fmt(+p.profile.bedDepth, 2)} m / ${fmt(+p.profile.sideSlope, 2)} H:1V`} u="" />}
                  {p.profile.type === 'river' && <Row k="Design scour" v={fmt(+p.profile.scour, 2)} u="m" />}
                  <Row k="Min cover (bed / banks)" v={`${fmt(+p.profile.coverBed, 2)} / ${fmt(+p.profile.coverBank, 2)}`} u="m" />
                  <Row k="Setbacks entry / exit" v={`${fmt(r.prof.obstacle.setEntry, 2)} / ${fmt(r.prof.obstacle.setExit, 2)}`} u="m" />
                </>}
                <Row k="Section lengths" v={r.sectionsUsed.source === 'profile' ? 'From profile' : 'Manual'} u="" />
              </tbody></table>
              <h3 className="rh3">Method &amp; models</h3>
              <table className="rt"><tbody>
                <Row k="Push-force method" v={`Method ${r.method.key}`} u={r.method.source} />
                {r.method.key === 'S' && <Row k="Entry-curve T1 / model" v={p.method.corrected ? 'linked to L1 force' : `${fmt(+p.method.T1, 2)} t`} u={p.method.corrected ? 'corrected model' : 'as per workbook'} />}
                <Row k="Buckling criterion" v={r.buck.criterion === 'gao' ? 'Gao sinusoidal' : 'Dawson–Paslay'} u="" />
                <Row k="Buckling weight / angle" v={`${r.buck.weight === 'air' ? 'in air' : 'effective'} / 90° − ${fmt(r.buck.refAng, 1)}°`} u="" />
                <Row k="Buckling friction μb" v={fmt(r.buck.muB, 3)} u="—" />
                {r.clamp && <Row k="Thruster pads" v={`${p.clamp.pads} × ${p.clamp.padLength} × ${p.clamp.padWidth} cm`} u={`p_max ${p.clamp.pMax} MPa`} />}
              </tbody></table>
            </div>
          </div>
          <PageFoot />
        </section>

        {/* GEOMETRY */}
        <section className="sheet">
          <H n={3}>HDD profile geometry</H>
          <ProfileSVG r={r} height={330} interactive={false} id="rpprof" printMode waterLevel={p.profile.waterLevel} />
          <div className="two" style={{ marginTop: 10 }}>
            <table className="rt">
              <thead><tr><th className="l">Segment</th><th>Length, m</th><th>Horiz., m</th><th>Vert., m</th></tr></thead>
              <tbody>
                {r.prof.lengths.map((v, i) => <tr key={i}><td className="l">{['AB entry tangent', 'BC entry curve', 'CD bottom run', 'DE exit curve', 'EF exit tangent'][i]}</td><td>{fmt(v, 2)}</td><td>{fmt(r.prof.horizontal[i], 2)}</td><td>{fmt(Math.abs(r.prof.vertical[i]), 2)}</td></tr>)}
                <tr className="tot"><td className="l">HDD length</td><td>{fmt(r.prof.total, 2)}</td><td>{fmt(r.prof.nodes.F.x, 2)}</td><td /></tr>
              </tbody>
            </table>
            <table className="rt">
              <thead><tr><th className="l">Node</th><th>x, m</th><th>Elev., m</th><th>Depth, m</th></tr></thead>
              <tbody>{Object.entries(r.prof.nodes).map(([k, q]) => <tr key={k}><td className="l">{k}</td><td>{fmt(q.x, 2)}</td><td>{fmt((r.prof.datum || 0) + q.y, 2)}</td><td>{fmt(-q.y, 2)}</td></tr>)}</tbody>
            </table>
          </div>
          {r.prof.coverCheck?.length > 0 && (
            <table className="rt" style={{ marginTop: 10 }}>
              <thead><tr><th className="l">Cover check point</th><th>Chainage, m</th><th>Cover, m</th><th>Required, m</th><th className="l">Status</th></tr></thead>
              <tbody>{r.prof.coverCheck.map((c) => <tr key={c.key}><td className="l">{c.label}</td><td>{fmt(c.x, 2)}</td><td>{fmt(c.cover, 2)}</td><td>{fmt(c.req, 2)}</td><td className={`l rs-${c.ok ? 'pass' : 'fail'}`}>{c.ok ? '✓ OK' : '✕ Low'}</td></tr>)}</tbody>
            </table>
          )}
          {!r.prof.feasible && <p className="rp rs-fail">Profile issues: {r.prof.issues.map((i) => i.msg).join(' ')}</p>}
          <PageFoot />
        </section>

        {/* FORCE */}
        <section className="sheet">
          <H n={4}>Installation force calculation</H>
          <p className="rp">{r.method.label} ({r.method.source}). Pipe properties: A<sub>s</sub> = {fmt(r.push.props.As, 3)} cm²; W<sub>air</sub> = {fmt(r.push.props.Wair, 4)} kg/cm; buoyancy B = {fmt(r.push.props.B, 4)} kg/cm; W<sub>net</sub> = {fmt(r.push.props.Wnet, 4)} kg/cm ({r.push.props.Wnet < 0 ? 'buoyant' : 'heavy'}).</p>
          <table className="rt">
            <thead><tr><th className="l">Section</th><th>L, m</th><th>h, m</th><th className="l">Contributions, t</th><th>ΔF, t</th><th>ΣF, t</th></tr></thead>
            <tbody>
              {r.push.sections.map((s) => (
                <tr key={s.n}><td className="l">L{s.n} {s.name}</td><td>{fmt(s.L / 100, 2)}</td><td>{s.depth != null ? fmt(s.depth / 100, 2) : '—'}</td>
                  <td className="l nt">{s.terms.map((t) => `${t.label.split(' (')[0].replace(/ e\^.*$/, '')} ${fmt(t.value, 3)}${t.included ? '' : ' (n/a)'}`).join(' · ')}</td>
                  <td>{fmt(s.net, 3)}</td><td><b>{fmt(s.cum, 3)}</b></td></tr>
              ))}
              <tr className="tot"><td className="l" colSpan={5}>Maximum installation force F<sub>max</sub></td><td>{fmt(r.Fmax, 3)} t</td></tr>
            </tbody>
          </table>
          <h3 className="rh3">Installation force vs chainage</h3>
          <ForceChart r={r} height={260} id="rpfc" printMode />
          <PageFoot />
        </section>

        {/* STRUCTURAL */}
        <section className="sheet">
          <H n={5}>Axial stress assessment</H>
          <table className="rt"><tbody>
            <Row k="Applied axial stress σ = 1000 F / A_s" v={fmt(r.stress.sigma, 1)} u="kg/cm²" note={`${fmt(r.stress.sigma * 0.0980665, 2)} MPa`} />
            <Row k="Allowable stress" v={fmt(r.stress.allow, 1)} u="kg/cm²" note={`${fmt(p.pipe.allowFactor, 2)} × ${r.pipe.mat.strengthLabel}`} />
            <Row k="Utilisation" v={fmt(r.stress.util * 100, 1)} u="%" note={<span className={`rs-${r.stress.ok ? 'pass' : 'fail'}`}>{r.stress.ok ? ST.pass : ST.fail}</span>} />
            <Row k={`Factor of safety vs ${r.pipe.mat.strengthLabel}`} v={fmt(r.stress.fosRef, 2)} u="—" note="" />
          </tbody></table>
          <H n={6}>Buckling assessment</H>
          <p className="rp">Pipe constrained in the bore: I = {fmt(r.buck.I, 1)} cm⁴, w = {fmt(r.buck.w, 4)} kg/cm ({r.buck.weight === 'air' ? 'in air' : 'effective'}), α = {fmt(90 - r.buck.refAng, 1)}°, r<sub>c</sub> = {fmt(r.buck.clearance, 2)} cm, μ<sub>b</sub> = {fmt(r.buck.muB, 3)}.</p>
          <table className="rt">
            <thead><tr><th className="l">Buckling mode</th><th>Load, t</th><th className="l">Method</th><th className="l">vs F<sub>max</sub> = {fmt(r.Fmax, 2)} t</th></tr></thead>
            <tbody>
              <tr><td className="l">Sinusoidal (initiation)</td><td>{fmt(r.buck.Fdp, 2)}</td><td className="l">Dawson–Paslay (1984){r.buck.criterion === 'dp' ? ' — criterion' : ''}</td><td className={`l rs-${r.Fmax < r.buck.Fdp ? 'pass' : 'fail'}`}>{r.Fmax < r.buck.Fdp ? '✓ below' : '✕ exceeded'}</td></tr>
              <tr><td className="l">Sinusoidal with friction</td><td>{fmt(r.buck.Fgao, 2)}</td><td className="l">Gao et al. (2010), β<sub>crs</sub> = {fmt(r.buck.Bcrs, 4)}{r.buck.criterion === 'gao' ? ' — criterion' : ''}</td><td className={`l rs-${r.Fmax < r.buck.Fgao ? 'pass' : 'fail'}`}>{r.Fmax < r.buck.Fgao ? '✓ below' : '✕ exceeded'}</td></tr>
              <tr><td className="l">Helical (lock-up)</td><td>{fmt(r.buck.Fhel, 2)}</td><td className="l">Gao et al. (2010), β<sub>crh</sub> = {fmt(r.buck.Bcrh, 4)}</td><td className={`l rs-${r.Fmax < r.buck.Fhel ? 'pass' : 'fail'}`}>{r.Fmax < r.buck.Fhel ? '✓ below' : '✕ exceeded'}</td></tr>
            </tbody>
          </table>
          <p className="rp">Result: <b className={`rs-${r.buck.ok ? 'pass' : 'fail'}`}>{r.buck.regime === 'none' ? 'No buckling predicted' : r.buck.regime === 'sinusoidal' ? 'Sinusoidal buckling regime' : 'Helical buckling / lock-up'}</b> · safety factor against the criterion {fmt(r.buck.sf, 2)}.</p>
          {r.clamp && <>
            <H n={nClamp}>Thruster clamp check</H>
            <table className="rt"><tbody>
              <Row k="Peak push force" v={fmt(r.clamp.Fpush, 1)} u="kN" note="F × 9.81" />
              <Row k="Required clamp force" v={fmt(r.clamp.Freq, 1)} u="kN" note={`× SF ${p.clamp.sf} ÷ μ_grip ${p.clamp.muGrip}`} />
              <Row k="Clamp capacity" v={fmt(r.clamp.Fcap, 1)} u="kN" note={<span className={`rs-${r.clamp.capacityOk ? 'pass' : 'fail'}`}>{r.clamp.capacityOk ? ST.pass : ST.fail}</span>} />
              <Row k="Clamp pressure on wall / limit" v={`${fmt(r.clamp.pApplied, 3)} / ${fmt(r.clamp.pAllow, 3)}`} u="MPa" note={<span className={`rs-${r.clamp.wallOk ? 'pass' : 'fail'}`}>{r.clamp.wallOk ? ST.pass : ST.fail}</span>} />
            </tbody></table>
          </>}
          <H n={nBend}>Bending &amp; radius (advisory)</H>
          <table className="rt"><tbody>
            <Row k="Smallest radius / guidance" v={`${fmt(r.bending.Rmin, 1)} / ${fmt(r.bending.guide, 1)}`} u="m" note={r.bending.guideBasis} />
            <Row k="Elastic bending stress E·D/2R" v={fmt(r.bending.sigmaB, 1)} u="kg/cm²" note="information only" />
          </tbody></table>
          <PageFoot />
        </section>

        {/* BASIS */}
        <section className="sheet">
          <H n={nBasis}>Assumptions, conventions &amp; references</H>
          <h3 className="rh3">Workbook conventions reproduced</h3>
          <ul className="rl">{CONVENTIONS.map(([, t], i) => <li key={i}>{t}</li>)}</ul>
          <h3 className="rh3">Assumptions</h3>
          <ul className="rl">{ASSUMPTIONS.map(([, t], i) => <li key={i}>{t}</li>)}</ul>
          <h3 className="rh3">Engineering guidance (not calculated results)</h3>
          <ul className="rl">{GUIDANCE.map(([, t], i) => <li key={i}>{t}</li>)}</ul>
          <h3 className="rh3">Input review</h3>
          {r.validation.length ? <ul className="rl">{r.validation.map((v, i) => <li key={i}><b>{v.level === 'error' ? 'Error' : 'Review'}:</b> {v.msg}</li>)}</ul> : <p className="rp">All inputs within physical limits and typical ranges.</p>}
          <h3 className="rh3">References</h3>
          <ol className="rl">{REFS.map(([a, b]) => <li key={a}><b>{a}</b> — {b}</li>)}</ol>
          <p className="disc">Engineering results are dependent on the input data, assumptions, calculation methodology and applicable project criteria. The software does not replace project-specific engineering review. Visualisations use exaggerated vertical scale; buckling deformation in the simulation is exaggerated for clarity and is not FEA output.</p>
          <PageFoot />
        </section>

        {/* APPENDIX — TRACE */}
        {steps && (
          <section className="sheet">
            <H n={nApp}>Appendix — calculation trace</H>
            <p className="rp">{steps.count} steps in dependency order. Units: cm, kg, kg/cm², tonne-force unless stated.</p>
            {steps.groups.map((g) => (
              <div key={g.key} className="trace-g">
                <h3 className="rh3">{g.key}. {g.title}</h3>
                <table className="rt trace">
                  <tbody>{g.steps.map((s) => <tr key={s.id}><td className="l id">{s.id}</td><td className="l">{s.label}</td><td className="l f"><Tex>{s.formula}</Tex><br /><span>= <Tex>{s.subst}</Tex></span></td><td>{s.value == null ? '' : fmtAuto(s.value)}</td><td className="l u">{s.unit}</td></tr>)}</tbody>
                </table>
              </div>
            ))}
            <PageFoot />
          </section>
        )}
      </div>
    </div>
  );
}
