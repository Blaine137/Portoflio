import { portfolio, type ProfileLink } from '../lib/portfolio';
import { RouteHero } from './RouteHero';
import { Icon } from './Icon';

export function ContactLinks({ links }: { links: ProfileLink[] }) {
  return (
    <ul
      className="profile-links"
      aria-label="Professional profiles"
    >
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  );
}

export function Contact() {
  const { contact, profile } = portfolio;

  return (
    <RouteHero
      label={contact.label}
      title={contact.heading}
      variant="wave"
    >
      <div className="contact-copy">
        <p className="hero-intro">{contact.description}</p>
        <a
          className="email-link"
          href={`mailto:${profile.email}`}
        >
          <Icon name="mail" />
          {profile.email}
        </a>
        <ContactLinks links={contact.profiles} />
      </div>
    </RouteHero>
  );
}
