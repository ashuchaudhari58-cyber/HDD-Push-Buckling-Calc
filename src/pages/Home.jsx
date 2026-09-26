import { useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FilePlus2, Upload, ShieldCheck, Check, X, FlaskConical } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { Kpi, fmt, Status, Callout } from '../components/ui.jsx';
import { ProfileSVG } from '../components/drawings.jsx';
import { asset } from '../lib/asset.js';
import { PRESETS, newProject } from '../engine/presets.js';
import { runProject } from '../engine/index.js';
import { MATERIALS } from '../engine/materials.js';
import { CROSSING_TYPES } from '../engine/profile.js';

const WF = [
  { to: '/project', n: '01', t: 'Project & revisions', d: 'Project name, location, document number, sign-off and revision history.', img: 'images/pipe-string-sm.webp' },
  { to: '/inputs', n: '02', t: 'Design inputs', d: 'Pipe material & grade, drilling fluid, crossing profile, method, buckling and thruster data.', img: 'images/pipe-yard-sm.webp' },
  { to: '/profile', n: '03', t: 'Profile geometry', d: 'Tangents, curves and bottom run from angles, radii and depth — setbacks and cover check.', img: 'images/river-crossing-sm.webp' },
  { to: '/steps', n: '04', t: 'Calculation steps', d: 'Every formula with substituted values — a complete audit trail of the push force.', img: 'images/drill-pipe-sm.webp' },
  { to: '/results', n: '05', t: 'Push force results', d: 'Installation force, force vs chainage and the live installation simulation.', img: 'images/hdd-pullback-sm.webp' },
  { to: '/structural', n: '06', t: 'Stress & buckling', d: 'Axial stress utilisation and sinusoidal / helical buckling in the bore.', img: 'images/steel-pipe-sm.webp' },
  { to: '/clamp', n: '07', t: 'Thruster & clamp', d: 'Required clamp force, thruster grip capacity and pipe-wall crush limit.', img: 'images/pipe-thruster-sm.webp' },
  { to: '/report', n: '10', t: 'Report / PDF', d: 'Engineering calculation report with cover page, tables, drawings and sign-off.', img: 'images/pipe-string-sm.webp' },
];

