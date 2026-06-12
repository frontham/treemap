/* One-off: rasterize the PWA icons from public/icons/icon-source.svg. */
import sharp from 'sharp';

const src = 'public/icons/icon-source.svg';
const out = [
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'src/app/apple-icon.png', size: 180 },
];

for (const { file, size } of out) {
  await sharp(src, { density: 300 }).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
