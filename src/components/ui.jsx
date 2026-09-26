import { useEffect, useId, useState, Fragment } from 'react';
import { Check, AlertTriangle, X, Info, CircleHelp, RotateCcw } from 'lucide-react';
import { useStore, getPath } from '../state/store.jsx';

/* number formatting */
export function fmt(v, dp = 2) {
  if (v == null || !isFinite(v)) return '—';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
export function fmtAuto(v) {
  if (v == null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  const dp = a >= 1000 ? 1 : a >= 100 ? 2 : a >= 1 ? 3 : 4;
  return fmt(v, dp);
}

/* X_{sub} / X^{sup} markup → JSX */
export function Tex({ children }) {
  const s = String(children ?? '');
  const out = [];
  const re = /([_^])\{([^}]*)\}/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(<Fragment key={i++}>{s.slice(last, m.index)}</Fragment>);
    out.push(m[1] === '_' ? <sub key={i++}>{m[2]}</sub> : <sup key={i++}>{m[2]}</sup>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(<Fragment key={i++}>{s.slice(last)}</Fragment>);
  return <>{out}</>;
}

export function StatusIcon({ state, size = 14 }) {
  if (state === 'pass') return <Check size={size} strokeWidth={2.6} aria-hidden />;
  if (state === 'warn') return <AlertTriangle size={size} strokeWidth={2.4} aria-hidden />;
  if (state === 'fail') return <X size={size} strokeWidth={2.8} aria-hidden />;
  return <Info size={size} aria-hidden />;
}
const ST_TEXT = { pass: 'Within limit', warn: 'Review', fail: 'Limit exceeded', info: 'Info' };
export function Status({ state, children }) {
  return <span className={`st ${state}`}><StatusIcon state={state} />{children ?? ST_TEXT[state]}</span>;
}

export function Tag({ kind = 'calc', children }) {
  const label = children ?? { calc: 'calc', input: 'input', assumed: 'assumed', sheet: 'sheet', guidance: 'guidance' }[kind];
  return <span className={`tag ${kind}`}>{label}</span>;
}

export function Meter({ value, max = 1, state, limit }) {
  const w = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={`meter ${state || ''}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <i style={{ width: `${w}%` }} />
      {limit != null && <span className="lim" style={{ left: `${Math.min(100, (limit / max) * 100)}%` }} />}
    </div>
  );
}

export function Kpi({ k, sym, v, u, d, state, hero, foot, onClick }) {
  return (
    <div className={`kpi ${hero ? 'hero' : ''} ${state || ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="k"><span>{k}</span>{sym && <span className="sym"><Tex>{sym}</Tex></span>}</div>
      <div className="v">{v}{u && <span className="u">{u}</span>}</div>
      {d && <div className="d">{d}</div>}
      {foot && <div className="f">{foot}</div>}
    </div>
  );
}

export function Card({ title, sub, right, children, pad = true, className = '', id }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || right) && (
        <div className="card-h">
          {title && <h3>{title}</h3>}
          {sub && <span className="sub">{sub}</span>}
          {right && <div className="r">{right}</div>}
        </div>
      )}
      <div className={pad ? 'card-b' : ''}>{children}</div>
    </section>
  );
}

export function Help({ text }) {
  if (!text) return null;
  return <span className="help" title={text} aria-label={text}><CircleHelp size={12} /></span>;
}

/* validation messages for a field */
function useIssues(field) {
  const { results } = useStore();
  return (results?.validation || []).filter((v) => v.field === field);
}

