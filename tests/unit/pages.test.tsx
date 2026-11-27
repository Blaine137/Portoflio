import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import HomePage from '../../src/app/page';
import AboutPage from '../../src/app/about/page';
import ProjectsPage from '../../src/app/projects/page';
import ContactPage from '../../src/app/contact/page';
import RootLayout, { metadata } from '../../src/app/layout';
import ResumePage, { metadata as resumeMetadata } from '../../src/app/resume/page';
import NotFound from '../../src/app/not-found';
import { Header } from '../../src/components/Header';
import { portfolio } from '../../src/lib/portfolio';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('renders separate, accessible routes without JavaScript and keeps personal content separate', () => {
  const pages = [
    <HomePage />,
    <AboutPage />,
    <ProjectsPage />,
    <ResumePage />,
    <ContactPage />,
  ].map((page) => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<RootLayout>{page}</RootLayout>),
      'text/html',
    );
    expect(doc.documentElement.lang).toBe('en');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(doc.querySelector('a[href="#main-content"]')).not.toBeNull();
    expect(doc.querySelector('main#main-content')).not.toBeNull();
    expect(doc.querySelector('a[href^="tel:"]')).toBeNull();
    expect(doc.querySelectorAll('.particle-field')).toHaveLength(1);
    expect(doc.querySelector('footer')!.textContent).toBe(`© ${new Date().getFullYear()} ${portfolio.profile.name}`);
    return doc;
  });

  expect(metadata.title).toHaveProperty('template');
  expect(resumeMetadata.title).toBe('Résumé');
  expect(pages[0].querySelector('.project')).toBeNull();
  expect(pages[1].querySelector('main')!.textContent).not.toMatch(
    /résumé|resume|career|professional|developer|engineer|Mastercard|AEM/i,
  );
  expect(pages[1].querySelector('main a[href="/resume/"]')).toBeNull();
  expect(pages[2].querySelectorAll('.project .text-link')).toHaveLength(5);
  for (const project of portfolio.work.projects) {
    expect(pages[2].querySelector(`a[href="${project.url}"]`)).not.toBeNull();
  }
  expect(pages[2].querySelector('.project a[href*="github.com"]')).toBeNull();
  expect(pages[3].querySelector('object')!.getAttribute('data')).toBe(
    `${portfolio.resume.file}#view=FitH`,
  );
  expect(pages[3].querySelector('.experience-entry')).toBeNull();
  for (const profile of portfolio.contact.profiles) {
    expect(pages[4].querySelector(`a[href="${profile.href}"]`)).not.toBeNull();
  }
  expect(pages[4].querySelector('a[href^="mailto:"]')).not.toBeNull();
  expect(
    new Set(
      pages.map((page) =>
        page.querySelector('.particle-field')!.getAttribute('data-variant'),
      ),
    ).size,
  ).toBe(5);
});

it('keeps the selected website links, including the owner’s Mastercard update', () => {
  expect(portfolio.work.projects.map((project) => project.url)).toEqual([
    'https://www.mastercard.com/us/en.html',
    'https://www.unchealth.org/home',
    'https://www.creditonebank.com/',
    'https://www.jeffersonhealth.org/home',
    'https://www.rwjf.org/en/robert-wood-johnson-foundation.html',
  ]);
});

it('opens and closes navigation, restores focus and marks the current route', () => {
  vi.mocked(usePathname).mockReturnValue('/projects');
  render(<Header />);
  const toggle = screen.getByRole('button', { name: 'Open menu' });
  expect(
    screen.getByRole('link', { name: 'Projects' }).getAttribute('aria-current'),
  ).toBe('page');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(toggle);
  expect(toggle.getAttribute('aria-label')).toBe('Open menu');
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('link', { name: 'Projects' }));
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('link', { name: 'Blaine Young, home' }));
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

it('links to the original PDF for viewing and downloading and offers a return from a missing page', () => {
  render(<ResumePage />);
  const open = screen.getByRole('link', { name: 'Open résumé PDF' });
  const download = screen.getByRole('link', { name: 'Download résumé' });
  expect(open.getAttribute('href')).toBe(portfolio.resume.file);
  expect(open.getAttribute('target')).toBe('_blank');
  expect(download.getAttribute('href')).toBe(portfolio.resume.file);
  expect(download.hasAttribute('download')).toBe(true);
  expect(
    screen.getByRole('link', { name: 'Open the original résumé' }).getAttribute('href'),
  ).toBe(portfolio.resume.file);
  render(<NotFound />);
  expect(screen.getByText('Return to the portfolio').getAttribute('href')).toBe('/');
});
