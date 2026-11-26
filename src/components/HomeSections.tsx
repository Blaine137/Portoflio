import Link from 'next/link';
import { portfolio } from '../lib/portfolio';
import { Icon } from './Icon';
import { ParticleField } from './ParticleField';

export function Hero() {
  const { profile } = portfolio;

  return (
    <section
      className="hero"
      aria-labelledby="hero-name"
    >
      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{profile.role}</p>
          <h1 id="hero-name">
            {profile.firstName}{' '}
            <em>
              {profile.lastName}
              <span>.</span>
            </em>
          </h1>
          <p className="hero-intro">{profile.intro}</p>
          <div className="actions">
            <Link
              className="button button-primary"
              href="/projects/"
              prefetch={false}
            >
              <Icon name="layers" />
              View projects
            </Link>
            <Link
              className="button button-secondary"
              href="/contact/"
              prefetch={false}
            >
              Get in touch
            </Link>
          </div>
          <p className="location">
            <Icon name="pin" />
            {profile.location}
          </p>
        </div>
        <ParticleField />
      </div>
    </section>
  );
}
