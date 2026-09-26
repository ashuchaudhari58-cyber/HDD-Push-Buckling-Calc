import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { ProfileSVG, ForceChart } from './drawings.jsx';
import { forceAtChainage } from '../engine/index.js';
import { fmt, Status } from './ui.jsx';

/* Installation simulation: pipe pushed from the rig (entry) side along the calculated profile.
   HUD values are interpolated linearly between section boundaries of the calculation. */
export function Simulation({ r, waterLevel, withChart = true, height = 380 }) {
  const Ltot = r.forceProfile[r.forceProfile.length - 1].s || 1;
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [s, setS] = useState(reduce ? Ltot : 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [auto, setAuto] = useState(false);
  const [chartS, setChartS] = useState(null);
  const raf = useRef(0), last = useRef(0);

  useEffect(() => { setS((v) => Math.min(v, Ltot)); }, [Ltot]);

  useEffect(() => {
    if (!playing) return undefined;
    const base = Ltot / 18;                              // full crossing in ~18 s at 1×
    const tick = (t) => {
      if (document.hidden) { last.current = t; raf.current = requestAnimationFrame(tick); return; }
      const dt = last.current ? (t - last.current) / 1000 : 0;
      last.current = t;
      setS((v) => {
        const nv = v + base * speed * dt;
        if (nv >= Ltot) { if (auto) return 0; setPlaying(false); return Ltot; }
        return nv;
      });
      raf.current = requestAnimationFrame(tick);
    };
    last.current = 0;
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, auto, Ltot]);

  const shown = chartS != null ? chartS : s;
  const F = forceAtChainage(r.forceProfile, shown);
  const sigma = (F * 1000) / r.stress.As;
  const util = sigma / r.stress.allow;
  const sec = Math.max(1, r.forceProfile.findIndex((q) => q.s >= shown));
  const state = F >= r.buck.Fhel ? 'fail' : F >= r.buck.Fsin ? 'fail' : util > 1 ? 'fail' : 'pass';
  const stText = F >= r.buck.Fhel ? 'Helical lock-up' : F >= r.buck.Fsin ? 'Sinusoidal buckling' : util > 1 ? 'Over-stressed' : 'Within limit';

  return (
    <div>
      <div className="sim-grid">
        <ProfileSVG r={r} simS={shown} height={height} id="sim" waterLevel={waterLevel} interactive={false} />
        <div className="hud" aria-live="polite">
          <div className="ttl"><Activity size={12} /> Live installation</div>
          <div className="r"><span>Progress</span><b>{fmt((shown / Ltot) * 100, 1)} %</b></div>
          <div className="r"><span>Chainage (bore)</span><b>{fmt(shown, 1)} m</b></div>
          <div className="r"><span>Section</span><b>L{sec} · {r.push.sections[sec - 1]?.name}</b></div>
          <div className="r"><span>Push force</span><b className="brand-t">{fmt(F, 2)} t</b></div>
          <div className="r"><span>Axial stress</span><b>{fmt(sigma, 1)} kg/cm²</b></div>
          <div className="r"><span>Utilisation</span><b>{fmt(util * 100, 1)} %</b></div>
          <div style={{ marginTop: 6 }}><Status state={state}>{stText}</Status></div>
        </div>
      </div>
      <div className="sim-ctl">
        <button className="btn sm primary" onClick={() => { if (s >= Ltot) setS(0); setPlaying((p) => !p); }} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn sm" onClick={() => { setS(0); setPlaying(false); }}><RotateCcw size={13} /> Restart</button>
        <div className="seg sm">{[0.25, 0.5, 1, 2].map((v) => <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>)}</div>
        <label className="toggle" style={{ fontSize: 12 }}><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-play loop</label>
        <input type="range" min={0} max={Ltot} step={Ltot / 500} value={s} onChange={(e) => { setPlaying(false); setS(+e.target.value); }} aria-label="Chainage" />
        <span className="muted" style={{ fontSize: 11.5 }}>Pipe advances from the rig (push) side · forces interpolated between section ends</span>
      </div>
      {withChart && (
        <div style={{ marginTop: 12 }}>
          <ForceChart r={r} hoverS={chartS ?? s} onHover={setChartS} id="simfc" height={260} />
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Move the cursor along the chart to scrub the simulation to that chainage.</div>
        </div>
      )}
    </div>
  );
}
