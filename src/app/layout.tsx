import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '../components/Header';
import { portfolio } from '../lib/portfolio';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '../styles/site.scss';

export const metadata: Metadata = {
  title: { default: 'Blaine Young | Software Engineer', template: '%s | Blaine Young' },
  description: 'Blaine Young is an Atlanta software engineer who builds search experiences and content platforms with Adobe Experience Manager and full-stack JavaScript.',
  icons: { icon: '/mark.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions can add body attributes before React hydrates. */}
      <body suppressHydrationWarning>
        <Header />
        {children}
        <footer className="footer">
          <div className="shell">
            <span>{portfolio.profile.name}</span>
            <span>{portfolio.profile.location}</span>
            <div id="motion-controls" />
          </div>
        </footer>
      </body>
    </html>
  );
}
