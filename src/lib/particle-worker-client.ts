import type { ParticleVariant } from './particle-art';
import type { SceneMessage } from './particle-scene.worker';
import { bindParticleControls, canvasColors } from './particle-controls';

export function startWorkerScene(
  placeholder: HTMLCanvasElement,
  hero: HTMLElement,
  variant: ParticleVariant,
  onReady: () => void,
  onFailure: () => void,
) {
  // A transferred canvas cannot be reclaimed for the main-thread fallback.
  const canvas = placeholder.cloneNode(false) as HTMLCanvasElement;
  const surface = canvas.transferControlToOffscreen();
  const worker = new Worker(new URL('./particle-scene.worker.ts', import.meta.url));
  const send = (message: SceneMessage) => worker.postMessage(message);
  canvas.addEventListener('webglcontextlost', onFailure);
  placeholder.after(canvas);
  try {
    worker.onmessage = event => event.data === 'ready' ? onReady() : onFailure();
    worker.onerror = onFailure;
    const init: SceneMessage = { type: 'init', canvas: surface, colors: canvasColors(canvas), variant };
    worker.postMessage(init, [surface]);
    const controls = bindParticleControls(canvas, hero, {
      resize: (width, height, ratio) => send({ type: 'resize', width, height, ratio }),
      playback: running => send({ type: 'playback', running }),
      move: (x, y) => send({ type: 'move', x, y }),
      leave: () => send({ type: 'leave' }),
    });
    return {
      setPaused: controls.setPaused,
      dispose() {
        controls.dispose();
        release();
      },
    };
  } catch (error) {
    release();
    throw error;
  }
  function release() {
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    canvas.removeEventListener('webglcontextlost', onFailure);
    canvas.remove();
  }
}

