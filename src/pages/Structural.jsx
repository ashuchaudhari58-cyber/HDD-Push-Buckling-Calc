import { useStore } from '../state/store.jsx';
import { PageHead, fmt, Status, Card, Meter, Callout, Tex } from '../components/ui.jsx';
import { Gauge, ForceChart } from '../components/drawings.jsx';
import { asset } from '../lib/asset.js';

export default function Structural() {
  const { results: r } = useStore();
  const S = r.stress, B = r.buck;
  const bars = [
    { k: 'Dawson–Paslay sinusoidal', sym: 'F_{DP}', v: B.Fdp, basis: 'Dawson & Paslay (1984)', crit: B.criterion === 'dp' },
    { k: 'Gao sinusoidal (with friction)', sym: 'F_{sin}', v: B.Fgao, basis: 'Gao et al. (2010) · β_crs', crit: B.criterion === 'gao' },
    { k: 'Gao helical (lock-up)', sym: 'F_{hel}', v: B.Fhel, basis: 'Gao et al. (2010) · β_crh', crit: false },
  ];
  const vmax = Math.max(r.Fmax, ...bars.map((b) => b.v)) * 1.1;

  return (
    <div className="page wide">
      <PageHead no="06" title="Stress & buckling" lede="Structural assessment of the pipe under the installation push force: axial stress in the pipe wall, and constrained buckling of the pipe as a column inside the bore." />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <Card title="Structural assessment">
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <Status state={S.ok ? 'pass' : 'fail'}>Axial strength</Status>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{S.ok ? 'Within the evaluated limit' : 'Limit exceeded'}</div>
              <div className="dim2" style={{ fontSize: 12.5 }}>σ = {fmt(S.sigma, 1)} kg/cm² vs σ<sub>allow</sub> = {fmt(S.allow, 1)} kg/cm² ({fmt(S.util * 100, 1)} % utilised)</div>
            </div>
            <div>
              <Status state={B.ok ? 'pass' : 'fail'}>Buckling</Status>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{B.ok ? 'Below the buckling load' : 'Buckling load exceeded'}</div>
              <div className="dim2" style={{ fontSize: 12.5 }}>F<sub>max</sub> = {fmt(r.Fmax, 2)} t vs {B.criterion === 'gao' ? 'Gao sinusoidal' : 'Dawson–Paslay sinusoidal'} {fmt(B.Fsin, 2)} t (SF {fmt(B.sf, 2)})</div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
              <div className="eyebrow">Governing condition</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }} className={B.regime === 'none' && S.ok ? 'ok-t' : 'fail-t'}>
                {B.regime === 'helical' ? 'Helical buckling / lock-up' : B.regime === 'sinusoidal' ? 'Sinusoidal (lateral) buckling' : !S.ok ? 'Axial over-stress' : S.util > r.Fmax / B.Fsin ? 'Axial stress' : 'Buckling margin'}
              </div>
              <div className="dim2" style={{ fontSize: 12.5, marginTop: 4 }}>
                Installation force {fmt(r.Fmax, 2)} t · evaluated buckling capacity {fmt(B.Fsin, 2)} t · force at allowable stress {fmt(S.Fallow, 2)} t
              </div>
              {(!S.ok || !B.ok) && <div style={{ marginTop: 8 }}><Callout kind="fail">Review required — the calculated condition exceeds an evaluated criterion.</Callout></div>}
            </div>
          </div>
        </Card>
        <div className="photo-band" style={{ backgroundImage: `url(${asset('images/steel-pipe.webp')})`, padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', color: '#f5f5f4' }}>
            <div className="eyebrow" style={{ color: '#cfcac2' }}>Axial stress utilisation</div>
            <div style={{ fontSize: 13, color: '#d6d1c8', marginTop: 6 }}>{r.pipe.gradeLabel} · {r.pipe.odLabel}</div>
            <div style={{ fontSize: 13, color: '#d6d1c8', marginTop: 4 }}>A<sub>s</sub> = {fmt(S.As, 2)} cm² · {r.pipe.mat.strengthLabel} = {fmt(r.pipe.strengthKg, 1)} kg/cm²</div>
          </div>
          <div style={{ background: 'rgba(15,15,16,.72)', borderRadius: 12, padding: '10px 14px' }}>
            <Gauge value={S.util} sub="σ / σ_allow" state={S.ok ? 'pass' : 'fail'} />
          </div>
        </div>
      </div>

      <h2 className="sh">Axial stress check <small>σ = F<sub>max</sub> / A<sub>s</sub> ≤ {fmt(r.pipe.allowFactor, 2)} × {r.pipe.mat.strengthLabel}</small></h2>
      <div className="tbl-wrap">
        <table className="t">
          <thead><tr><th className="l">Check</th><th>Value</th><th className="l">Unit</th><th className="l">Limit / remark</th></tr></thead>
          <tbody>
            <tr><td className="l">Maximum installation force</td><td>{fmt(r.Fmax, 3)}</td><td className="l">t</td><td className="l">{fmt(r.Fmax * 9.80665, 1)} kN</td></tr>
            <tr><td className="l">Steel / wall cross-sectional area</td><td>{fmt(S.As, 3)}</td><td className="l">cm²</td><td className="l">A<sub>o</sub> − A<sub>i</sub></td></tr>
            <tr><td className="l">Applied axial stress</td><td>{fmt(S.sigma, 1)}</td><td className="l">kg/cm²</td><td className="l">{fmt(S.sigma * 0.0980665, 2)} MPa</td></tr>
            <tr><td className="l">Allowable stress</td><td>{fmt(S.allow, 1)}</td><td className="l">kg/cm²</td><td className="l">{fmt(r.pipe.allowFactor, 2)} × {fmt(r.pipe.strengthKg, 1)} kg/cm²</td></tr>
            <tr className={S.ok ? 'hl' : 'bad'}><td className="l"><b>Utilisation</b></td><td><b>{fmt(S.util * 100, 1)}</b></td><td className="l">%</td><td className="l"><Status state={S.ok ? 'pass' : 'fail'} /></td></tr>
            <tr><td className="l">Factor of safety vs {r.pipe.mat.strengthLabel}</td><td>{fmt(S.fosRef, 2)}</td><td className="l">—</td><td className="l">{r.pipe.mat.strengthLabel} ÷ applied stress</td></tr>
            <tr><td className="l">Push force at the allowable stress</td><td>{fmt(S.Fallow, 2)}</td><td className="l">t</td><td className="l">capacity of the section in axial stress</td></tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10 }}><Meter value={S.util} max={Math.max(1.2, S.util * 1.05)} limit={1} state={S.ok ? '' : 'fail'} /></div>

      <h2 className="sh">Buckling check <small>pipe constrained by the bore wall · w = {fmt(B.w, 4)} kg/cm ({B.weight === 'air' ? 'in air' : 'effective'}) · α = {fmt(90 - B.refAng, 1)}° · r<sub>c</sub> = {fmt(B.clearance, 2)} cm · μ<sub>b</sub> = {fmt(B.muB, 3)}</small></h2>
      <div className="card pad">
        <div style={{ display: 'grid', gap: 14 }}>
          {bars.map((b) => {
            const ok = r.Fmax < b.v;
            return (
              <div key={b.k} style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr) 150px', gap: 14, alignItems: 'center' }}>
                <div><b style={{ fontSize: 13 }}>{b.k}</b> {b.crit && <span className="chip brand" style={{ marginLeft: 6 }}>criterion</span>}<div className="muted" style={{ fontSize: 11.5 }}><Tex>{b.sym}</Tex> · {b.basis}</div></div>
                <div style={{ position: 'relative', height: 22, background: 'var(--surface-3)', borderRadius: 6 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(b.v / vmax) * 100}%`, background: ok ? 'var(--ok-wash)' : 'var(--fail-wash)', border: `1px solid ${ok ? 'var(--ok-line)' : 'var(--fail-line)'}`, borderRadius: 6 }} />
                  <div style={{ position: 'absolute', top: -4, bottom: -4, left: `${(r.Fmax / vmax) * 100}%`, width: 3, background: 'var(--brand)', borderRadius: 2 }} title="Installation force" />
                </div>
                <div style={{ textAlign: 'right' }}><b className="num">{fmt(b.v, 2)} t</b><div><Status state={ok ? 'pass' : 'fail'}>{ok ? `SF ${fmt(b.v / r.Fmax, 2)}` : 'exceeded'}</Status></div></div>
              </div>
            );
          })}
          <div className="muted" style={{ fontSize: 11.5 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--brand)', borderRadius: 2, marginRight: 6 }} />Installation force F<sub>max</sub> = {fmt(r.Fmax, 2)} t</div>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Buckling coefficients">
          <table className="t">
            <tbody>
              <tr><td className="l">Second moment of area I</td><td>{fmt(B.I, 1)} cm⁴</td></tr>
              <tr><td className="l">P<sub>crs</sub> = 1 + 0.193 μ<sub>b</sub><sup>0.67</sup></td><td>{fmt(B.Pcrs, 5)}</td></tr>
              <tr><td className="l">A<sub>crs</sub> = 0.774 μ<sub>b</sub><sup>0.33</sup> − 0.371 μ<sub>b</sub></td><td>{fmt(B.Acrs, 5)}</td></tr>
              <tr><td className="l">β<sub>crs</sub> (sinusoidal friction factor)</td><td>{fmt(B.Bcrs, 5)}</td></tr>
              <tr><td className="l">β<sub>crh</sub> (helical friction factor)</td><td>{fmt(B.Bcrh, 5)}</td></tr>
            </tbody>
          </table>
        </Card>
        <Card title="Where along the drive?" sub="interpolated between section ends">
          <table className="t">
            <tbody>
              <tr><td className="l">Push force reaches the sinusoidal criterion</td><td>{B.onsetSin != null ? `ch. ${fmt(B.onsetSin, 1)} m` : 'not reached'}</td></tr>
              <tr><td className="l">Push force reaches helical lock-up</td><td>{B.onsetHel != null ? `ch. ${fmt(B.onsetHel, 1)} m` : 'not reached'}</td></tr>
              <tr><td className="l">Total length along the bore</td><td>{fmt(r.totalLength, 1)} m</td></tr>
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>In a pushed installation the compressive force is highest at the thrust (rig) end, so buckling develops near the entry first.</div>
        </Card>
      </div>

      <h2 className="sh">Force vs buckling limits</h2>
      <ForceChart r={r} height={280} id="stfc" />
      <div style={{ marginTop: 16 }}><Callout>Buckling loads assume the pipe is laterally supported by the bore wall. The sinusoidal load marks the onset of lateral snaking; the helical load marks lock-up. Long crossings with high compressive push forces are typically installed by pull-back instead — this is engineering guidance, not a calculated result.</Callout></div>
    </div>
  );
}
