import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, Kpi, fmt, Status, Card, Callout, Toggle } from '../components/ui.jsx';
import { asset } from '../lib/asset.js';

export default function Clamp() {
  const { project: p, results: r } = useStore();
  const c = r.clamp;
  return (
    <div className="page wide">
      <PageHead no="07" title="Thruster & clamp" lede="Can the pipe thruster push the pipe alone? The clamp must grip hard enough to transmit the push force by friction, the thruster must be able to apply that grip, and the pipe wall must survive the clamp pressure (HDPE_Push_Clamp_Calc_V1 → Clamp_Check).">
        <Link className="btn" to="/inputs#sec-clamp"><SlidersHorizontal size={15} /> Edit clamp inputs</Link>
      </PageHead>

      {!c ? (
        <div className="card pad">
          <p className="muted" style={{ marginTop: 0 }}>The thruster clamp check is not included in this project.</p>
          <Toggle path="clamp.enabled" label="Include thruster clamp check" />
        </div>
      ) : (
        <>
          <div className={`banner ${c.overallOk ? 'pass' : 'fail'}`}>
            <span className="ico" style={{ fontSize: 20 }}>{c.overallOk ? '✓' : '✕'}</span>
            <div>
              <div className="t">{c.overallOk ? 'YES — thruster-alone push feasible' : 'NO — assistance required'}</div>
              <div className="s">{c.overallOk ? 'Grip capacity and pipe-wall pressure are both within limits.' : `${!c.capacityOk ? 'Thruster clamp capacity is insufficient. ' : ''}${!c.wallOk ? 'Clamp pressure exceeds the pipe-wall limit. ' : ''}Increase pad area / pressure, or share the load with a winch / pull-back assist.`}</div>
            </div>
          </div>

          <div className="grid g4" style={{ marginTop: 16 }}>
            <Kpi hero k="Peak push force" sym="F_{push}" v={fmt(c.Fpush, 1)} u="kN" d={`${fmt(r.Fmax, 2)} t × 9.81`} />
            <Kpi k="Required clamp force" sym="F_{clamp}" v={fmt(c.Freq, 1)} u="kN" d={`× SF ${fmt(+p.clamp.sf, 2)} ÷ μ_grip ${fmt(+p.clamp.muGrip, 2)}`} />
            <Kpi k="Clamp capacity" sym="F_{cap}" v={fmt(c.Fcap, 1)} u="kN" d={`${fmt(+p.clamp.pMax, 2)} MPa × ${fmt(c.Apad, 0)} cm²`} state={c.capacityOk ? 'pass' : 'fail'} foot={<Status state={c.capacityOk ? 'pass' : 'fail'}>{fmt(c.capacityRatio * 100, 0)} % of capacity</Status>} />
            <Kpi k="Clamp pressure on wall" sym="p" v={fmt(c.pApplied, 3)} u="MPa" d={`limit ${fmt(c.pAllow, 3)} MPa = 2σ/(SDR−1)`} state={c.wallOk ? 'pass' : 'fail'} foot={<Status state={c.wallOk ? 'pass' : 'fail'}>{fmt(c.wallRatio * 100, 0)} % of limit</Status>} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', marginTop: 18 }}>
            <Card title="Clamp check" pad={false}>
              <table className="t">
                <thead><tr><th className="l">Parameter</th><th>Value</th><th className="l">Unit</th><th className="l">Formula / note</th></tr></thead>
                <tbody>
                  <tr><td className="l">Peak push force</td><td>{fmt(c.Fpush, 2)}</td><td className="l">kN</td><td className="l">F<sub>max</sub> × 9.81</td></tr>
                  <tr><td className="l">Push demand safety factor</td><td>{fmt(+p.clamp.sf, 2)}</td><td className="l">—</td><td className="l">input</td></tr>
                  <tr><td className="l">Grip friction, pad / pipe</td><td>{fmt(+p.clamp.muGrip, 2)}</td><td className="l">—</td><td className="l">input</td></tr>
                  <tr className="hl"><td className="l"><b>Required clamp (normal) force</b></td><td><b>{fmt(c.Freq, 2)}</b></td><td className="l">kN</td><td className="l">F<sub>push</sub> · SF / μ<sub>grip</sub></td></tr>
                  <tr><td className="l">Pads × length × width</td><td>{fmt(+p.clamp.pads, 0)} × {fmt(+p.clamp.padLength, 0)} × {fmt(+p.clamp.padWidth, 0)}</td><td className="l">cm</td><td className="l">input</td></tr>
                  <tr><td className="l">Total pad contact area</td><td>{fmt(c.Apad, 0)}</td><td className="l">cm²</td><td className="l">n · L · W</td></tr>
                  <tr className={c.capacityOk ? 'hl' : 'bad'}><td className="l"><b>Clamp force capacity</b></td><td><b>{fmt(c.Fcap, 2)}</b></td><td className="l">kN</td><td className="l">p<sub>max</sub> · A · 0.1</td></tr>
                  <tr><td className="l">Dimension ratio</td><td>{fmt(c.SDR, 2)}</td><td className="l">—</td><td className="l">D / t</td></tr>
                  <tr><td className="l">Allowable wall bearing stress</td><td>{fmt(c.sigmaBearing, 2)}</td><td className="l">MPa</td><td className="l">{p.clamp.bearingMode === 'custom' ? 'input' : '= allowable axial stress'}</td></tr>
                  <tr><td className="l">Allowable clamp pressure</td><td>{fmt(c.pAllow, 3)}</td><td className="l">MPa</td><td className="l">2σ / (SDR − 1)</td></tr>
                  <tr className={c.wallOk ? 'hl' : 'bad'}><td className="l"><b>Clamp pressure applied</b></td><td><b>{fmt(c.pApplied, 3)}</b></td><td className="l">MPa</td><td className="l">F<sub>clamp</sub> / (A · 0.1)</td></tr>
                </tbody>
              </table>
            </Card>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="photo-band" style={{ backgroundImage: `url(${asset('images/pipe-thruster.webp')})`, padding: 18, minHeight: 160 }}>
                <div className="eyebrow" style={{ color: '#cfcac2' }}>What would make it work?</div>
                <ul style={{ color: '#e7e3dc', fontSize: 12.5, paddingLeft: 18, margin: '10px 0 0', display: 'grid', gap: 5 }}>
                  <li>Clamp pressure needed with the present pads: <b className="num">{fmt(c.pRequiredForDemand, 3)} MPa</b></li>
                  <li>Pad area needed to respect the wall limit: <b className="num">{fmt(c.padAreaForWall, 0)} cm²</b> ({fmt(c.padAreaForWall / Math.max(1, +p.clamp.padLength * +p.clamp.padWidth), 1)} pads of the present size)</li>
                  <li>Or reduce the grip demand with winch / pull-back assistance.</li>
                </ul>
              </div>
              <Callout kind="brand">For thin-wall HDPE (high SDR) the wall-pressure limit, not the push magnitude, is usually the binding constraint on thruster-alone installation (V1 note).</Callout>
              <Callout>Sample thruster values (pads, pressure, grip friction) must be replaced with the machine specification and pad data.</Callout>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
