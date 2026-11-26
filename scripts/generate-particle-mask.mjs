// Regenerate from the same coordinates as the live renderer with Node 24.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { createParticleArt } from '../src/lib/particle-art.ts';

const size = 1120;
const variant = process.argv[2] || 'ribbon';
if (!['ribbon', 'orbit', 'lattice', 'wave', 'helix'].includes(variant)) {
  throw new Error(`Unknown particle variant: ${variant}`);
}
const opacity = new Float32Array(size * size);
const { positions, intensities } = createParticleArt(variant);
for (let index = 0; index < intensities.length; index++) {
  const x = ((positions[index * 3] + 1) * size) / 2;
  const y = ((1 - positions[index * 3 + 1]) * size) / 2;
  const light = intensities[index];
  const radius = 0.9 + 0.85 * light;
  for (let row = Math.floor(y - radius - 1); row <= Math.ceil(y + radius + 1); row++) {
    for (
      let col = Math.floor(x - radius - 1);
      col <= Math.ceil(x + radius + 1);
      col++
    ) {
      const distance = Math.hypot(col + 0.5 - x, row + 0.5 - y);
      const coverage = Math.min(1, Math.max(0, radius + 0.5 - distance));
      const pixel = row * size + col;
      opacity[pixel] += (1 - opacity[pixel]) * coverage * Math.min(1, light * 1.32);
    }
  }
}

// The fallback is a white alpha mask, so CSS can recolor it with a Sass token.
const stride = 1 + size * 2;
const scanlines = Buffer.alloc(stride * size);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const offset = y * stride + 1 + x * 2;
    scanlines[offset] = 255;
    scanlines[offset + 1] = Math.round(opacity[y * size + x] * 255);
  }
}

function chunk(type, data) {
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length);
  result.write(type, 4, 'ascii');
  data.copy(result, 8);
  let crc = 0xffffffff;
  for (const byte of result.subarray(4, -4)) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
const header = Buffer.alloc(13);
header.writeUInt32BE(size);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 4;
const filename =
  variant === 'ribbon' ? 'particle-field.png' : `particle-${variant}.png`;
writeFileSync(
  new URL(`../public/${filename}`, import.meta.url),
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
