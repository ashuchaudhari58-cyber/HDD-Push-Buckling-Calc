import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, Kpi, fmt, Status, Card, Callout } from '../components/ui.jsx';
import { Simulation } from '../components/Simulation.jsx';
import { runProject, METHODS } from '../engine/index.js';

export default function Results() {
  const { project: p, results: r } = useStore();
  const other = p.method.key === 'S' ? 'C' : 'S';
  const alt = useMemo(() => { try { return runProject({ ...p, method: { ...p.method, key: other } }); } catch { return null; } }, [p, other]);
  const ov = r.overall;
  const kN = (t) => t * 9.80665;

  const exportCsv = () => {
    const lines = ['Section,Name,Length_m,Depth_m,Term,Value_t,Included'];
    r.push.sections.forEach((s) => s.terms.forEach((t) => lines.push([`L${s.n}`, s.name, (s.L / 100).toFixed(3), s.depth != null ? (s.depth / 100).toFixed(3) : '', t.label.replace(/,/g, ';'), t.value.toFixed(6), t.included ? 'yes' : 'no'].join(','))));
    r.push.sections.forEach((s) => lines.push([`L${s.n}`, s.name, '', '', 'Cumulative force', s.cum.toFixed(6), ''].join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `${p.meta.docNo || 'results'}_push_force.csv`; a.click();
  };

  return (
    <div className="page wide">
      <PageHead no="05" title="Push force results" lede="Engineering summary of the installation push force. Status is decided by the design criteria on the Validation page; every value comes from the same calculation that drives the steps, drawings and report.">
        <button className="btn" onClick={exportCsv}><Download size={15} /> Export CSV</button>
        <Link className="btn" to="/steps">Calculation steps <ArrowRight size={14} /></Link>
      </PageHead>

      <div className={`banner ${ov.state}`}>
        <span className="ico" style={{ fontSize: 20 }}>{ov.state === 'fail' ? '✕' : '✓'}</span>
        <div>
          <div className="t">{ov.title}</div>
          <div className="s">{ov.sub} · {p.meta.docNo} Rev {p.meta.revision} · {r.method.label}</div>
        </div>
        <div className="r">
          <span className="chip ok">✓ {r.checks.filter((c) => c.state === 'pass').length} passed</span>
          {r.checks.some((c) => c.state === 'warn') && <span className="chip warn">⚠ {r.checks.filter((c) => c.state === 'warn').length} review</span>}
          <span className={`chip ${ov.fail ? 'fail' : ''}`}>✕ {r.checks.filter((c) => c.state === 'fail').length} failed</span>
          <Link className="btn sm" to="/validation">Open validation <ArrowRight size={13} /></Link>
        </div>
      </div>

      <h2 className="sh">Key results</h2>
      <div className="grid g4">
        <Kpi hero k="Installation force" sym="F_{max}" v={fmt(r.Fmax, 2)} u="t" d={`${fmt(kN(r.Fmax), 1)} kN · maximum push at the rig`} />
        <Kpi k="Axial stress" sym="σ" v={fmt(r.stress.sigma, 1)} u="kg/cm²" d={`${fmt(r.stress.sigma * 0.0980665, 2)} MPa · allowable ${fmt(r.stress.allow, 1)}`} state={r.stress.ok ? 'pass' : 'fail'} foot={<Status state={r.stress.ok ? 'pass' : 'fail'} />} />
        <Kpi k="Utilisation" sym="σ / σ_{allow}" v={fmt(r.stress.util * 100, 1)} u="%" d={r.pipe.material === 'steel' ? `FoS vs SMYS ${fmt(r.stress.fosRef, 2)}` : `reserve factor ${fmt(r.stress.reserve, 2)}`} state={r.stress.ok ? 'pass' : 'fail'} />
        <Kpi k="Buckling criterion" sym={r.buck.criterion === 'gao' ? 'F_{sin,Gao}' : 'F_{DP}'} v={fmt(r.buck.Fsin, 2)} u="t" d={`SF ${fmt(r.buck.sf, 2)} · ${r.buck.regime === 'none' ? 'no buckling' : r.buck.regime === 'sinusoidal' ? 'sinusoidal regime' : 'helical lock-up'}`} state={r.buck.ok ? 'pass' : 'fail'} foot={<Status state={r.buck.ok ? 'pass' : 'fail'}>{r.buck.ok ? 'Below buckling load' : 'Buckling load exceeded'}</Status>} />
        <Kpi k="Helical lock-up load" sym="F_{hel}" v={fmt(r.buck.Fhel, 2)} u="t" d={r.buck.onsetHel != null ? `reached at ch. ${fmt(r.buck.onsetHel, 0)} m (interpolated)` : 'not reached'} state={r.Fmax < r.buck.Fhel ? 'pass' : 'fail'} />
        <Kpi k="HDD length" sym="L" v={fmt(r.totalLength, 1)} u="m" d={r.sectionsUsed.source === 'profile' ? 'from profile geometry' : 'manual section lengths'} />
        <Kpi k="Net submerged weight" sym="W_{net}" v={fmt(r.push.props.Wnet * 100, 2)} u="kg/m" d={r.push.props.Wnet < 0 ? 'buoyant — bears on the crown' : 'bears on the invert'} />
        {r.clamp
          ? <Kpi k="Required clamp force" sym="F_{clamp}" v={fmt(r.clamp.Freq, 0)} u="kN" d={`capacity ${fmt(r.clamp.Fcap, 0)} kN · wall ${fmt(r.clamp.pApplied, 2)} / ${fmt(r.clamp.pAllow, 2)} MPa`} state={r.clamp.overallOk ? 'pass' : 'fail'} />
          : <Kpi k="Thruster clamp" v="—" d="check not included" />}
      </div>

      <h2 className="sh">Installation simulation <small>pipe pushed from the rig side along the calculated profile</small></h2>
      <Simulation r={r} waterLevel={p.profile.waterLevel} />
      <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Visualisation scale: vertical axis exaggerated; the buckling wave (if shown) is exaggerated for clarity and is not an FEA deformation. HUD values are the calculated forces, interpolated linearly between section boundaries.</div>

      <h2 className="sh">Installation force by section <small>{r.method.label} · {r.method.source}</small></h2>
      <div className="tbl-wrap">
        <table className="t">
          <thead><tr><th className="l">Section</th><th>Length, m</th><th>Depth, m</th><th className="l">Resistance contributions, t</th><th>Section force, t</th><th>Cumulative, t</th><th>Chainage end, m</th></tr></thead>
          <tbody>
            {r.push.sections.map((s, i) => (
              <tr key={s.n}>
                <td className="l"><b>L{s.n}</b> · {s.name}{s.R ? <span className="muted"> · R {fmt(s.R, 0)} m</span> : null}</td>
                <td>{fmt(s.L / 100, 2)}</td>
                <td>{s.depth != null ? fmt(s.depth / 100, 2) : '—'}</td>
                <td className="l wrap" style={{ fontSize: 12 }}>
                  {s.terms.map((t) => <span key={t.key} style={{ marginRight: 12, whiteSpace: 'nowrap', opacity: t.included ? 1 : 0.55 }} title={t.note}>{t.label} <b className="num">{fmt(t.value, 3)}</b>{!t.included && ' (not added)'}</span>)}
                </td>
                <td>{fmt(s.net, 3)}</td>
                <td><b>{fmt(s.cum, 3)}</b></td>
                <td>{fmt(r.forceProfile[i + 1].s, 1)}</td>
              </tr>
            ))}
            <tr className="tot"><td className="l" colSpan={4}>Maximum installation force F<sub>max</sub> {r.method.key === 'C' ? '(max of carried tensions)' : '(end of crossing)'}</td><td /><td>{fmt(r.Fmax, 3)} t</td><td>{fmt(kN(r.Fmax), 1)} kN</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Method comparison" sub="same inputs, both TESPL methods">
          {alt ? (
            <table className="t">
              <thead><tr><th className="l">Quantity</th><th>Method {p.method.key} (selected)</th><th>Method {other}</th></tr></thead>
              <tbody>
                <tr><td className="l">Installation force, t</td><td><b>{fmt(r.Fmax, 2)}</b></td><td>{fmt(alt.Fmax, 2)}</td></tr>
                <tr><td className="l">Axial utilisation, %</td><td>{fmt(r.stress.util * 100, 1)}</td><td>{fmt(alt.stress.util * 100, 1)}</td></tr>
                <tr><td className="l">Buckling criterion load, t</td><td>{fmt(r.buck.Fsin, 2)}</td><td>{fmt(alt.buck.Fsin, 2)}</td></tr>
                <tr><td className="l">Buckling SF</td><td>{fmt(r.buck.sf, 2)}</td><td>{fmt(alt.buck.sf, 2)}</td></tr>
                <tr><td className="l">Overall</td><td><Status state={r.overall.state}>{r.overall.title.replace('DESIGN ', '')}</Status></td><td><Status state={alt.overall.state}>{alt.overall.title.replace('DESIGN ', '')}</Status></td></tr>
              </tbody>
            </table>
          ) : <div className="muted">—</div>}
          <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Method {other}: {METHODS[other].desc} Buckling settings on "Method default" follow each method's own workbook convention.</div>
        </Card>
        <Card title="Reading the result">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-2)', display: 'grid', gap: 6 }}>
            <li><b>Calculated result</b> — the installation force is accumulated section by section in the push direction, from the rig (entry) to the exit.</li>
            <li><b>Assumption</b> — force between section boundaries is shown linearly interpolated; the workbooks report forces only at section ends.</li>
            <li><b>Criterion</b> — axial stress ≤ {fmt(r.pipe.allowFactor, 2)} × {r.pipe.mat.strengthLabel}; push force below the {r.buck.criterion === 'gao' ? 'Gao sinusoidal' : 'Dawson–Paslay sinusoidal'} buckling load.</li>
            <li><b>Guidance</b> — long crossings with high push forces are normally installed by pull-back or with pull-back assistance; this is engineering guidance, not a calculated result.</li>
          </ul>
        </Card>
      </div>
      {r.validation.some((v) => v.level === 'warn') && <div style={{ marginTop: 16 }}><Callout kind="warn">Some inputs are outside typical ranges — see Validation before relying on this result.</Callout></div>}
    </div>
  );
}
