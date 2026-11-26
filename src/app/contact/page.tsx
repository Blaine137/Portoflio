import type { Metadata } from 'next';
import { Contact } from '../../components/Contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Blaine Young about software engineering roles and projects, or connect with him on LinkedIn and GitHub.',
};

export default function ContactPage() {
  return (
    <main
      id="main-content"
      className="contact-page"
      tabIndex={-1}
    >
      <Contact />
    </main>
  );
}
