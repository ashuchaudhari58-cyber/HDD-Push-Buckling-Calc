import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, Kpi, fmt, Status, Callout, Card } from '../components/ui.jsx';
import { ProfileSVG } from '../components/drawings.jsx';
import { stationTable } from '../engine/profile.js';
import { CROSSING_TYPES } from '../engine/profile.js';
import { asset } from '../lib/asset.js';

export default function ProfilePage() {
  const { project: p, results: r } = useStore();
  const g = r.prof;
  const obs = g.obstacle;
  const datum = g.datum || 0;
  const rows = useMemo(() => stationTable(g, Math.max(1, +p.profile.stationStep || 10), datum), [g, p.profile.stationStep, datum]);
  const segNames = ['AB · Entry tangent', 'BC · Entry curve', 'CD · Bottom run', 'DE · Exit curve', 'EF · Exit tangent'];
  const chainAt = [0];
  g.lengths.forEach((v) => chainAt.push(chainAt[chainAt.length - 1] + Math.max(0, v)));
  const pitch = { A: -g.inputs.entryAng, B: -g.inputs.entryAng, C: 0, D: 0, E: g.inputs.exitAng, F: g.inputs.exitAng };
  const ctype = CROSSING_TYPES.find((c) => c.key === p.profile.type);

  const exportCsv = () => {
    const lines = ['Station_x_m,Chainage_along_bore_m,Pipe_elevation_m,Depth_below_entry_m'];
    rows.forEach((q) => lines.push([q.x, q.s, q.elev, q.depth].map((v) => v.toFixed(3)).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `${p.meta.docNo || 'profile'}_station_elevation.csv`; a.click();
  };
  const exportScr = () => {
    // AutoCAD script: polyline of the bore (x, elevation × 1) — paste into the command line or run with SCRIPT
    const pts = rows.map((q) => `${q.x.toFixed(3)},${q.elev.toFixed(3)}`);
    const txt = ['_PLINE', ...pts, '', ''].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `${p.meta.docNo || 'profile'}_bore.scr`; a.click();
  };

  return (
    <div className="page wide">
      <PageHead no="03" title="Profile geometry" lede={`${ctype.label}: tangent–curve–bottom run–curve–tangent geometry from the entry/exit angles, radii and bottom depth (crossing_profile_geometry_calculator.xlsx).${obs ? ' Bottom depth is set by the cover requirement and the setbacks from the bank edges.' : ''}`}>
        <Link className="btn" to="/inputs#sec-profile"><SlidersHorizontal size={15} /> Edit profile inputs</Link>
        <button className="btn" onClick={exportCsv}><Download size={15} /> Station table CSV</button>
        <button className="btn" onClick={exportScr}><Download size={15} /> AutoCAD script</button>
      </PageHead>

      {g.feasible
        ? <div className="banner pass" style={{ marginBottom: 16 }}><span className="ico">✓</span><div><div className="t">Profile is feasible</div><div className="s">HDD length ≈ {fmt(g.total, 2)} m over {fmt(g.nodes.F.x, 2)} m plan distance{obs ? ` · setbacks ${fmt(obs.setEntry, 2)} m entry / ${fmt(obs.setExit, 2)} m exit` : ''}.</div></div></div>
        : <div className="banner fail" style={{ marginBottom: 16 }}><span className="ico">✕</span><div><div className="t">Profile requires attention</div><div className="s">{g.issues.map((i) => i.msg).join(' ')}</div></div></div>}

      <ProfileSVG r={r} height={420} waterLevel={p.profile.waterLevel} />
      <div className="muted" style={{ fontSize: 11.5, margin: '6px 0 18px' }}>Hover the drawing to read chainage, elevation, depth and cover. Elevations relative to {obs ? 'bank top / road level = 0' : 'the entry point = 0'}.</div>

      <div className="grid g5">
        <Kpi k="HDD length" sym="L" v={fmt(g.total, 2)} u="m" d="along the bore" hero />
        <Kpi k="Plan distance" sym="L_{plan}" v={fmt(g.nodes.F.x, 2)} u="m" d={obs ? 'setbacks + crossing width' : 'input'} />
        <Kpi k="Bottom depth" sym="h" v={fmt(-g.nodes.C.y, 2)} u="m" d="below entry point" />
        <Kpi k="Entry / exit angle" v={`${fmt(g.inputs.entryAng, 1)}° / ${fmt(g.inputs.exitAng, 1)}°`} d={`${fmt(Math.tan(g.ten) * 100, 1)} % / ${fmt(Math.tan(g.tex) * 100, 1)} %`} />
        <Kpi k="Radius" sym="R" v={g.inputs.Ren === g.inputs.Rex ? fmt(g.inputs.Ren, 0) : `${fmt(g.inputs.Ren, 0)} / ${fmt(g.inputs.Rex, 0)}`} u="m" d={`guidance ≥ ${fmt(r.bending.guide, 0)} m`} state={r.bending.ok ? 'pass' : 'warn'} />
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Card title="Segment lengths" pad={false}>
          <table className="t">
            <thead><tr><th className="l">Segment</th><th className="l">Type</th><th>Length along bore, m</th><th>Horizontal, m</th><th>Vertical, m</th></tr></thead>
            <tbody>
              {g.lengths.map((v, i) => (
                <tr key={i} className={v < 0 ? 'bad' : ''}>
                  <td className="l"><b>L{i + 1}</b> {segNames[i]}</td>
                  <td className="l">{i === 1 || i === 3 ? 'Arc' : 'Straight'}</td>
                  <td>{fmt(v, 3)}</td><td>{fmt(g.horizontal[i], 3)}</td><td>{fmt(Math.abs(g.vertical[i]), 3)}</td>
                </tr>
              ))}
              <tr className="tot"><td className="l" colSpan={2}>AF · HDD length</td><td>{fmt(g.total, 3)}</td><td>{fmt(g.nodes.F.x, 3)}</td><td /></tr>
            </tbody>
          </table>
        </Card>
        <Card title="Node coordinates" pad={false}>
          <table className="t">
            <thead><tr><th className="l">Point</th><th>Plan x, m</th><th>Chainage along bore, m</th><th>Elevation, m</th><th>Depth below entry, m</th><th>Pitch</th></tr></thead>
            <tbody>
              {Object.entries(g.nodes).map(([k, n], i) => (
                <tr key={k}>
                  <td className="l"><b>{k}</b> · {['Entry point', 'Start entry curve', 'End entry curve', 'Start exit curve', 'End exit curve', 'Exit point'][i]}</td>
                  <td>{fmt(n.x, 3)}</td><td>{fmt(chainAt[i], 3)}</td><td>{fmt(datum + n.y, 3)}</td><td>{fmt(-n.y, 3)}</td><td>{fmt(pitch[k], 2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {obs && (
        <>
          <h2 className="sh">Cover check <small>{p.profile.type === 'river' ? `required cover on the bed = scour ${fmt(obs.sc, 2)} m + minimum cover ${fmt(obs.cmin, 2)} m, measured from the unscoured bed` : 'minimum cover below the crossing surface'}</small></h2>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
            <Card pad={false}>
              <table className="t">
                <thead><tr><th className="l">Check point</th><th>Chainage, m</th><th>Ground elev., m</th><th>Pipe elev., m</th><th>Cover, m</th><th>Required, m</th><th className="c">Status</th></tr></thead>
                <tbody>
                  {g.coverCheck.map((c) => (
                    <tr key={c.key} className={c.ok ? '' : 'bad'}>
                      <td className="l">{c.label}</td><td>{fmt(c.x, 2)}</td><td>{fmt(c.ground, 2)}</td><td>{fmt(c.pipe, 2)}</td><td>{fmt(c.cover, 2)}</td><td>{fmt(c.req, 2)}</td>
                      <td className="c"><Status state={c.ok ? 'pass' : 'fail'}>{c.ok ? 'OK' : 'Low'}</Status></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <div className="photo-band" style={{ backgroundImage: `url(${asset('images/river-crossing.webp')})`, padding: 18, minHeight: 180 }}>
              <div className="eyebrow" style={{ color: '#cfcac2' }}>Setbacks from bank edge</div>
              <div className="row" style={{ marginTop: 10, gap: 24, color: '#f5f5f4' }}>
                <div><div style={{ fontSize: 12, color: '#cfcac2' }}>Entry setback</div><div className="num" style={{ fontSize: 30, fontWeight: 600 }}>{fmt(obs.setEntry, 2)} <span style={{ fontSize: 13 }}>m</span></div><div style={{ fontSize: 11.5, color: '#cfcac2' }}>{p.profile.fixEntry ? 'fixed' : 'minimum'} · min {fmt(obs.minSetEntry, 2)} m</div></div>
                <div><div style={{ fontSize: 12, color: '#cfcac2' }}>Exit setback</div><div className="num" style={{ fontSize: 30, fontWeight: 600 }}>{fmt(obs.setExit, 2)} <span style={{ fontSize: 13 }}>m</span></div><div style={{ fontSize: 11.5, color: '#cfcac2' }}>{p.profile.fixExit ? 'fixed' : 'minimum'} · min {fmt(obs.minSetExit, 2)} m</div></div>
              </div>
              <div style={{ fontSize: 11.5, color: '#d6d1c8', marginTop: 12 }}>Bottom elevation {fmt(obs.zBottom, 2)} m · crossing width {fmt(obs.W, 2)} m · setback = horizontal distance from the entry (exit) point to the nearest bank edge at which the bore stays below the cover line.</div>
            </div>
          </div>
        </>
      )}

      <h2 className="sh">Radius, bending &amp; combined curvature <small>engineering guidance — advisory</small></h2>
      <div className="grid g3">
        <Card title="Radius guidance">
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim2">Smallest radius</span><b className="num">{fmt(r.bending.Rmin, 1)} m</b></div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}><span className="dim2">Guidance minimum</span><b className="num">{fmt(r.bending.guide, 1)} m</b></div>
          <div style={{ marginTop: 10 }}><Status state={r.bending.ok ? 'pass' : 'warn'}>{r.bending.ok ? 'Meets guidance' : 'Below guidance — review'}</Status></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{r.bending.guideBasis}</div>
        </Card>
        <Card title="Elastic bending in the curves">
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim2">σ<sub>b</sub> = E·D / 2R</span><b className="num">{fmt(r.bending.sigmaB, 1)} kg/cm²</b></div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}><span className="dim2">Bending strain D / 2R</span><b className="num">{fmt(r.bending.strain * 100, 3)} %</b></div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}><span className="dim2">σ<sub>b</sub> / σ<sub>allow</sub></span><b className="num">{fmt((r.bending.sigmaB / r.stress.allow) * 100, 1)} %</b></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Information only — the workbooks do not combine bending with the push stress.</div>
        </Card>
        <Card title="Combined (plan + vertical) radius">
          {r.planR ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim2">R<sub>h</sub> (plan) / R<sub>v</sub> (vertical)</span><b className="num">{fmt(+p.profile.planRadius, 0)} / {fmt(r.bending.Rmin, 0)} m</b></div>
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}><span className="dim2">R<sub>combined</sub></span><b className="num">{fmt(r.planR, 1)} m</b></div>
              <div style={{ marginTop: 10 }}><Status state={r.planR >= r.bending.guide ? 'pass' : 'warn'}>{r.planR >= r.bending.guide ? 'Meets guidance' : 'Below guidance'}</Status></div>
            </>
          ) : <div className="muted" style={{ fontSize: 12.5 }}>Straight in plan. Enter a plan curve radius R<sub>h</sub> in the inputs to check the combined radius √(R<sub>h</sub>²R<sub>v</sub>² / (R<sub>h</sub>² + R<sub>v</sub>²)) — profile workbook cell I28.</div>}
        </Card>
      </div>

      {p.sections.source === 'manual' && (
        <div style={{ marginTop: 16 }}><Callout kind="warn">Push-force sections use <b>manual lengths</b>. This profile is shown for reference — compare lengths in Design inputs → Section lengths.</Callout></div>
      )}

      <h2 className="sh">Station–elevation table <small>every {fmt(+p.profile.stationStep || 10, 0)} m plan distance · {rows.length} stations</small></h2>
      <div className="tbl-wrap" style={{ maxHeight: 420 }}>
        <table className="t">
          <thead><tr><th>Station x, m</th><th>Chainage along bore, m</th><th>Pipe elevation, m</th><th>Depth below entry, m</th></tr></thead>
          <tbody>{rows.map((q, i) => <tr key={i}><td>{fmt(q.x, 2)}</td><td>{fmt(q.s, 2)}</td><td>{fmt(q.elev, 3)}</td><td>{fmt(q.depth, 3)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
