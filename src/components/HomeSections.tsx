import Link from 'next/link';
import { portfolio } from '../lib/portfolio';
import { Icon } from './Icon';
import { RouteHero } from './RouteHero';

export function Hero() {
  const { profile } = portfolio;

  return (
    <RouteHero
      home
      variant="ribbon"
      label={profile.role}
      title={
        <>
          {profile.firstName}{' '}
          <em>
            {profile.lastName}
            <span>.</span>
          </em>
        </>
      }
    >
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
    </RouteHero>
  );
}
