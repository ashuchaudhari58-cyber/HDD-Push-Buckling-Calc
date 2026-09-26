import { useMemo, useRef, useState } from 'react';
import { samplePath, pointAtChainage, pipeElevationAtX } from '../engine/profile.js';
import { forceAtChainage, chainageAtForce } from '../engine/index.js';
import { fmt } from './ui.jsx';

export function niceStep(range, target = 8) {
  const raw = range / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
const ticks = (a, b, step) => { const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10)); return out; };

/* ===================================================================== PROFILE */
export function ProfileSVG({ r, height = 380, simS = null, showDims = true, interactive = true, id = 'prof', printMode = false, waterLevel = 1.5 }) {
  const prof = r.prof;
  const W = 1200, H = height;
  const m = { l: 62, r: 24, t: 34, b: 46 };
  const datum = prof.datum || 0;
  const obs = prof.obstacle;
  const path = useMemo(() => samplePath(prof, 360), [prof]);
  const Fx = prof.nodes.F.x;
  const [hx, setHx] = useState(null);
  const ref = useRef();

  const groundAt = (x) => (prof.groundAt ? prof.groundAt(x) : datum + (prof.nodes.F.y - prof.nodes.A.y) * Math.min(1, Math.max(0, x / (Fx || 1))));
  const xmin = -0.05 * Fx, xmax = Fx * 1.05;
  const ys = path.map((q) => datum + q.y);
  let gTop = Math.max(datum, datum + prof.nodes.F.y, 0);
  if (obs) gTop = Math.max(gTop, obs.ge, obs.gx, 0);
  const pipeMin = Math.min(...ys);
  const span = Math.max(gTop - pipeMin, 1);
  const yTop = gTop + span * 0.22, yBot = pipeMin - span * 0.18;
  const sx = (x) => m.l + ((x - xmin) / (xmax - xmin)) * (W - m.l - m.r);
  const sy = (y) => m.t + ((yTop - y) / (yTop - yBot)) * (H - m.t - m.b);
  const ve = ((H - m.t - m.b) / (yTop - yBot)) / ((W - m.l - m.r) / (xmax - xmin));

  const pipeD = path.map((q, i) => `${i ? 'L' : 'M'}${sx(q.x).toFixed(1)},${sy(datum + q.y).toFixed(1)}`).join('');
  // ground polyline
  const gx = []; const N = 160;
  for (let i = 0; i <= N; i++) { const x = xmin + ((xmax - xmin) * i) / N; gx.push([x, groundAt(Math.max(0, Math.min(Fx, x)))]); }
  if (obs) { [obs.edgeL, obs.toeL, obs.toeR, obs.edgeR].forEach((x) => gx.push([x, groundAt(x)])); gx.sort((a, b) => a[0] - b[0]); }
  const groundD = gx.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  const soilD = `${groundD} L${sx(xmax)},${sy(yBot)} L${sx(xmin)},${sy(yBot)} Z`;

  const xStep = niceStep(xmax - xmin, 10);
  const yStep = niceStep(yTop - yBot, 6);

  // pipe progress for simulation
  const Ltot = prof.lengths.reduce((a, v) => a + Math.max(0, v), 0);
  const head = simS != null ? pointAtChainage(prof, Math.min(simS, Ltot)) : null;
  const pipeDone = simS != null ? path.filter((q) => q.s <= simS) : path;
  if (head && pipeDone.length) pipeDone.push({ ...head, s: simS });
  let pipeDoneD = pipeDone.map((q, i) => `${i ? 'L' : 'M'}${sx(q.x).toFixed(1)},${sy(datum + q.y).toFixed(1)}`).join('');

  // exaggerated buckling wave (visual only): region near the thrust end where compression ≥ F_sin
  let buckleNote = null;
  if (simS != null && r.forceProfile) {
    const Fs = forceAtChainage(r.forceProfile, simS);
    const Fsin = r.buck.Fsin;
    if (Fs > Fsin && pipeDone.length > 2) {
      const uStar = Fs - Fsin <= 0 ? 0 : (chainageAtForce(r.forceProfile, Fs - Fsin) ?? 0);
      const hel = Fs > r.buck.Fhel ? (chainageAtForce(r.forceProfile, Fs - r.buck.Fhel) ?? 0) : -1;
      const pts = pipeDone.map((q, i) => {
        const X = sx(q.x), Y = sy(datum + q.y);
        if (q.s > uStar || i === 0) return [X, Y];
        const nx = pipeDone[Math.min(i + 1, pipeDone.length - 1)], pv = pipeDone[Math.max(i - 1, 0)];
        const dx = sx(nx.x) - sx(pv.x), dy = sy(datum + nx.y) - sy(datum + pv.y), L = Math.hypot(dx, dy) || 1;
        const amp = (q.s <= hel ? 6 : 3.5) * Math.min(1, (uStar - q.s) / Math.max(uStar * 0.15, 1));
        const off = amp * Math.sin((q.s / Math.max(Ltot, 1)) * 2 * Math.PI * 28);
        return [X + (-dy / L) * off, Y + (dx / L) * off];
      });
      pipeDoneD = pts.map(([X, Y], i) => `${i ? 'L' : 'M'}${X.toFixed(1)},${Y.toFixed(1)}`).join('');
      buckleNote = hel >= 0 ? 'helical' : 'sinusoidal';
    }
  }

  const nodes = Object.entries(prof.nodes);
  const segMid = (k) => pointAtChainage(prof, prof.lengths.slice(0, k).reduce((a, v) => a + Math.max(0, v), 0) + Math.max(0, prof.lengths[k]) / 2);
  const ang = (p1, p2) => (Math.atan2(sy(datum + p2.y) - sy(datum + p1.y), sx(p2.x) - sx(p1.x)) * 180) / Math.PI;
  // rig aligned with the entry angle as it appears on screen (vertical exaggeration applied)
  const kx = (W - m.l - m.r) / (xmax - xmin), ky = (H - m.t - m.b) / (yTop - yBot);
  const rigAng = Math.min(32, (Math.atan2(Math.sin(prof.ten) * ky, Math.cos(prof.ten) * kx) * 180) / Math.PI); // symbol only — capped for legibility
  void ang;

  const onMove = (e) => {
    if (!interactive) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const x = xmin + ((px - m.l) / (W - m.l - m.r)) * (xmax - xmin);
    setHx(x >= 0 && x <= Fx ? x : null);
  };
  let hover = null;
  if (hx != null) {
    const py = datum + pipeElevationAtX(prof, hx);
    const g0 = groundAt(hx);
    hover = { x: hx, py, g: g0, cover: g0 - py, depth: datum - py };
  }

  return (
    <div className="draw" style={printMode ? { background: '#fff' } : undefined}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="HDD crossing profile" onMouseMove={onMove} onMouseLeave={() => setHx(null)}>
        <defs>
          <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ground)" strokeWidth="0.8" opacity="0.35" />
          </pattern>
          <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--soil-1)" /><stop offset="1" stopColor="var(--soil-2)" />
          </linearGradient>
          <marker id={`${id}-arr`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="var(--dim)" /></marker>
        </defs>
        {/* soil */}
        <path d={soilD} fill={`url(#${id}-soil)`} />
        <path d={soilD} fill={`url(#${id}-hatch)`} opacity="0.5" />
        {/* grid */}
        <g stroke="var(--grid)" strokeWidth="1">
          {ticks(xmin, xmax, xStep).map((x) => <line key={'gx' + x} x1={sx(x)} x2={sx(x)} y1={m.t} y2={H - m.b} />)}
          {ticks(yBot, yTop, yStep).map((y) => <line key={'gy' + y} x1={m.l} x2={W - m.r} y1={sy(y)} y2={sy(y)} />)}
        </g>
        {/* water */}
        {obs && (obs.type === 'river' || obs.type === 'canal') && obs.b > 0 && (() => {
          const level = -Math.max(0, Math.min(obs.b - 0.2, waterLevel ?? 1.5));   // water surface below bank top
          const inset = obs.toe > 0 ? (obs.toe * -level) / obs.b : 0;
          const x0 = obs.edgeL + inset, x1 = obs.edgeR - inset;
          const pts = [[x0, level]];
          for (let i = 0; i <= 40; i++) { const x = x1 - ((x1 - x0) * i) / 40; pts.push([x, Math.min(level, groundAt(x))]); }
          return (
            <g>
              <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)},${sy(y)}`).join('') + 'Z'} fill="var(--water)" />
              <line x1={sx(x0)} x2={sx(x1)} y1={sy(level)} y2={sy(level)} stroke="var(--water-line)" strokeWidth="1.2" strokeDasharray="6 4" />
              <text x={sx((x0 + x1) / 2)} y={sy(level) - 6} textAnchor="middle" className="svg-lbl" fill="var(--water-line)">{obs.type === 'river' ? 'WATER' : 'CHANNEL'}</text>
            </g>
          );
        })()}
        {/* scour line */}
        {obs && obs.sc > 0 && <line x1={sx(obs.toeL)} x2={sx(obs.toeR)} y1={sy(-obs.b - obs.sc)} y2={sy(-obs.b - obs.sc)} stroke="var(--warn)" strokeWidth="1" strokeDasharray="3 4" opacity="0.8" />}
        {/* ground */}
        <path d={groundD} fill="none" stroke="var(--ground)" strokeWidth="2" />
        {/* borehole + planned path */}
        <path d={pipeD} fill="none" stroke="var(--bore)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        {simS != null && <path d={pipeD} fill="none" stroke="var(--brand)" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.5" />}
        {/* pipe */}
        <path d={pipeDoneD} fill="none" stroke="var(--pipe)" strokeWidth={simS != null ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" />
        {head && (
          <g transform={`translate(${sx(head.x)},${sy(datum + head.y)})`}>
            <circle r="6.5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
            <circle r="11" fill="none" stroke="var(--brand)" strokeWidth="1.2" opacity="0.5" />
          </g>
        )}
        {/* rig at entry */}
        <g transform={`translate(${sx(prof.nodes.A.x)},${sy(datum)}) rotate(${rigAng})`} opacity="0.95">
          <rect x="-86" y="-12" width="86" height="9" rx="2" fill="var(--brand-2)" />
          <rect x="-70" y="-26" width="30" height="14" rx="2" fill="var(--brand)" />
          <rect x="-84" y="-3" width="12" height="6" rx="1.5" fill="var(--text-2)" />
          <rect x="-20" y="-3" width="12" height="6" rx="1.5" fill="var(--text-2)" />
          {simS != null && [0, 1, 2].map((i) => <path key={i} d={`M${-58 + i * 16},-7 l9,0 m-4,-3 l4,3 l-4,3`} stroke="var(--surface)" strokeWidth="1.6" fill="none" />)}
        </g>
        <text x={sx(0)} y={sy(datum) - 40} textAnchor="start" className="svg-lbl" fill="var(--brand-ink)">RIG · THRUST (PUSH) SIDE</text>
        {/* nodes */}
        {nodes.map(([k, p]) => (
          <g key={k}>
            <circle cx={sx(p.x)} cy={sy(datum + p.y)} r="3.6" fill="var(--surface)" stroke="var(--dim)" strokeWidth="1.4" />
            <text x={sx(p.x)} y={sy(datum + p.y) + (k === 'A' || k === 'F' ? -9 : 17)} textAnchor="middle" className="svg-node">{k}</text>
          </g>
        ))}
        {showDims && (
          <g className="dims">
            {prof.lengths.map((v, k) => {
              if (v <= 0.01) return null;
              const q = segMid(k);
              const lbl = ['AB', 'BC', 'CD', 'DE', 'EF'][k];
              const isArc = k === 1 || k === 3;
              return (
                <g key={k}>
                  <text x={sx(q.x)} y={sy(datum + q.y) + (k === 2 ? 22 : -14)} textAnchor="middle" className="svg-dim">{lbl} {fmt(v, 2)} m</text>
                  {isArc && <text x={sx(q.x)} y={sy(datum + q.y) + 22} textAnchor="middle" className="svg-dim2">R {fmt(k === 1 ? prof.inputs.Ren : prof.inputs.Rex, 0)} m</text>}
                </g>
              );
            })}
            <text x={sx(0) + 14} y={sy(datum) + 18} className="svg-dim2">{fmt(prof.inputs.entryAng, 1)}°</text>
            <text x={sx(Fx) - 14} y={sy(datum + prof.nodes.F.y) + 18} textAnchor="end" className="svg-dim2">{fmt(prof.inputs.exitAng, 1)}°</text>
            {/* depth dimension at mid bottom */}
            {(() => {
              const xm = (prof.nodes.C.x + prof.nodes.D.x) / 2;
              const g0 = groundAt(xm); const py = datum + prof.nodes.C.y;
              return (
                <g>
                  <line x1={sx(xm)} x2={sx(xm)} y1={sy(g0)} y2={sy(py)} stroke="var(--dim)" strokeWidth="1" markerStart={`url(#${id}-arr)`} markerEnd={`url(#${id}-arr)`} />
                  <text x={sx(xm) + 7} y={(sy(g0) + sy(py)) / 2} className="svg-dim">{fmt(g0 - py, 2)} m {obs ? 'cover' : 'depth'}</text>
                </g>
              );
            })()}
            {/* plan distance */}
            <line x1={sx(0)} x2={sx(Fx)} y1={H - m.b + 26} y2={H - m.b + 26} stroke="var(--dim)" strokeWidth="1" markerStart={`url(#${id}-arr)`} markerEnd={`url(#${id}-arr)`} opacity="0.8" />
            <text x={sx(Fx / 2)} y={H - m.b + 22} textAnchor="middle" className="svg-dim">Plan distance {fmt(Fx, 2)} m · HDD length {fmt(prof.total, 2)} m</text>
            {obs && prof.coverCheck.map((c) => (
              <g key={c.key}>
                <line x1={sx(c.x)} x2={sx(c.x)} y1={sy(c.ground)} y2={sy(c.pipe)} stroke={c.ok ? 'var(--ok)' : 'var(--fail)'} strokeWidth="1" strokeDasharray="2 3" />
              </g>
            ))}
          </g>
        )}
        {/* axes */}
        <g className="svg-tick">
          {ticks(xmin, xmax, xStep).filter((x) => x >= 0).map((x) => <text key={'tx' + x} x={sx(x)} y={H - m.b + 12} textAnchor="middle">{fmt(x, 0)}</text>)}
          {ticks(yBot, yTop, yStep).map((y) => <text key={'ty' + y} x={m.l - 8} y={sy(y) + 3.5} textAnchor="end">{fmt(y, yStep < 1 ? 1 : 0)}</text>)}
          <text x={m.l - 8} y={m.t - 12} textAnchor="end">Elev. m</text>
        </g>
        {/* hover */}
        {hover && (
          <g>
            <line x1={sx(hover.x)} x2={sx(hover.x)} y1={m.t} y2={H - m.b} stroke="var(--brand)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={sx(hover.x)} cy={sy(hover.py)} r="4.5" fill="var(--brand)" />
          </g>
        )}
      </svg>
      <div className="legend">
        <span><i style={{ background: 'var(--pipe)' }} />Pipe / bore path</span>
        <span><i style={{ background: 'var(--ground)' }} />Ground</span>
        {obs && (obs.type === 'river' || obs.type === 'canal') && <span><i style={{ background: 'var(--water-line)' }} />Water</span>}
        {obs && obs.sc > 0 && <span><i style={{ background: 'var(--warn)' }} />Scour line</span>}
      </div>
      <div className="note">Vertical scale exaggerated ×{fmt(ve, 1)}{buckleNote ? ` · ${buckleNote} buckling wave exaggerated for clarity; not to scale` : ''}</div>
      {hover && (
        <div className="tip" style={{ left: `calc(${(sx(hover.x) / W) * 100}% + 14px)`, top: 40 }}>
          <div className="r"><span>Chainage (plan)</span><b>{fmt(hover.x, 2)} m</b></div>
          <div className="r"><span>Pipe elevation</span><b>{fmt(hover.py, 2)} m</b></div>
          <div className="r"><span>Depth below entry</span><b>{fmt(hover.depth, 2)} m</b></div>
          <div className="r"><span>Cover to ground</span><b>{fmt(hover.cover, 2)} m</b></div>
        </div>
      )}
    </div>
  );
}

