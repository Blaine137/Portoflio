import { createParticleArt, type ParticleVariant } from './particle-art';
import { createParticleRenderer } from './particle-renderer';

export type SceneMessage =
  | { type: 'init'; canvas: OffscreenCanvas; colors: { tint: string; highlight: string }; variant: ParticleVariant }
  | { type: 'resize'; width: number; height: number; ratio: number }
  | { type: 'playback'; running: boolean }
  | { type: 'move'; x: number; y: number }
  | { type: 'leave' };

let renderer: ReturnType<typeof createParticleRenderer>;
let ready = false;
self.onmessage = ({ data }: MessageEvent<SceneMessage>) => {
  switch (data.type) {
    case 'init':
      data.canvas.addEventListener('webglcontextlost', () => self.postMessage('lost'));
      renderer = createParticleRenderer(data.canvas, data.colors, data.variant, createParticleArt(data.variant));
      break;
    case 'resize':
      renderer.resize(data.width, data.height, data.ratio);
      if (!ready) {
        ready = true;
        self.postMessage('ready');
      }
      break;
    case 'playback': renderer.playback(data.running); break;
    case 'move': renderer.move(data.x, data.y); break;
    case 'leave': renderer.leave(); break;
  }
};