export default function Home() {
  const st = useStore();
  const { project: p, results: r, library } = st;
  const nav = useNavigate();
  const fileRef = useRef();

  // live self-check: re-run each verification preset and compare with the workbook value
  const parity = useMemo(() => PRESETS.filter((x) => x.expect).map((x) => {
    const res = runProject(newProject(x.key));
    const got = res.Fmax;
    const rel = Math.abs(got - x.expect.total) / x.expect.total;
    return { key: x.key, title: x.title, got, exp: x.expect.total, ok: rel < 1e-9 };
  }), []);
  const nOk = parity.filter((q) => q.ok).length;

  const ov = r.overall;
  const crossing = CROSSING_TYPES.find((c) => c.key === p.profile.type)?.label;

  return (
    <div className="page wide">
      <section className="hero" style={{ backgroundImage: `url(${asset('images/hdd-rig-site.webp')})` }}>
        <div className="in">
          <div className="eyebrow"><b>Design studio</b> · HDD pipe push installation · steel & HDPE</div>
          <h1>HDD Push &amp; Buckling Studio</h1>
          <p>Profile geometry, installation push force, axial stress, constrained buckling and thruster clamp checks — one calculation model, reproducing the TESPL workbooks, with a full step-by-step audit trail and a printable engineering report.</p>
          <div className="acts">
            <button className="btn primary" onClick={() => nav('/results')}><ArrowRight size={15} /> Continue {p.meta.docNo} · Rev {p.meta.revision}</button>
            <button className="btn" onClick={() => nav('/projects')}><FilePlus2 size={15} /> New project</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import project file</button>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) st.importFile(f); e.target.value = ''; }} />
          </div>
          <div className="row" style={{ marginTop: 16, gap: 8 }}>
            <span className={`chip ${nOk === parity.length ? 'ok' : 'fail'}`}><ShieldCheck size={12} /> Engine parity {nOk}/{parity.length} workbook cases</span>
            <span className="chip">Steel API 5L · HDPE PE80 / PE100</span>
            <span className="chip">2 push-force methods</span>
          </div>
        </div>
        <img className="hero-logo" src={asset('brand/logo.webp')} alt="HDD Push / Pull Force and Buckling Calculator" />
        <span className="credit">Photo: see Image credits</span>
      </section>

      <h2 className="sh">Current project <small>working copy in this browser{st.dirty ? ' · unsaved changes' : ''}</small></h2>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
        <div className="card pad">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow">{p.meta.docNo} · Rev {p.meta.revision} · {p.meta.status}</div>
              <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 2px' }}>{p.meta.name}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{[p.meta.client, p.meta.location, p.meta.feature].filter(Boolean).join(' · ') || 'Add client, location and crossing on the Project page'}</div>
            </div>
            <div className={`banner ${ov.state}`} style={{ padding: '10px 14px', gap: 10 }}>
              <span className={`st ${ov.state}`}>{ov.state === 'fail' ? <X size={18} /> : <Check size={18} />}</span>
              <div><div className="t" style={{ fontSize: 13 }}>{ov.title}</div><div className="s" style={{ fontSize: 11.5 }}>{ov.sub}</div></div>
            </div>
          </div>
          <div className="grid g4" style={{ marginTop: 14 }}>
            <Kpi k="Installation force" sym="F_{max}" v={fmt(r.Fmax, 2)} u="t" d={`${fmt(r.Fmax * 9.80665, 1)} kN`} state={r.buck.ok && r.stress.ok ? 'pass' : 'fail'} />
            <Kpi k="Axial utilisation" sym="σ/σ_{allow}" v={fmt(r.stress.util * 100, 1)} u="%" d={`${fmt(r.stress.sigma, 1)} kg/cm²`} state={r.stress.ok ? 'pass' : 'fail'} />
            <Kpi k="Buckling SF" sym="F_{sin}/F" v={fmt(r.buck.sf, 2)} d={r.buck.regime === 'none' ? 'No buckling' : r.buck.regime === 'sinusoidal' ? 'Sinusoidal regime' : 'Helical lock-up'} state={r.buck.ok ? 'pass' : 'fail'} />
            <Kpi k="HDD length" sym="L" v={fmt(r.totalLength, 1)} u="m" d={`${crossing} · ${r.sectionsUsed.source === 'profile' ? 'from profile' : 'manual sections'}`} />
          </div>
          <div className="row" style={{ marginTop: 14, fontSize: 12.5 }}>
            <span className="chip brand">{MATERIALS[p.pipe.material].short}</span>
            <span className="dim2">{r.pipe.gradeLabel} · {r.pipe.odLabel}</span>
            <span className="muted">·</span>
            <span className="dim2">{r.method.short}</span>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <Link className="btn sm" to="/inputs">Edit inputs</Link>
            <Link className="btn sm" to="/results">Results</Link>
            <Link className="btn sm" to="/steps">Calculation steps</Link>
            <Link className="btn sm" to="/report">Report / PDF</Link>
          </div>
        </div>
        <div>
          <ProfileSVG r={r} height={300} showDims={false} id="homeprof" waterLevel={p.profile.waterLevel} />
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{crossing} · {fmt(r.prof.inputs.entryAng, 1)}° / {fmt(r.prof.inputs.exitAng, 1)}° · R {fmt(r.prof.inputs.Ren, 0)} m · plan distance {fmt(r.prof.nodes.F.x, 1)} m</div>
        </div>
      </div>

      <h2 className="sh">Engineering workflow <small>one calculation model drives every page</small></h2>
      <div className="grid g4">
        {WF.map((w) => (
          <Link key={w.to} to={w.to} className="wf-card">
            <div className="ph" style={{ backgroundImage: `url(${asset(w.img)})` }}><span className="n">{w.n}</span></div>
            <div className="bd"><b>{w.t}</b><small>{w.d}</small></div>
          </Link>
        ))}
      </div>

      <div className="grid g2" style={{ marginTop: 26 }}>
        <div className="card">
          <div className="card-h"><FlaskConical size={15} /><h3>Engine verification</h3><span className="sub">re-run live on page load</span></div>
          <div className="card-b" style={{ padding: 0 }}>
            <table className="t">
              <thead><tr><th className="l">Reference case</th><th>Workbook</th><th>This app</th><th className="c">Match</th></tr></thead>
              <tbody>
                {parity.map((q) => (
                  <tr key={q.key}>
                    <td className="l">{q.title}</td>
                    <td>{fmt(q.exp, 3)} t</td>
                    <td>{fmt(q.got, 3)} t</td>
                    <td className="c">{q.ok ? <Status state="pass">match</Status> : <Status state="fail">differs</Status>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-b" style={{ borderTop: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--text-muted)' }}>
            Load any reference case from <Link to="/projects">Saved projects → Templates</Link> to inspect it. The full regression suite (every intermediate cell) runs with <span className="mono">npm test</span>.
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Saved projects</h3><span className="sub">in this browser</span><div className="r"><Link className="btn xs" to="/projects">Open library</Link></div></div>
          <div className="card-b" style={{ padding: 0 }}>
            {library.length === 0 ? <div className="empty">No saved projects yet. Use <b>Save</b> (Ctrl+S) to keep this project.</div> : (
              <table className="t">
                <thead><tr><th className="l">Project</th><th className="l">Doc / Rev</th><th>Force</th><th className="c">Status</th></tr></thead>
                <tbody>
                  {library.slice(0, 6).map((e) => (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => st.open(e.id)}>
                      <td className="l">{e.project.meta.name}</td>
                      <td className="l mono">{e.project.meta.docNo} · {e.project.meta.revision}</td>
                      <td>{e.summary?.force != null ? `${fmt(e.summary.force, 2)} t` : '—'}</td>
                      <td className="c">{e.summary?.overall ? <Status state={e.summary.overall}>{e.summary.overall === 'fail' ? 'Not acc.' : 'OK'}</Status> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <Callout kind="brand">Engineering results depend on the input data, assumptions, calculation methodology and applicable project criteria. The software does not replace project-specific engineering review.</Callout>
      </div>
    </div>
  );
}
