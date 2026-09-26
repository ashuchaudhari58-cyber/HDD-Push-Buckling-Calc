import { Link } from 'react-router-dom';
import { useStore } from '../state/store.jsx';
import { PageHead, StatusIcon, Status, fmt, Callout, Meter } from '../components/ui.jsx';

export default function Validation() {
  const { results: r } = useStore();
  const ov = r.overall;
  const crit = r.checks.filter((c) => c.kind === 'criterion');
  const guide = r.checks.filter((c) => c.kind === 'guidance');
  const Row = ({ c }) => (
    <div className="chk">
      <span className={`ic ${c.state}`}><StatusIcon state={c.state} /></span>
      <div className="lbl"><b>{c.label}</b><small>{c.group} · {c.basis}</small>{c.detail && <small style={{ display: 'block' }}>{c.detail}</small>}</div>
      <div className="vv">{c.value}</div>
      <div className="vv muted">{c.limit}</div>
      <div>
        <Status state={c.state}>{c.state === 'pass' ? (c.kind === 'guidance' ? 'Meets guidance' : 'Within limit') : c.state === 'warn' ? 'Review' : 'Exceeded'}</Status>
        {c.ratio != null && isFinite(c.ratio) && <div style={{ marginTop: 5 }}><Meter value={c.ratio} max={Math.max(1.2, c.ratio)} limit={1} state={c.state === 'fail' ? 'fail' : ''} /></div>}
      </div>
    </div>
  );
  return (
    <div className="page wide">
      <PageHead no="08" title="Validation" lede="Design criteria decide the overall status. Engineering guidance items are advisory — they are flagged for review but never make the design “not acceptable” on their own. Input validation checks physical limits (errors) and typical ranges (warnings)." />
      <div className={`banner ${ov.state}`}>
        <span className="ico" style={{ fontSize: 20 }}>{ov.state === 'fail' ? '✕' : '✓'}</span>
        <div><div className="t">{ov.title}</div><div className="s">{ov.sub}</div></div>
      </div>

      <h2 className="sh">Design criteria <small>{crit.filter((c) => c.state === 'pass').length} of {crit.length} met</small></h2>
      <div className="card">{crit.map((c) => <Row key={c.key} c={c} />)}</div>

      <h2 className="sh">Engineering guidance <small>advisory</small></h2>
      <div className="card">{guide.map((c) => <Row key={c.key} c={c} />)}</div>

      <h2 className="sh">Input validation <small>{r.validation.length ? `${r.validation.length} item(s)` : 'all inputs valid'}</small></h2>
      {r.validation.length === 0 ? <Callout kind="ok">All inputs are within physical limits and typical engineering ranges.</Callout> : (
        <div className="card">
          {r.validation.map((v, i) => (
            <div key={i} className="chk" style={{ gridTemplateColumns: '26px minmax(0, 1fr) 160px' }}>
              <span className={`ic ${v.level === 'error' ? 'fail' : 'warn'}`}><StatusIcon state={v.level === 'error' ? 'fail' : 'warn'} /></span>
              <div className="lbl"><b>{v.level === 'error' ? 'Input requires attention' : 'Unusual value — review'}</b><small style={{ display: 'block' }}>{v.msg}</small></div>
              <div><Link className="btn xs" to={`/inputs#sec-${v.field.split('.')[0]}`}>Go to input →</Link></div>
            </div>
          ))}
        </div>
      )}

      <h2 className="sh">Analysis readiness</h2>
      <div className="card pad">
        <div className="grid g3">
          {[
            ['Project information', !!r && true, 'Name and document number set'],
            ['Pipe & material', !r.validation.some((v) => v.field.startsWith('pipe.') && v.level === 'error'), `${r.pipe.gradeLabel} · ${fmt(r.pipe.ODmm, 1)} mm`],
            ['Drilling fluid & soil', !r.validation.some((v) => v.field.startsWith('mud.') && v.level === 'error'), `μ ${fmt(r.x.mu, 2)} · ρ ${fmt(r.x.rhoMud * 1e6, 0)} kg/m³`],
            ['Profile geometry', r.prof.feasible, r.prof.feasible ? `L = ${fmt(r.prof.total, 1)} m` : 'infeasible'],
            ['Installation method', true, r.method.short],
            ['Thruster clamp', !r.clamp || r.clamp.overallOk, r.clamp ? (r.clamp.overallOk ? 'within limits' : 'check fails') : 'not included'],
          ].map(([t, ok, d]) => (
            <div key={t} className="row" style={{ gap: 10 }}>
              <span className={`st ${ok ? 'pass' : 'warn'}`}><StatusIcon state={ok ? 'pass' : 'warn'} /></span>
              <div><b style={{ fontSize: 13 }}>{t}</b><div className="muted" style={{ fontSize: 12 }}>{d}</div></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          {r.validation.some((v) => v.level === 'error')
            ? <Status state="fail">{r.validation.filter((v) => v.level === 'error').length} input(s) require attention</Status>
            : <Status state="pass">Ready — calculation is live</Status>}
        </div>
      </div>
    </div>
  );
}
