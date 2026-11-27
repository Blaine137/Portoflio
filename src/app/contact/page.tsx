import { PageMain } from '../../components/PageMain';
import type { Metadata } from 'next';
import { Contact } from '../../components/Contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Blaine Young about software engineering roles and projects, or connect with him on LinkedIn and GitHub.',
};

export default function ContactPage() {
  return (
    <PageMain className="contact-page">
      <Contact />
    </PageMain>
  );
}
