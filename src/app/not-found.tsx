import { PageMain } from '../components/PageMain';
export default function NotFound() {
  return (
    <PageMain className="shell missing">
      <h1>Page not found</h1>
      <a
        className="text-link"
        href="/"
      >
        Return to the portfolio
      </a>
    </PageMain>
  );
}
