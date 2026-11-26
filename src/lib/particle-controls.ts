import type { createParticleRenderer } from './particle-renderer';

export type Renderer = ReturnType<typeof createParticleRenderer>;
export type Controls = Pick<Renderer, 'resize' | 'move' | 'leave' | 'playback'>;

export function canvasColors(canvas: HTMLCanvasElement) {
  const style = getComputedStyle(canvas);
  return {
    tint: style.getPropertyValue('--particle').trim(),
    highlight: style.getPropertyValue('--particle-light').trim(),
  };
}

export function bindParticleControls(canvas: HTMLCanvasElement, hero: HTMLElement, controls: Controls) {
  let paused = false;
  let visible = true;
  function playback() {
    controls.playback(!paused && visible && !document.hidden);
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    controls.resize(width, height, Math.min(window.devicePixelRatio, 2));
  }
  function move(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    controls.move(((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2);
  }
  const sizing = new ResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    playback();
  });
  sizing.observe(canvas);
  visibility.observe(canvas);
  hero.addEventListener('pointermove', move);
  hero.addEventListener('pointerleave', controls.leave);
  document.addEventListener('visibilitychange', playback);
  resize();
  playback();
  return {
    setPaused(value: boolean) {
      paused = value;
      playback();
    },
    dispose() {
      sizing.disconnect();
      visibility.disconnect();
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', controls.leave);
      document.removeEventListener('visibilitychange', playback);
    },
  };
}
