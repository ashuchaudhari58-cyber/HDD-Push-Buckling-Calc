import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, FolderKanban, SlidersHorizontal, Spline, ListOrdered, Gauge as GaugeIcon, ShieldCheck, Grip, ClipboardCheck,
  BookOpen, FileText, Library, Sun, Moon, Save, FileDown, MoreHorizontal, Menu, PanelLeftClose, PanelLeftOpen,
  Undo2, Redo2, Copy, Upload, Download, FilePlus2, RotateCcw, Image as ImageIcon, Check, AlertTriangle, X,
} from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { StatusIcon } from './ui.jsx';
import { asset } from '../lib/asset.js';

const NAV = [
  { group: 'Engineering workflow', items: [
    { to: '/project', label: 'Project', icon: FolderKanban, n: 1 },
    { to: '/inputs', label: 'Design inputs', icon: SlidersHorizontal, n: 2 },
    { to: '/profile', label: 'Profile geometry', icon: Spline, n: 3 },
    { to: '/steps', label: 'Calculation steps', icon: ListOrdered, n: 4 },
    { to: '/results', label: 'Push force results', icon: GaugeIcon, n: 5 },
    { to: '/structural', label: 'Stress & buckling', icon: ShieldCheck, n: 6 },
    { to: '/clamp', label: 'Thruster & clamp', icon: Grip, n: 7 },
    { to: '/validation', label: 'Validation', icon: ClipboardCheck, n: 8, badge: true },
  ] },
  { group: 'Reference & output', items: [
    { to: '/basis', label: 'Calculation basis', icon: BookOpen, n: 9 },
    { to: '/report', label: 'Report / PDF', icon: FileText, n: 10 },
    { to: '/projects', label: 'Saved projects', icon: Library, n: 11 },
  ] },
];

const BG_BY_ROUTE = {
  '/home': 'images/hdd-rig-site.webp', '/project': 'images/pipe-string.webp', '/inputs': 'images/pipe-yard.webp',
  '/profile': 'images/river-crossing.webp', '/results': 'images/hdd-pullback.webp', '/structural': 'images/steel-pipe.webp',
  '/clamp': 'images/pipe-thruster.webp', '/report': null, '/steps': 'images/pipe-string.webp', '/basis': null,
};