/* ===================================================================== FORCE vs CHAINAGE */
export function ForceChart({ r, height = 300, hoverS, onHover, id = 'fc', printMode = false }) {
  const W = 1200, H = height;
  const m = { l: 64, r: 26, t: 30, b: 40 };
  const fp = r.forceProfile;
  const Ltot = fp[fp.length - 1].s || 1;
  const Fmax = Math.max(...fp.map((q) => q.F), 1e-6);
  const lims = [
    { key: 'sin', label: r.buck.criterion === 'gao' ? 'F_sin (Gao)' : 'F_sin (D–P)', v: r.buck.Fsin, color: 'var(--warn)' },
    { key: 'hel', label: 'F_hel', v: r.buck.Fhel, color: 'var(--fail)' },
    { key: 'allow', label: 'F at σ_allow', v: r.stress.Fallow, color: 'var(--text-muted)' },
  ];
  const ymax0 = Fmax * 1.18;
  const shown = lims.filter((l) => l.v <= Math.max(ymax0, Fmax * 2.6));
  const ymax = Math.max(ymax0, ...shown.map((l) => l.v * 1.08));
  const off = lims.filter((l) => !shown.includes(l));
  const sx = (s) => m.l + (s / Ltot) * (W - m.l - m.r);
  const sy = (F) => m.t + (1 - F / ymax) * (H - m.t - m.b);
  const ref = useRef();
  const [localS, setLocalS] = useState(null);
  const S = hoverS != null ? hoverS : localS;

  const line = fp.map((q, i) => `${i ? 'L' : 'M'}${sx(q.s)},${sy(q.F)}`).join('');
  const area = `${line} L${sx(Ltot)},${sy(0)} L${sx(0)},${sy(0)} Z`;
  const yStep = niceStep(ymax, 5), xStep = niceStep(Ltot, 10);
  const names = r.push.sections.map((s) => s.name);

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const s = Math.max(0, Math.min(Ltot, ((px - m.l) / (W - m.l - m.r)) * Ltot));
    setLocalS(s); onHover && onHover(s);
  };
  const onLeave = () => { setLocalS(null); onHover && onHover(null); };

  let tip = null;
  if (S != null) {
    const F = forceAtChainage(fp, S);
    const si = fp.findIndex((q) => q.s >= S);
    const sec = Math.max(1, si);
    tip = { s: S, F, sec, sigma: (F * 1000) / r.stress.As, util: (F * 1000) / r.stress.As / r.stress.allow };
  }

  return (
    <div className="draw" style={printMode ? { background: '#fff' } : undefined}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Installation force versus chainage" onMouseMove={onMove} onMouseLeave={onLeave}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0.02" /></linearGradient>
        </defs>
        {fp.slice(1).map((q, i) => (
          <g key={i}>
            <rect x={sx(fp[i].s)} y={m.t} width={Math.max(0, sx(q.s) - sx(fp[i].s))} height={H - m.t - m.b} fill={i % 2 ? 'var(--grid-2)' : 'transparent'} opacity="0.7" />
            {sx(q.s) - sx(fp[i].s) > 34 && <text x={(sx(fp[i].s) + sx(q.s)) / 2} y={m.t - 10} textAnchor="middle" className="svg-tick">L{i + 1}</text>}
          </g>
        ))}
        <g stroke="var(--grid)">{ticks(0, ymax, yStep).map((y) => <line key={y} x1={m.l} x2={W - m.r} y1={sy(y)} y2={sy(y)} />)}</g>
        <path d={area} fill={`url(#${id}-g)`} />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.6" strokeLinejoin="round" />
        {fp.map((q, i) => <circle key={i} cx={sx(q.s)} cy={sy(q.F)} r="3.5" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2" />)}
        {shown.map((l) => (
          <g key={l.key}>
            <line x1={m.l} x2={W - m.r} y1={sy(l.v)} y2={sy(l.v)} stroke={l.color} strokeWidth="1.5" strokeDasharray={l.key === 'allow' ? '2 4' : '7 5'} />
            <text x={W - m.r - 4} y={sy(l.v) - 5} textAnchor="end" className="svg-lbl" fill={l.color}>{l.label.replace('_', '')} {fmt(l.v, 1)} t</text>
          </g>
        ))}
        <g className="svg-tick">
          {ticks(0, ymax, yStep).map((y) => <text key={y} x={m.l - 8} y={sy(y) + 3.5} textAnchor="end">{fmt(y, yStep < 1 ? 1 : 0)}</text>)}
          {ticks(0, Ltot, xStep).map((x) => <text key={x} x={sx(x)} y={H - m.b + 16} textAnchor="middle">{fmt(x, 0)}</text>)}
          <text x={m.l - 8} y={m.t - 12} textAnchor="end">t</text>
          <text x={W - m.r} y={H - 6} textAnchor="end">Chainage along bore, m</text>
        </g>
        {S != null && (
          <g>
            <line x1={sx(S)} x2={sx(S)} y1={m.t} y2={H - m.b} stroke="var(--text-2)" strokeDasharray="3 3" />
            <circle cx={sx(S)} cy={sy(tip.F)} r="5" fill="var(--brand)" />
          </g>
        )}
      </svg>
      {off.length > 0 && <div className="note">Off scale: {off.map((l) => `${l.label.replace('_', '')} ${fmt(l.v, 1)} t`).join(' · ')}</div>}
      {tip && (
        <div className="tip" style={{ left: `min(calc(${(sx(tip.s) / W) * 100}% + 14px), calc(100% - 200px))`, top: 24 }}>
          <div className="r"><span>Chainage</span><b>{fmt(tip.s, 1)} m</b></div>
          <div className="r"><span>Section</span><b>L{tip.sec} · {names[tip.sec - 1]}</b></div>
          <div className="r"><span>Push force</span><b>{fmt(tip.F, 2)} t</b></div>
          <div className="r"><span>Axial stress</span><b>{fmt(tip.sigma, 1)} kg/cm²</b></div>
          <div className="r"><span>Utilisation</span><b>{fmt(tip.util * 100, 1)} %</b></div>
          <div className="r"><span style={{ fontSize: 10.5 }}>linear between section ends</span></div>
        </div>
      )}
    </div>
  );
}

/* ===================================================================== CROSS SECTION */
export function CrossSection({ r, size = 240 }) {
  const { pipe, buck, push } = r;
  const S = size, c = S / 2;
  const Rh = c - 16;
  const k = Rh / (buck.Dhole / 2);
  const Ro = Math.max(0, Math.min(Rh, (pipe.D / 2) * k)), Ri = Math.max(0, Math.min(Ro, (pipe.d / 2) * k)); // clamp for invalid inputs
  const buoyant = push.props.Wnet < 0;
  const cy = buoyant ? c - (Rh - Ro) : c + (Rh - Ro);
  const isPE = pipe.material === 'hdpe';
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: S }} role="img" aria-label="Pipe in reamed hole cross-section">
      <defs>
        <pattern id="xs-h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--ground)" strokeWidth="0.8" opacity="0.45" /></pattern>
      </defs>
      <rect x="0" y="0" width={S} height={S} fill="var(--soil-1)" />
      <rect x="0" y="0" width={S} height={S} fill="url(#xs-h)" />
      <circle cx={c} cy={c} r={Rh} fill="var(--bore)" stroke="var(--ground)" strokeDasharray="4 3" />
      <circle cx={c} cy={cy} r={Ro} fill={isPE ? '#1d1d1f' : 'var(--pipe-steel)'} stroke={isPE ? '#f97316' : '#8d8d92'} strokeWidth={isPE ? 1.5 : 1} />
      <circle cx={c} cy={cy} r={Ri} fill={r.x.contents === 'empty' ? 'var(--surface-sunk)' : 'var(--bore)'} />
      <line x1={c - Ro} x2={c + Ro} y1={cy} y2={cy} stroke="var(--brand)" strokeWidth="1" />
      <text x={c} y={cy - 5} textAnchor="middle" className="svg-dim">OD {fmt(pipe.ODmm, 1)} mm</text>
      <text x={c} y={cy + 14} textAnchor="middle" className="svg-dim2">t {fmt(pipe.WTmm, 2)} mm</text>
      <text x={c} y={S - 5} textAnchor="middle" className="svg-dim2">Hole Ø {fmt(buck.Dhole * 10, 0)} mm · r꜀ {fmt(buck.clearance * 10, 0)} mm</text>
      <text x={c} y={13} textAnchor="middle" className="svg-dim2">{buoyant ? 'buoyant → bears on crown' : 'heavy → bears on invert'}</text>
    </svg>
  );
}

