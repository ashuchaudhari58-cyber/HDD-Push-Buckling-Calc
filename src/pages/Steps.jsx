import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Search } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, Tex, Tag, fmtAuto } from '../components/ui.jsx';

export default function Steps() {
  const { steps, results: r, notify } = useStore();
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState({});
  const [detail, setDetail] = useState(true);
  if (!steps) return null;
  const match = (s) => !q || [s.label, s.sym, s.formula, s.subst].join(' ').toLowerCase().includes(q.toLowerCase());

  const copyTrace = () => {
    const lines = [];
    steps.groups.forEach((g) => {
      lines.push(`\n${g.key}. ${g.title}`);
      g.steps.forEach((s) => lines.push(`${s.id}  ${s.label}: ${plain(s.formula)} = ${plain(s.subst)} = ${s.value == null ? '' : fmtAuto(s.value)} ${s.unit || ''}`));
    });
    navigator.clipboard?.writeText(lines.join('\n')).then(() => notify('Calculation trace copied to the clipboard.', 'ok'));
  };

  return (
    <div className="page wide">
      <PageHead no="04" title="Calculation steps" lede={`Complete audit trail of the calculation in dependency order — ${steps.count} steps, each with its equation, the values substituted and the result. Units are the workbook calculation basis (cm, kg, kg/cm², tonne-force). Method: ${r.method.label}.`}>
        <div className="inp" style={{ width: 280 }}><Search size={14} style={{ marginLeft: 10, color: 'var(--text-muted)' }} /><input placeholder="Filter steps — e.g. capstan, W_net, L3" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn sm" onClick={() => setClosed({})}>Expand all</button>
        <button className="btn sm" onClick={() => setClosed(Object.fromEntries(steps.groups.map((g) => [g.key, true])))}>Collapse all</button>
        <button className="btn sm" onClick={() => setDetail((d) => !d)}>{detail ? 'Hide' : 'Show'} substitutions</button>
        <button className="btn sm" onClick={copyTrace}><Copy size={13} /> Copy audit trail</button>
      </PageHead>

      <div className="row" style={{ marginBottom: 14, fontSize: 12 }}>
        <span className="muted">Tags:</span>
        <Tag kind="input" /><span className="muted">user input</span>
        <Tag kind="calc" /><span className="muted">calculated</span>
        <Tag kind="assumed" /><span className="muted">assumption / convention</span>
        <Tag kind="sheet" /><span className="muted">reproduces a workbook convention</span>
        <Tag kind="guidance" /><span className="muted">engineering guidance (advisory)</span>
      </div>

      <div className="steps-layout">
        <aside className="steps-idx card" style={{ padding: 8 }}>
          <div className="eyebrow" style={{ padding: '6px 10px' }}>Calculation groups</div>
          {steps.groups.map((g) => (
            <a key={g.key} href={`#grp-${g.key}`} onClick={(e) => { e.preventDefault(); setClosed((c) => ({ ...c, [g.key]: false })); document.getElementById(`grp-${g.key}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
              <span className="k">{g.key}</span>{g.title}<span className="c">{g.steps.length}</span>
            </a>
          ))}
        </aside>
        <div>
          {steps.groups.map((g) => {
            const list = g.steps.filter(match);
            if (q && !list.length) return null;
            const isClosed = closed[g.key];
            return (
              <section key={g.key} id={`grp-${g.key}`} className="card sgrp">
                <div className="hd" onClick={() => setClosed((c) => ({ ...c, [g.key]: !c[g.key] }))} role="button" aria-expanded={!isClosed}>
                  <span className="k">{g.key}</span>
                  <div><h3>{g.title}</h3>{g.blurb && <div className="sub">{g.blurb}</div>}</div>
                  <span className="r">steps {g.steps[0]?.id}–{g.steps[g.steps.length - 1]?.id}</span>
                  {isClosed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </div>
                {!isClosed && list.map((s) => (
                  <div key={s.id} className={`step ${s.strong ? 'strong' : ''} ${s.key ? 'key' : ''} ${detail ? '' : 'collapsed'}`}>
                    <span className="id">{s.id}</span>
                    <div className="nm">{s.label}{s.section != null && <small>L{s.section + 1} · {r.push.sections[s.section].name}</small>}</div>
                    <div className="fx">
                      <div className="f"><Tex>{s.formula}</Tex></div>
                      <div className="s">= <Tex>{s.subst}</Tex></div>
                      {s.note && <div className="note">{s.note}</div>}
                    </div>
                    <div className="val">
                      <b>{s.value == null ? '' : <><span className="sr-only"><Tex>{s.sym}</Tex> = </span>{fmtAuto(s.value)}</>}<i>{s.unit}</i></b>
                      <span className="row" style={{ gap: 6 }}><span className="mono muted" style={{ fontSize: 11 }}><Tex>{s.sym}</Tex></span><Tag kind={s.tag} /></span>
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const plain = (s) => String(s ?? '').replace(/_\{([^}]*)\}/g, '$1').replace(/\^\{([^}]*)\}/g, '^$1');
