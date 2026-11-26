import { afterEach, expect, it, vi } from 'vitest';
import type { Scene, Points, ShaderMaterial } from 'three';
import { startParticleScene } from '../../src/lib/particle-scene';

const renderer = vi.hoisted(() => ({
  render: vi.fn(),
  setClearColor: vi.fn(),
  setDrawingBufferSize: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: class {
    constructor() {
      return renderer;
    }
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

it('eases nearby points toward the cursor and back, bounds resolution and releases rendering resources', () => {
  const hero = document.createElement('section'),
    canvas = document.createElement('canvas');
  hero.append(canvas);
  document.body.append(hero);
  canvas.style.setProperty('--particle', '#c89eff');
  canvas.style.setProperty('--particle-light', '#f3eaff');
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(20, 10, 600, 600),
  );
  vi.stubGlobal('devicePixelRatio', 3);
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    frames.push(callback),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  let visibility!: (entries: { isIntersecting: boolean }[]) => void;
  let resize!: () => void;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      disconnect = disconnect;
      constructor(callback: typeof visibility) {
        visibility = callback;
      }
    },
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = disconnect;
      constructor(callback: typeof resize) {
        resize = callback;
      }
    },
  );
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const onLoss = vi.fn();
  const handle = startParticleScene(canvas, hero, onLoss);
  const scene: Scene = renderer.render.mock.calls[0][0];
  const points = scene.children[0] as Points;
  const material = points.material as ShaderMaterial;
  const geometryDispose = vi.spyOn(points.geometry, 'dispose');
  const materialDispose = vi.spyOn(material, 'dispose');
  expect(renderer.setDrawingBufferSize).toHaveBeenCalledWith(600, 600, 2);
  resize();
  expect(renderer.render).toHaveBeenCalledTimes(1);
  vi.stubGlobal('devicePixelRatio', 1);
  resize();
  expect(renderer.setDrawingBufferSize).toHaveBeenCalledWith(600, 600, 1);
  hero.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 200 }));
  const start = performance.now() + 100;
  frames.at(-1)!(start);
  const pull = material.uniforms.strength.value;
  expect(pull).toBeGreaterThan(0);
  expect(material.uniforms.cursor.value.x).toBeGreaterThan(0);
  expect(material.uniforms.cursor.value.y).toBeGreaterThan(0);
  hero.dispatchEvent(new Event('pointerleave'));
  frames.at(-1)!(start + 16);
  expect(material.uniforms.strength.value).toBeLessThan(pull);

  handle.setPaused(true);
  const count = frames.length;
  visibility([{ isIntersecting: false }]);
  handle.setPaused(false);
  expect(frames).toHaveLength(count);
  hidden.mockReturnValue(true);
  visibility([{ isIntersecting: true }]);
  expect(frames).toHaveLength(count);
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames).toHaveLength(count + 1);

  const loss = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(loss);
  expect(loss.defaultPrevented).toBe(true);
  expect(onLoss).toHaveBeenCalledOnce();
  handle.dispose();
  canvas.dispatchEvent(new Event('webglcontextlost'));
  expect(onLoss).toHaveBeenCalledOnce();
  expect(disconnect).toHaveBeenCalledTimes(2);
  expect(geometryDispose).toHaveBeenCalledOnce();
  expect(materialDispose).toHaveBeenCalledOnce();
  expect(renderer.dispose).toHaveBeenCalledOnce();
});
