import { PageMain } from '../../components/PageMain';
import type { Metadata } from 'next';
import { RouteHero } from '../../components/RouteHero';
import { portfolio } from '../../lib/portfolio';

export const metadata: Metadata = {
  title: 'Résumé',
  description: 'Read Blaine Young’s software engineering résumé online or download the original PDF to save or print.',
};

export default function ResumePage() {
  const { profile, resume } = portfolio;

  return (
    <PageMain className="resume">
      <RouteHero
        label={profile.name}
        title={resume.title}
        variant="helix"
      >
        <p className="hero-intro">{resume.description}</p>
        <div className="actions">
          <a
            className="button button-primary"
            href={resume.file}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open résumé PDF
          </a>
          <a
            className="button button-secondary"
            href={resume.file}
            download
          >
            Download résumé
          </a>
        </div>
      </RouteHero>
      <section
        className="shell resume-shell"
        aria-label="Original résumé PDF"
      >
        <object
          className="resume-document"
          data={`${resume.file}#view=FitH`}
          type="application/pdf"
          aria-label="Blaine Young’s original résumé"
        >
          <p>
            This browser cannot display the PDF here.{' '}
            <a href={resume.file}>Open the original résumé</a> to read or print it.
          </p>
        </object>
      </section>
    </PageMain>
  );
}
