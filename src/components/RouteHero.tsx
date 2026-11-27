import type { ReactNode } from 'react';
import type { ParticleVariant } from '../lib/particle-art';
import { ParticleField } from './ParticleField';

interface RouteHeroProps {
  label: string;
  title: ReactNode;
  home?: boolean;
  variant: ParticleVariant;
  children: ReactNode;
}

export function RouteHero({ label, title, variant, children, home = false }: RouteHeroProps) {
  const headingId = home ? 'hero-name' : 'page-title';
  return (
    <section
      className={home ? 'hero' : 'hero route-hero'}
      aria-labelledby={headingId}
    >
      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{label}</p>
          <h1 id={headingId}>{title}</h1>
          {children}
        </div>
        <ParticleField variant={variant} />
      </div>
    </section>
  );
}
