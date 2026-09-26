/* Convert the sourced photographs in .work/images-raw/ into web-ready WebP files in public/images/:
     <slot>.webp     1920 px wide  (hero / page backgrounds)
     <slot>-sm.webp   720 px wide  (cards and thumbnails)
   and write src/data/image-credits.json from .work/images-raw/credits.json (matched by source file).
   Run: npm run images */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const RAW = join(root, '.work', 'images-raw');
const OUT = join(root, 'public', 'images');

/* slot → source file (+ optional crop as fractions of the source image) */
const SLOTS = {
  'hdd-rig-site': { src: 'hdd-rig-site.jpg' },
  'hdd-pullback': { src: 'river-crossing.jpg' },            // HDD pullback of a large-diameter string (pond / reservoir behind)
  'river-crossing': { src: 'river-crossing-alt.jpg' },      // pipeline river crossing, pipe strings on the bank
  'pipe-string': { src: 'pipe-string.jpg' },
  'steel-pipe': { src: 'steel-pipe.jpg' },
  'hdpe-pipe': { src: 'hdpe-pipe.jpg' },
  'drill-pipe': { src: 'drill-pipe.jpg' },
  'road-crossing': { src: 'road-crossing.jpg' },
  'pipe-yard': { src: 'pipe-yard.jpg' },
  'pipe-thruster': { src: 'pipe-thruster.jpg', crop: { left: 0.14 } }, // crop removes an identifiable person at the left edge
};

mkdirSync(OUT, { recursive: true });
const credits = JSON.parse(readFileSync(join(RAW, 'credits.json'), 'utf8'));
const outCredits = [];

for (const [slot, cfg] of Object.entries(SLOTS)) {
  const input = join(RAW, cfg.src);
  if (!existsSync(input)) { console.warn(`! missing ${cfg.src} for ${slot}`); continue; }
  const base = sharp(input).rotate();
  const meta = await base.metadata();
  let pipeline = () => sharp(input).rotate();
  if (cfg.crop) {
    const left = Math.round(meta.width * (cfg.crop.left || 0));
    const right = Math.round(meta.width * (cfg.crop.right || 0));
    const region = { left, top: 0, width: meta.width - left - right, height: meta.height };
    pipeline = () => sharp(input).rotate().extract(region);
  }
  await pipeline().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(join(OUT, `${slot}.webp`));
  await pipeline().resize({ width: 720, withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toFile(join(OUT, `${slot}-sm.webp`));
  const c = credits.find((x) => x.file === cfg.src);
  if (c) outCredits.push({ file: `${slot}.webp`, slot, title: c.title, author: c.author, license: c.license, licenseUrl: c.licenseUrl, source: c.source, sourceUrl: c.sourceUrl, description: c.description, ai: false, edited: cfg.crop ? 'cropped' : undefined });
  else console.warn(`! no credit entry for ${cfg.src}`);
  console.log(`✓ ${slot} ← ${cfg.src}${cfg.crop ? ' (cropped)' : ''}`);
}
writeFileSync(join(root, 'src', 'data', 'image-credits.json'), JSON.stringify(outCredits, null, 2) + '\n');
console.log(`credits: ${outCredits.length}`);
