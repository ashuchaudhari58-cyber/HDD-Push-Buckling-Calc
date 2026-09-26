import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Download, Trash2, Upload, FilePlus2, Save } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, fmt, Status, Callout } from '../components/ui.jsx';
import { PRESETS } from '../engine/presets.js';
import { MATERIALS } from '../engine/materials.js';
import { asset } from '../lib/asset.js';

export default function Projects() {
  const st = useStore();
  const nav = useNavigate();
  const fileRef = useRef();
  const groups = [...new Set(PRESETS.map((p) => p.group))];
  const guard = (fn) => () => { if (st.dirty && !confirm('The current project has unsaved changes. Continue without saving?')) return; fn(); };

  return (
    <div className="page wide">
      <PageHead no="11" eyebrow="Reference & output" title="Saved projects" lede="Projects saved in this browser, plus templates and verification cases. Export a project file to share it with a colleague or archive it with the drawings; import it back here.">
        <button className="btn primary" onClick={st.save}><Save size={15} /> Save current project</button>
        <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import project file</button>
        <input ref={fileRef} type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) st.importFile(f); e.target.value = ''; }} />
      </PageHead>

      <h2 className="sh">Library <small>{st.library.length} saved in this browser</small></h2>
      {st.library.length === 0 ? <Callout>No saved projects yet. Work on a project and press <b>Save</b> (or Ctrl+S).</Callout> : (
        <div className="tbl-wrap">
          <table className="t">
            <thead><tr><th className="l">Project</th><th className="l">Doc no. · Rev</th><th className="l">Location</th><th className="l">Material</th><th>Install force</th><th className="c">Status</th><th className="l">Saved</th><th className="c">Actions</th></tr></thead>
            <tbody>
              {st.library.map((e) => (
                <tr key={e.id} className={e.id === st.project.id ? 'hl' : ''}>
                  <td className="l"><b>{e.project.meta.name}</b>{e.id === st.project.id && <span className="chip brand" style={{ marginLeft: 8 }}>open</span>}</td>
                  <td className="l mono">{e.project.meta.docNo} · {e.project.meta.revision}</td>
                  <td className="l">{e.project.meta.location || '—'}</td>
                  <td className="l">{MATERIALS[e.project.pipe.material]?.short}</td>
                  <td>{e.summary?.force != null ? `${fmt(e.summary.force, 2)} t` : '—'}</td>
                  <td className="c">{e.summary?.overall ? <Status state={e.summary.overall}>{e.summary.overall === 'fail' ? 'Not acceptable' : 'Acceptable'}</Status> : '—'}</td>
                  <td className="l">{new Date(e.savedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="c" style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn xs" onClick={guard(() => { st.open(e.id); nav('/results'); })}><FolderOpen size={12} /> Open</button>{' '}
                    <button className="btn xs ghost" onClick={() => st.exportFile(e.project)} aria-label="Export"><Download size={12} /></button>{' '}
                    <button className="btn xs ghost" onClick={() => { if (confirm(`Delete “${e.project.meta.name}” from this browser? Export it first if you need a copy.`)) st.remove(e.id); }} aria-label="Delete"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {groups.map((g) => (
        <div key={g}>
          <h2 className="sh">{g}</h2>
          <div className="grid g3">
            {PRESETS.filter((p) => p.group === g).map((p) => (
              <div key={p.key} className="wf-card" style={{ cursor: 'default' }}>
                <div className="ph" style={{ backgroundImage: `url(${asset(p.image)})` }} />
                <div className="bd">
                  <b>{p.title}</b><small>{p.desc}</small>
                  <button className="btn sm primary" style={{ marginTop: 10 }} onClick={guard(() => { st.newFrom(p.key); nav(p.key.startsWith('ref') ? '/results' : '/inputs'); })}><FilePlus2 size={13} /> {p.key.startsWith('ref') ? 'Load case' : 'New from template'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 18 }}><Callout>Storage is local to this browser and device. Nothing is uploaded. Export project files for backup and sharing.</Callout></div>
    </div>
  );
}
