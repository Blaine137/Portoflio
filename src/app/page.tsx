import { Hero } from '../components/HomeSections';

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
