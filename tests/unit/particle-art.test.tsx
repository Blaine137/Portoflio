import { describe, expect, it } from 'vitest';
import { createParticleArt, type ParticleVariant } from '../../src/lib/particle-art';

it.each<ParticleVariant>(['orbit', 'lattice', 'wave', 'helix'])(
  'creates a distinct, bounded %s sculpture with reproducible fallback geometry',
  (variant) => {
    const art = createParticleArt(variant);
    const repeated = createParticleArt(variant);
    expect(art.positions).toEqual(repeated.positions);
    expect(art.positions).not.toEqual(createParticleArt().positions);
    expect(art.positions.every(Number.isFinite)).toBe(true);
    expect(Math.max(...art.positions)).toBeLessThan(1);
    expect(Math.min(...art.positions)).toBeGreaterThan(-1);
    expect(art.intensities.length).toBeGreaterThan(10_000);
    expect(art.positions.length).toBe(art.intensities.length * 3);
  },
);

describe('the particle sculpture', () => {
  it('produces a complete point cloud contained in the square composition', () => {
    const { positions, intensities } = createParticleArt();
    expect(intensities.length).toBeGreaterThan(10_000);
    expect(positions.length).toBe(intensities.length * 3);
    const x = positions.filter((_, i) => i % 3 === 0);
    const y = positions.filter((_, i) => i % 3 === 1);
    const z = positions.filter((_, i) => i % 3 === 2);
    for (const axis of [x, y]) {
      expect(Math.min(...axis)).toBeGreaterThanOrEqual(-0.96);
      expect(Math.max(...axis)).toBeLessThanOrEqual(0.96);
      expect(Math.max(...axis) - Math.min(...axis)).toBeGreaterThan(1.7);
    }
    expect(Math.max(...z) - Math.min(...z)).toBeGreaterThan(1);
    expect(Math.min(...intensities)).toBeGreaterThan(0);
    expect(Math.max(...intensities)).toBeLessThanOrEqual(1);
    expect(Math.max(...intensities) - Math.min(...intensities)).toBeGreaterThan(0.6);
  });

  it('recreates the static composition independently of previous interactions', () => {
    const original = createParticleArt();
    const next = createParticleArt();
    expect(original.positions.every((value, i) => value === next.positions[i])).toBe(
      true,
    );
    expect(
      original.intensities.every((value, i) => value === next.intensities[i]),
    ).toBe(true);
    original.positions[0] += 0.25;
    expect(original.positions[0]).not.toEqual(next.positions[0]);
  });
});