export function Layout({ children }) {
  const st = useStore();
  const { project, results, dirty, ui } = st;
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const fileRef = useRef();
  const bgRef = useRef();

  useEffect(() => { setDrawer(false); setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); st.save(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isTyping(e)) { e.preventDefault(); st.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) && !isTyping(e)) { e.preventDefault(); st.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st]);
  // restrained parallax: background moves at ~12 % of scroll speed
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (bgRef.current) bgRef.current.style.setProperty('--py', `${-window.scrollY * 0.12}px`); }); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const ov = results?.overall;
  const vCount = (results?.validation || []).length;
  const bg = BG_BY_ROUTE[loc.pathname] !== undefined ? BG_BY_ROUTE[loc.pathname] : 'images/hdd-rig-site.webp';
  const isReport = loc.pathname === '/report';

  return (
    <div className={`app ${ui.collapsed ? 'collapsed' : ''} ${drawer ? 'drawer' : ''}`}>
      <div className="bgfx" aria-hidden>{bg && !isReport && <div ref={bgRef} className="img" style={{ backgroundImage: `url(${asset(bg)})` }} />}<div className="grid" /></div>
      <header className="hdr">
        <button className="btn icon ghost" onClick={() => (window.innerWidth <= 1000 ? setDrawer((d) => !d) : st.setUi({ collapsed: !ui.collapsed }))} aria-label="Toggle navigation">
          <Menu size={18} />
        </button>
        <NavLink to="/home" className="brand" style={{ color: 'inherit', textDecoration: 'none' }}>
          <img src={asset('brand/logo-128.webp')} alt="HDD Push / Pull Force and Buckling Calculator logo" />
          <div className="wm"><b>HDD Push &amp; Buckling Studio</b><span>Trenchless engineering</span></div>
        </NavLink>
        <div className="proj">
          <span className="chip mono">{project.meta.docNo || '—'}</span>
          <button className="name btn ghost sm" style={{ padding: '0 6px', color: 'var(--text)' }} onClick={() => nav('/project')} title="Project information">{project.meta.name || 'Untitled project'}</button>
          <span className="chip hide-lg">Rev {project.meta.revision}</span>
          <span className="chip hide-lg">{project.meta.status}</span>
          {dirty ? <span className="chip warn hide-sm"><span className="dot" /> Unsaved changes</span> : <span className="chip ok hide-sm"><Check size={11} /> Saved</span>}
        </div>
        <div className="spacer" />
        <button className="btn icon ghost hide-md" onClick={st.undo} disabled={!st.history.length} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={16} /></button>
        <button className="btn icon ghost hide-md" onClick={st.redo} disabled={!st.future.length} title="Redo (Ctrl+Y)" aria-label="Redo"><Redo2 size={16} /></button>
        <button className="btn icon ghost" onClick={() => st.setUi({ theme: ui.theme === 'dark' ? 'light' : 'dark' })} title="Toggle light / dark" aria-label="Toggle theme">
          {ui.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="btn primary" onClick={st.save} title="Save project to this browser (Ctrl+S)"><Save size={15} /> <span className="hide-sm">Save</span></button>
        <button className="btn" onClick={() => nav('/report')} title="Report / PDF"><FileDown size={15} /> <span className="hide-lg">Report / PDF</span></button>
        <div className="rel">
          <button className="btn icon" onClick={() => setMenu((m) => !m)} aria-label="More actions" aria-expanded={menu}><MoreHorizontal size={16} /></button>
          {menu && (
            <div className="menu" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => nav('/projects')}><FilePlus2 size={15} /> New project / templates…</button>
              <button onClick={() => { st.duplicate(); setMenu(false); }}><Copy size={15} /> Duplicate project</button>
              <button onClick={() => { st.exportFile(); setMenu(false); }}><Download size={15} /> Export project file (.json)</button>
              <button onClick={() => fileRef.current?.click()}><Upload size={15} /> Import project file…</button>
              <hr />
              <button onClick={() => { if (confirm('Reset all design inputs to the template defaults? Project information is kept.')) st.reset(); setMenu(false); }}><RotateCcw size={15} /> Reset inputs</button>
              <button onClick={() => nav('/credits')}><ImageIcon size={15} /> Image credits</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) st.importFile(f); e.target.value = ''; setMenu(false); }} />
        </div>
      </header>

      <aside className="side" aria-label="Workflow navigation">
        <nav>
          <NavLink to="/home" className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}><Home size={16} /><span className="lbl">Overview</span></NavLink>
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="grp">{g.group}</div>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`} title={it.label}>
                  <span className="n">{it.n}</span>
                  <span className="lbl">{it.label}</span>
                  {it.badge && vCount > 0 && <span className={`chip badge ${results.validation.some((v) => v.level === 'error') ? 'fail' : 'warn'}`}>{vCount}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {ov && (
          <div className={`st-card ${ov.state}`} onClick={() => nav('/validation')} role="button" tabIndex={0}>
            <span className={`st ${ov.state}`}>{ov.state === 'pass' ? <Check size={16} /> : ov.state === 'warn' ? <AlertTriangle size={16} /> : <X size={16} />}</span>
            <div className="txt"><b className={`st ${ov.state}`}>{ov.title}</b><small>{ov.sub}</small></div>
          </div>
        )}
        <div className="foot">
          <button className="btn ghost sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => st.setUi({ collapsed: !ui.collapsed })}>
            {ui.collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />} <span className="lbl">Collapse sidebar</span>
          </button>
        </div>
      </aside>

      <main className="main" id="main">{children}</main>
      {st.toast && <div className={`toast ${st.toast.kind}`} role="status">{st.toast.kind !== 'info' && <StatusIcon state={st.toast.kind === 'ok' ? 'pass' : 'fail'} />}{st.toast.msg}</div>}
    </div>
  );
}

function isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'); }