/* Numeric engineering input bound to a project path */
export function NumField({ path, label, sym, unit, step = 'any', hint, help, min, max, range, readOnly, value: forced, decimals, field, libValue, onChange, width }) {
  const store = useStore();
  const id = useId();
  const ext = forced !== undefined ? forced : getPath(store.project, path);
  const [txt, setTxt] = useState(fmtIn(ext, decimals));
  const [focus, setFocus] = useState(false);
  useEffect(() => { if (!focus) setTxt(fmtIn(ext, decimals)); }, [ext, focus, decimals]);
  const issues = useIssues(field || path);
  const err = issues.find((i) => i.level === 'error');
  const wrn = issues.find((i) => i.level === 'warn');
  const modified = libValue != null && isFinite(ext) && Math.abs(Number(ext) - libValue) > 1e-9 * Math.max(1, Math.abs(libValue));
  const commit = (s) => {
    setTxt(s);
    if (readOnly) return;
    const v = s.trim() === '' ? '' : Number(s);
    if (s.trim() === '' || isFinite(v)) { onChange ? onChange(v) : store.set(path, v); }
  };
  const onKey = (e) => {
    if (readOnly) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const cur = Number(txt) || 0;
      const base = typeof step === 'number' ? step : magnitudeStep(cur);
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const nv = +(cur + (e.key === 'ArrowUp' ? 1 : -1) * base * mult).toPrecision(12);
      commit(String(nv));
    }
    if (e.key === 'Escape') { setTxt(fmtIn(ext, decimals)); e.currentTarget.blur(); }
  };
  return (
    <div className="fld" style={width ? { maxWidth: width } : undefined}>
      <label className="lb" htmlFor={id}>
        <span>{label}</span>{sym && <span className="sym"><Tex>{sym}</Tex></span>}<Help text={help} />
        {modified && <span className="mod" title={`Library value: ${libValue}. Click to restore.`} onClick={() => store.set(path, libValue)}>modified ↺</span>}
      </label>
      <div className={`inp ${readOnly ? 'ro' : ''} ${err ? 'err' : wrn ? 'wrn' : ''}`}>
        <input id={id} className="num" inputMode="decimal" value={txt} readOnly={readOnly} aria-invalid={!!err}
          onChange={(e) => commit(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => { setFocus(false); setTxt(fmtIn(ext, decimals)); }} onKeyDown={onKey} />
        {unit && <span className="u"><Tex>{unit}</Tex></span>}
      </div>
      {range && isFinite(ext) && <RangeBar v={Number(ext)} {...range} />}
      {err && <div className="msg error"><AlertTriangle size={12} /> <span><b>Input requires attention.</b> {err.msg}</span></div>}
      {!err && wrn && <div className="msg warn"><AlertTriangle size={12} /> <span>{wrn.msg}</span></div>}
      {hint && !err && !wrn && <div className="hint">{hint}</div>}
    </div>
  );
}
function fmtIn(v, decimals) {
  if (v === '' || v == null) return '';
  if (!isFinite(v)) return String(v);
  if (decimals != null) return String(+Number(v).toFixed(decimals));
  return String(+Number(v).toPrecision(12));
}
function magnitudeStep(v) {
  const a = Math.abs(v);
  if (a === 0) return 1;
  return Math.pow(10, Math.floor(Math.log10(a)) - 1);
}
function RangeBar({ v, lo, hi, min, max }) {
  const pos = (x) => ((x - min) / (max - min)) * 100;
  return (
    <div className="range" title={`Typical range ${lo}–${hi}`}>
      <b style={{ left: `${pos(lo)}%`, width: `${pos(hi) - pos(lo)}%` }} />
      <i style={{ left: `${Math.max(0, Math.min(100, pos(v)))}%` }} />
    </div>
  );
}

export function SelectField({ path, label, sym, options, hint, help, onChange, value: forced, field }) {
  const store = useStore();
  const id = useId();
  const v = forced !== undefined ? forced : getPath(store.project, path);
  const issues = useIssues(field || path);
  const err = issues.find((i) => i.level === 'error');
  return (
    <div className="fld">
      <label className="lb" htmlFor={id}><span>{label}</span>{sym && <span className="sym"><Tex>{sym}</Tex></span>}<Help text={help} /></label>
      <div className={`inp ${err ? 'err' : ''}`}>
        <select id={id} value={v ?? ''} onChange={(e) => (onChange ? onChange(e.target.value) : store.set(path, e.target.value))}>
          {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {err && <div className="msg error"><AlertTriangle size={12} /> <span>{err.msg}</span></div>}
      {hint && !err && <div className="hint">{hint}</div>}
    </div>
  );
}

export function TextField({ path, label, placeholder, hint, area, type = 'text' }) {
  const store = useStore();
  const id = useId();
  const v = getPath(store.project, path) ?? '';
  return (
    <div className="fld">
      <label className="lb" htmlFor={id}><span>{label}</span></label>
      <div className={`inp ${area ? 'area' : ''}`}>
        {area
          ? <textarea id={id} rows={4} value={v} placeholder={placeholder} onChange={(e) => store.set(path, e.target.value)} />
          : <input id={id} type={type} value={v} placeholder={placeholder} onChange={(e) => store.set(path, e.target.value)} />}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function Toggle({ path, label, checked: forced, onChange }) {
  const store = useStore();
  const v = forced !== undefined ? forced : !!getPath(store.project, path);
  return (
    <label className="toggle">
      <input type="checkbox" checked={v} onChange={(e) => (onChange ? onChange(e.target.checked) : store.set(path, e.target.checked))} />
      <span>{label}</span>
    </label>
  );
}

export function Seg({ value, options, onChange, size }) {
  return (
    <div className={`seg ${size || ''}`} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function ResetBtn({ onClick, label = 'Reset' }) {
  return <button type="button" className="btn xs ghost" onClick={onClick}><RotateCcw size={12} /> {label}</button>;
}

export function PageHead({ no, title, lede, children, eyebrow = 'Engineering workflow' }) {
  return (
    <div className="phead">
      <div className="grow">
        <div className="eyebrow">{no && <b>{no} · </b>}{eyebrow}</div>
        <h1 className="pt">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {children && <div className="acts">{children}</div>}
    </div>
  );
}

export function Callout({ kind, icon, children }) {
  const Icon = icon || (kind === 'warn' || kind === 'fail' ? AlertTriangle : kind === 'ok' ? Check : Info);
  return <div className={`callout ${kind || ''}`}><Icon size={15} /><div>{children}</div></div>;
}
