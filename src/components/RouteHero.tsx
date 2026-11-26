import type { ReactNode } from 'react';
import type { ParticleVariant } from '../lib/particle-art';
import { ParticleField } from './ParticleField';

interface RouteHeroProps {
  label: string;
  title: string;
  variant: ParticleVariant;
  children: ReactNode;
}

export function RouteHero({ label, title, variant, children }: RouteHeroProps) {
  return (
    <section
      className="hero route-hero"
      aria-labelledby="page-title"
    >
      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{label}</p>
          <h1 id="page-title">{title}</h1>
          {children}
        </div>
        <ParticleField variant={variant} />
      </div>
    </section>
  );
}
