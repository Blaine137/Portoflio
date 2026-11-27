import { PageMain } from '../../components/PageMain';
import type { Metadata } from 'next';
import { RouteHero } from '../../components/RouteHero';
import { SelectedWork } from '../../components/SelectedWork';
import { portfolio } from '../../lib/portfolio';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore websites Blaine Young has worked on for Mastercard, UNC Health, Credit One Bank, Jefferson Health, and the Robert Wood Johnson Foundation.',
};

export default function ProjectsPage() {
  const { work } = portfolio;

  return (
    <PageMain>
      <RouteHero
        label={work.label}
        title={work.heading}
        variant="lattice"
      >
        <p className="hero-intro">{work.description}</p>
      </RouteHero>
      <SelectedWork />
    </PageMain>
  );
}
