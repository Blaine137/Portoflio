type Point = [number, number, number];

export type ParticleVariant = 'ribbon' | 'orbit' | 'lattice' | 'wave' | 'helix';

export interface ParticleArt {
  positions: Float32Array;
  intensities: Float32Array;
}

const turn = 2 * Math.PI;
const sections = 256;
const strands = 56;
const motes = 90;

// Sweep a flattened tube along a nonplanar ring. Twisting the tube lets one
// side billow into a broad fan while the other turns almost edge-on.
function surface(angle: number, ring: number): Point {
  const sweep = angle + 0.13 * Math.sin(2 * angle - 0.7);
  const twist = 1.5 * angle + 0.6 * Math.sin(angle + 0.4) - 1.28;
  const width = 0.41 + 0.07 * Math.cos(2 * angle + 0.35);
  const across = width * Math.cos(ring);
  const around = 0.12 * Math.sin(ring);
  const radius =
    0.56 +
    0.1 * Math.sin(3 * angle + 0.2) +
    across * Math.cos(twist) -
    around * Math.sin(twist);
  const x = radius * Math.cos(sweep);
  const y = radius * Math.sin(sweep);
  const z =
    0.37 * Math.sin(2 * angle - 0.45) +
    0.09 * Math.sin(3 * angle) +
    across * Math.sin(twist) +
    around * Math.cos(twist);

  // Tilt towards the viewer, then compose on a rising diagonal.
  const tiltedY = 0.81 * y - 0.586 * z;
  return [0.866 * x - 0.5 * tiltedY, 0.5 * x + 0.866 * tiltedY, 0.586 * y + 0.81 * z];
}

function light(angle: number, ring: number, point: Point): number {
  const along = surface(angle + 0.001, ring);
  const across = surface(angle, ring + 0.001);
  const ux = along[0] - point[0];
  const uy = along[1] - point[1];
  const uz = along[2] - point[2];
  const vx = across[0] - point[0];
  const vy = across[1] - point[1];
  const vz = across[2] - point[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz);
  const diffuse = Math.max(0, (-0.48 * nx + 0.6 * ny + 0.64 * nz) / length);
  const rim = (1 - Math.abs(nz) / length) ** 2;
  const depth = 0.75 + 0.24 * point[2];
  return Math.min(1, depth * (0.23 + 0.84 * diffuse + 0.27 * rim));
}

export function createParticleArt(variant: ParticleVariant = 'ribbon'): ParticleArt {
  if (variant !== 'ribbon') return createRouteArt(variant);
  const surfaceCount = sections * strands;
  const positions = new Float32Array((surfaceCount + motes) * 3);
  const intensities = new Float32Array(surfaceCount + motes);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let section = 0; section < sections; section++) {
    for (let strand = 0; strand < strands; strand++) {
      const index = section * strands + strand;
      const angle = (turn * section) / sections;
      const ring = (turn * strand) / strands + 0.24 * Math.sin(2 * angle + 0.3);
      const point = surface(angle, ring);
      positions.set(point, index * 3);
      intensities[index] = light(angle, ring, point);
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]);
      maxY = Math.max(maxY, point[1]);
    }
  }

  const scale = 1.86 / Math.max(maxX - minX, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  for (let i = 0; i < surfaceCount * 3; i += 3) {
    positions[i] = (positions[i] - centerX) * scale;
    positions[i + 1] = (positions[i + 1] - centerY) * scale;
    positions[i + 2] *= scale;
  }

  // Fixed seed keeps the sparse dust identical in WebGL and the print mask.
  let seed = 0x724cacca;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = surfaceCount; i < intensities.length; i++) {
    positions.set([(random() - 0.5) * 1.92, (random() - 0.5) * 1.92, -0.8], i * 3);
    intensities[i] = 0.08 + 0.28 * random();
  }
  return { positions, intensities };
}

// Route sculptures share the renderer, but have distinct silhouettes and motion.
function createRouteArt(variant: Exclude<ParticleVariant, 'ribbon'>): ParticleArt {
  const rows = 80;
  const columns = 160;
  const positions = new Float32Array(rows * columns * 3);
  const intensities = new Float32Array(rows * columns);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      const angle = u * turn;
      let point: Point;

      switch (variant) {
        case 'orbit': {
          const band = Math.floor(row / 16);
          const radius = 0.52 + band * 0.08 + (row % 16) * 0.002;
          const tilt = (band * Math.PI) / 5;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle) * 0.42;
          point = [
            x * Math.cos(tilt) - y * Math.sin(tilt),
            x * Math.sin(tilt) + y * Math.cos(tilt),
            radius * Math.sin(angle) * 0.55,
          ];
          break;
        }
        case 'lattice': {
          const x = (u - 0.5) * 1.6;
          const y = (v - 0.5) * 1.6;
          point = [
            x,
            y * 0.75 + x * 0.25,
            0.22 * Math.sin(u * turn) * Math.cos(v * turn),
          ];
          break;
        }
        case 'wave': {
          const x = (u - 0.5) * 1.72;
          const depth = (v - 0.5) * 1.4;
          point = [x, depth * 0.6 + 0.22 * Math.sin(x * 4 + depth * 2), depth * 0.5];
          break;
        }
        case 'helix': {
          const twist = v * turn * 1.5 + (row % 2) * Math.PI;
          const radius = 0.34 + u * 0.12;
          point = [radius * Math.cos(twist), (v - 0.5) * 1.7, radius * Math.sin(twist)];
          break;
        }
      }

      positions.set(point, index * 3);
      intensities[index] = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(angle + v * 3));
    }
  }

  return { positions, intensities };
}
