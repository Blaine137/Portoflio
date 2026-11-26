import type { Viewport } from 'next';
import { Hero } from '../components/HomeSections';

export const viewport: Viewport = { viewportFit: 'cover' };

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="home-page"
      tabIndex={-1}
    >
      <Hero />
    </main>
  );
}
