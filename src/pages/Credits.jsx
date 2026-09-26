import credits from '../data/image-credits.json';
import { PageHead, Callout } from '../components/ui.jsx';
import { asset } from '../lib/asset.js';

export default function Credits() {
  return (
    <div className="page">
      <PageHead eyebrow="Reference & output" title="Image credits" lede="Photographs are used under free licences and are stored with the site (not hot-linked). AI-generated images are identified as such — they illustrate the type of work and do not depict a real project." />
      <div className="grid g2">
        {credits.map((c) => (
          <div key={c.file} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 150, background: `var(--surface-3) url(${asset('images/' + c.file.replace('.webp', '-sm.webp'))}) center/cover no-repeat` }} />
            <div className="card-b" style={{ fontSize: 12.5 }}>
              <b style={{ fontSize: 13.5 }}>{c.title}</b>
              <div className="dim2" style={{ marginTop: 3 }}>{c.description}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {c.ai ? <>AI-generated with {c.author}. {c.license}</> : <>By {c.author}{c.edited ? ` (${c.edited})` : ''} · {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noreferrer">{c.license}</a> : c.license} · {c.sourceUrl ? <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.source}</a> : c.source}</>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {credits.length === 0 && <Callout>No images registered yet.</Callout>}
    </div>
  );
}
