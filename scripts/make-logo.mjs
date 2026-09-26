/* Build the web logo files from .work/brand/logo-source.png (white background):
   flood-fills the outer white background to transparent (keeps white lettering inside the emblem),
   trims, and writes public/brand/logo.webp (640), logo-256.png, logo-192.png, logo-128.webp.
   Run: node scripts/make-logo.mjs */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, '.work', 'brand', 'logo-source.png');
const out = (f) => join(root, 'public', 'brand', f);

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;
const seen = new Uint8Array(N);
const isWhite = (p) => data[p * 4] > 232 && data[p * 4 + 1] > 232 && data[p * 4 + 2] > 232;
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const p = stack.pop();
  if (seen[p] || !isWhite(p)) continue;
  seen[p] = 1;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
}
for (let p = 0; p < N; p++) {
  if (seen[p]) { data[p * 4 + 3] = 0; continue; }
  const edge = [p - 1, p + 1, p - W, p + W].some((k) => k >= 0 && k < N && seen[k]);
  if (edge) { const l = (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2]) / 3; if (l > 200) data[p * 4 + 3] = Math.round(255 * (1 - (l - 200) / 55)); }
}
const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const { data: trimmed } = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const box = { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } };
await sharp(trimmed).resize(640).webp({ quality: 88, alphaQuality: 95 }).toFile(out('logo.webp'));
await sharp(trimmed).resize(256).png({ compressionLevel: 9 }).toFile(out('logo-256.png'));
await sharp(trimmed).resize({ width: 192, height: 192, ...box }).png({ compressionLevel: 9 }).toFile(out('logo-192.png'));
await sharp(trimmed).resize(128).webp({ quality: 90 }).toFile(out('logo-128.webp'));
console.log('logo files written');