/* ===================================================================== GAUGE */
export function Gauge({ value, label, sub, state, max = 1.2 }) {
  const W = 220, H = 128, cx = 110, cy = 112, R = 88;
  const a0 = Math.PI, a1 = 0;
  const t = Math.max(0, Math.min(1, value / max));
  const arc = (from, to, rad) => {
    const x0 = cx + rad * Math.cos(from), y0 = cy - rad * Math.sin(from);
    const x1 = cx + rad * Math.cos(to), y1 = cy - rad * Math.sin(to);
    return `M${x0},${y0} A${rad},${rad} 0 0 1 ${x1},${y1}`;
  };
  const at = (f) => a0 + (a1 - a0) * f;
  const col = state === 'fail' ? 'var(--fail)' : state === 'warn' ? 'var(--warn)' : 'var(--ok)';
  const lim = at(1 / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 260 }} role="meter" aria-valuenow={value} aria-label={label}>
      <path d={arc(a0, a1, R)} stroke="var(--surface-3)" strokeWidth="14" fill="none" strokeLinecap="round" />
      {t > 0.001 && <path d={arc(a0, at(t), R)} stroke={col} strokeWidth="14" fill="none" strokeLinecap="round" />}
      <line x1={cx + (R - 12) * Math.cos(lim)} y1={cy - (R - 12) * Math.sin(lim)} x2={cx + (R + 12) * Math.cos(lim)} y2={cy - (R + 12) * Math.sin(lim)} stroke="var(--text)" strokeWidth="2" />
      <text x={cx} y={cy - 22} textAnchor="middle" style={{ font: '600 26px var(--mono)', fill: 'var(--text)' }}>{fmt(value * 100, 1)}%</text>
      <text x={cx} y={cy - 4} textAnchor="middle" className="svg-tick">{sub}</text>
    </svg>
  );
}
