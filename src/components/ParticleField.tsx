'use client';

import { useEffect, useRef, useState } from 'react';
import type { ParticleVariant } from '../lib/particle-art';
import type { startParticleScene } from '../lib/particle-scene';
import { startWorkerScene } from '../lib/particle-worker-client';
import { Icon } from './Icon';

type SceneHandle = ReturnType<typeof startParticleScene>;

export function ParticleField({ variant = 'ribbon' }: { variant?: ParticleVariant }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneHandle | null>(null);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: no-preference)');
    let revision = 0;

    function stop() {
      revision++;
      scene.current?.dispose();
      scene.current = null;
      setActive(false);
      setPaused(false);
    }

    async function sync() {
      stop();
      if (!preference.matches) return;

      const current = revision;
      const element = canvas.current!;
      const hero = element.closest('section')!;
      async function fallback() {
        stop();
        const request = revision;
        try {
          const { startParticleScene } = await import('../lib/particle-scene');
          if (request !== revision) return;
          scene.current = startParticleScene(element, hero, stop, variant);
          setActive(true);
        } catch {
          // Keep the illustrated fallback when WebGL is unavailable.
        }
      }

      try {
        scene.current = startWorkerScene(element, hero, variant, () => {
          if (current === revision) setActive(true);
        }, () => {
          if (current === revision) void fallback();
        });
      } catch {
        await fallback();
      }
    }

    void sync();
    preference.addEventListener('change', sync);
    return () => {
      preference.removeEventListener('change', sync);
      stop();
    };
  }, [variant]);

  function toggle() {
    scene.current!.setPaused(!paused);
    setPaused(!paused);
  }

  return (
    <div
      className="particle-field"
      data-active={active}
      data-variant={variant}
    >
      <div
        className="particle-surface"
        aria-hidden="true"
      >
        <div className="particle-mask" />
        <canvas ref={canvas} />
      </div>
      {active && (
        <button
          type="button"
          className="motion-control"
          onClick={toggle}
        >
          <Icon name={paused ? 'play' : 'pause'} />
          {paused ? 'Resume animation' : 'Pause animation'}
        </button>
      )}
    </div>
  );
}
