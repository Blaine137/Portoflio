import { PageMain } from '../../components/PageMain';
import type { Metadata } from 'next';
import { RouteHero } from '../../components/RouteHero';
import { portfolio } from '../../lib/portfolio';

export const metadata: Metadata = {
  title: 'About me',
  description: 'Meet Blaine Young, an Atlanta software engineer, and learn how he approaches complex problems by asking questions and breaking them into manageable pieces.',
};

export default function AboutPage() {
  const { about } = portfolio;

  return (
    <PageMain className="about-page">
      <RouteHero
        label={about.label}
        title={about.heading}
        variant="orbit"
      >
        <div className="personal-intro">
          <div className="portrait-frame">
            <img
              src="/blaine-young.jpg"
              width="1000"
              height="1000"
              alt="Blaine Young"
            />
          </div>
          <div className="personal-copy">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </RouteHero>
    </PageMain>
  );
}
