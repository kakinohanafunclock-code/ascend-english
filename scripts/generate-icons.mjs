/**
 * Rasterize the source SVGs into the PNG icons referenced by the manifest and
 * index.html. Run once after changing the source art:  npm run gen:icons
 * The generated PNGs are committed so production builds don't need `sharp`.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const icon = readFileSync(resolve(root, 'assets/icon.svg'));
const maskable = readFileSync(resolve(root, 'assets/icon-maskable.svg'));
const out = (name) => resolve(root, 'public', name);

const jobs = [
  { src: icon, size: 192, file: 'pwa-192x192.png' },
  { src: icon, size: 512, file: 'pwa-512x512.png' },
  { src: maskable, size: 512, file: 'maskable-512x512.png' },
  // iOS home-screen icon: opaque, 180×180, no transparency.
  { src: icon, size: 180, file: 'apple-touch-icon.png', flatten: true },
  { src: icon, size: 32, file: 'favicon-32.png' },
];

for (const job of jobs) {
  let pipe = sharp(job.src, { density: 384 }).resize(job.size, job.size, { fit: 'contain' });
  if (job.flatten) pipe = pipe.flatten({ background: '#0f6e63' });
  await pipe.png().toFile(out(job.file));
  console.log('wrote', job.file, `${job.size}x${job.size}`);
}
console.log('done');
