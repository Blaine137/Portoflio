import { afterEach, expect, it, vi } from 'vitest';
import { startWorkerScene } from '../../src/lib/particle-worker-client';
import { bindParticleControls, type Controls } from '../../src/lib/particle-controls';
import { createParticleRenderer } from '../../src/lib/particle-renderer';

vi.mock('../../src/lib/particle-renderer', () => ({ createParticleRenderer: vi.fn() }));
vi.mock('../../src/lib/particle-controls', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/lib/particle-controls')>(),
  bindParticleControls: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

it('initializes, draws and animates the worker canvas and reports context loss', async () => {
  const previous = self.onmessage;
  const post = vi.spyOn(self, 'postMessage').mockImplementation(() => {});
  const engine = { resize: vi.fn(), move: vi.fn(), leave: vi.fn(), playback: vi.fn(), dispose: vi.fn() };
  vi.mocked(createParticleRenderer).mockReturnValue(engine);
  const canvas = new EventTarget();
  try {
    await import('../../src/lib/particle-scene.worker');
    const send = (data: object) => self.onmessage!(new MessageEvent('message', { data }));
    send({ type: 'init', canvas, colors: {}, variant: 'wave' });
    send({ type: 'resize', width: 320, height: 320, ratio: 2 });
    send({ type: 'resize', width: 300, height: 300, ratio: 1 });
    send({ type: 'move', x: 0.5, y: 0 });
    send({ type: 'leave' });
    send({ type: 'playback', running: false });
    expect(post.mock.calls).toEqual([['ready']]);
    expect(engine.resize).toHaveBeenCalledWith(320, 320, 2);
    expect(engine.move).toHaveBeenCalledWith(0.5, 0);
    expect(engine.leave).toHaveBeenCalledOnce();
    expect(engine.playback).toHaveBeenCalledWith(false);
    canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(post).toHaveBeenLastCalledWith('lost');
  } finally { self.onmessage = previous; }
});

it('bridges DOM input to the worker and releases the canvas on disposal or failed startup', () => {
  const hero = document.createElement('section');
  const placeholder = document.createElement('canvas');
  hero.append(placeholder);
  document.body.append(hero);
  const surface = {};
  const proto = HTMLCanvasElement.prototype;
  Object.defineProperty(proto, 'transferControlToOffscreen', { configurable: true, value: () => surface });
  const worker = { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null as unknown as (event: { data: string }) => void };
  vi.stubGlobal('Worker', class { constructor() { return worker; } });
  const dispose = vi.fn();
  vi.mocked(bindParticleControls).mockReturnValue({ dispose, setPaused: vi.fn() });
  const ready = vi.fn(), failure = vi.fn();
  try {
    const handle = startWorkerScene(placeholder, hero, 'orbit', ready, failure);
    const controls: Controls = vi.mocked(bindParticleControls).mock.calls[0][2];
    controls.resize(320, 300, 2);
    controls.move(0.5, 0);
    controls.leave();
    controls.playback(false);
    expect(worker.postMessage.mock.calls.slice(1)).toEqual([
      [{ type: 'resize', width: 320, height: 300, ratio: 2 }],
      [{ type: 'move', x: 0.5, y: 0 }], [{ type: 'leave' }], [{ type: 'playback', running: false }],
    ]);
    worker.onmessage({ data: 'ready' });
    worker.onmessage({ data: 'lost' });
    expect(ready).toHaveBeenCalledOnce();
    expect(failure).toHaveBeenCalledOnce();
    handle.dispose();
    expect(dispose).toHaveBeenCalledOnce();
    worker.postMessage.mockImplementationOnce(() => { throw Error('transfer failed'); });
    expect(() => startWorkerScene(placeholder, hero, 'orbit', ready, failure)).toThrow();
    expect(worker.terminate).toHaveBeenCalledTimes(2);
    expect(hero.children).toHaveLength(1);
  } finally { Reflect.deleteProperty(proto, 'transferControlToOffscreen'); }
});
