import { createParticleArt, type ParticleVariant } from './particle-art';
import { bindParticleControls, canvasColors } from './particle-controls';
import { createParticleRenderer } from './particle-renderer';

export function startParticleScene(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  onLoss: () => void,
  variant: ParticleVariant = 'ribbon',
) {
  const renderer = createParticleRenderer(canvas, canvasColors(canvas), variant, createParticleArt(variant));
  const controls = bindParticleControls(canvas, hero, renderer);
  function contextLost(event: Event) {
    event.preventDefault();
    onLoss();
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  return {
    setPaused: controls.setPaused,
    dispose() {
      canvas.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      renderer.dispose();
    },
  };
}
