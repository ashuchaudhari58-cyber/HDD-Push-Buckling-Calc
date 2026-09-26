import { useState } from 'react';
import { Save, Copy, Download, GitBranchPlus, Trash2 } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { PageHead, TextField, SelectField, Card, Callout } from '../components/ui.jsx';
import { asset } from '../lib/asset.js';

const nextRev = (r) => {
  if (/^\d+$/.test(r)) return String(+r + 1);
  if (/^[A-Y]$/i.test(r)) return String.fromCharCode(r.toUpperCase().charCodeAt(0) + 1);
  const m = r.match(/^(.*?)(\d+)$/); if (m) return m[1] + (+m[2] + 1);
  return r + '.1';
};

export default function ProjectPage() {
  const st = useStore();
  const p = st.project;
  const [rev, setRev] = useState(nextRev(p.meta.revision));
  const [desc, setDesc] = useState('');

  const setRevRow = (i, k, v) => {
    const revs = p.revisions.map((row, j) => (j === i ? { ...row, [k]: v } : row));
    st.set('revisions', revs);
  };

  return (
    <div className="page">
      <PageHead no="01" title="Project & revisions" lede="Project identification, sign-off and revision control. Everything here appears on the report cover. Projects are saved in this browser (Save or Ctrl+S) and can be exported as a file to share or archive.">
        <button className="btn primary" onClick={st.save}><Save size={15} /> Save project</button>
        <button className="btn" onClick={st.duplicate}><Copy size={15} /> Duplicate</button>
        <button className="btn" onClick={() => st.exportFile()}><Download size={15} /> Export file</button>
      </PageHead>

      <div className="photo-band" style={{ backgroundImage: `url(${asset('images/pipe-string.webp')})`, padding: '22px 24px', marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: '#cfcac2' }}>{p.meta.docNo} · Rev {p.meta.revision} · {p.meta.status}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#f5f5f4', margin: '6px 0 4px' }}>{p.meta.name || 'Untitled project'}</div>
        <div style={{ color: '#d6d1c8', fontSize: 13 }}>{[p.meta.client, p.meta.location, p.meta.feature].filter(Boolean).join(' · ') || 'Client · Location · Crossing'}</div>
      </div>

      <div className="split">
        <div>
          <Card title="Project information">
            <div className="fgrid c2">
              <TextField path="meta.name" label="Project / crossing name" placeholder="e.g. HDD crossing — Imampur Ghat" />
              <TextField path="meta.docNo" label="Calculation / document number" placeholder="e.g. TESPL-HDD-CAL-PUSH-001" />
              <TextField path="meta.client" label="Client / owner" placeholder="Client name" />
              <TextField path="meta.location" label="Location" placeholder="Site, district, state" />
              <TextField path="meta.feature" label="Feature crossed" placeholder="River / road / railway / canal name" />
              <TextField path="meta.contractor" label="HDD contractor" placeholder="Contractor" />
            </div>
          </Card>
          <div style={{ height: 16 }} />
          <Card title="Sign-off">
            <div className="fgrid c3">
              <TextField path="meta.preparedBy" label="Prepared by" placeholder="Name" />
              <TextField path="meta.checkedBy" label="Checked by" placeholder="Name" />
              <TextField path="meta.approvedBy" label="Approved by" placeholder="Name" />
              <TextField path="meta.date" label="Date" type="date" />
              <TextField path="meta.revision" label="Revision" placeholder="0" />
              <SelectField path="meta.status" label="Status" options={['Draft', 'For review', 'For approval', 'Approved', 'Issued for construction', 'Superseded'].map((v) => ({ value: v, label: v }))} />
            </div>
          </Card>
          <div style={{ height: 16 }} />
          <Card title="Notes">
            <TextField path="meta.notes" label="Project notes (printed in the report)" area placeholder="Design basis references, drawing numbers, assumptions agreed with the client…" />
          </Card>
          <div style={{ height: 16 }} />
          <Card title="Revision history" sub="printed in the report">
            <div className="tbl-wrap">
              <table className="t">
                <thead><tr><th className="l" style={{ width: 70 }}>Rev</th><th className="l" style={{ width: 140 }}>Date</th><th className="l" style={{ width: 160 }}>By</th><th className="l">Description</th><th /></tr></thead>
                <tbody>
                  {p.revisions.map((row, i) => (
                    <tr key={i}>
                      <td className="l"><input className="cell" value={row.rev} onChange={(e) => setRevRow(i, 'rev', e.target.value)} /></td>
                      <td className="l"><input className="cell" type="date" value={row.date} onChange={(e) => setRevRow(i, 'date', e.target.value)} /></td>
                      <td className="l"><input className="cell" value={row.by} onChange={(e) => setRevRow(i, 'by', e.target.value)} placeholder="Name" /></td>
                      <td className="l"><input className="cell" value={row.description} onChange={(e) => setRevRow(i, 'description', e.target.value)} /></td>
                      <td className="c"><button className="btn xs ghost" aria-label="Remove revision row" onClick={() => st.set('revisions', p.revisions.filter((_, j) => j !== i))}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="aside">
          <Card title="New revision">
            <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>Start a new revision of this calculation. The revision is added to the history, the status returns to Draft, and the change is kept when you Save.</p>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label className="lb">New revision</label>
              <div className="inp"><input value={rev} onChange={(e) => setRev(e.target.value)} /></div>
            </div>
            <div className="fld" style={{ marginBottom: 12 }}>
              <label className="lb">Description of change</label>
              <div className="inp area"><textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Revised radius to 750 m per client comment" /></div>
            </div>
            <button className="btn primary" style={{ width: '100%' }} disabled={!rev.trim()} onClick={() => { st.newRevision(rev.trim(), desc.trim() || 'Revised', p.meta.preparedBy); setRev(nextRev(rev.trim())); setDesc(''); }}>
              <GitBranchPlus size={15} /> Start Rev {rev}
            </button>
          </Card>
          <div style={{ height: 14 }} />
          <Callout kind={st.dirty ? 'warn' : 'ok'}>
            {st.dirty ? <>This project has <b>unsaved changes</b>. Save keeps it in this browser's library; Export file creates a portable copy.</> : <>Saved in this browser{st.inLibrary ? ' library' : ''}. Export a file to share it or keep an archive copy.</>}
          </Callout>
          <div style={{ height: 14 }} />
          <Callout>Projects are stored locally in this browser only (nothing is uploaded). Clearing browser data removes them — export important projects as files.</Callout>
        </div>
      </div>
    </div>
  );
}
