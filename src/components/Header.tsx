'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { portfolio } from '../lib/portfolio';
import { Icon } from './Icon';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current!.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="header">
      <a
        className="skip"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="shell header-inner">
        <Link
          className="brand"
          href="/"
          prefetch={false}
          aria-label="Blaine Young, home"
          onClick={() => setOpen(false)}
        >
          <span
            className="monogram"
            aria-hidden="true"
          />
          <span>{portfolio.profile.name}</span>
        </Link>
        <button
          type="button"
          className="menu-toggle js-enhanced"
          aria-controls="site-nav"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          ref={menuButton}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <nav
          id="site-nav"
          aria-label="Main navigation"
          className={open ? 'nav nav-open' : 'nav'}
        >
          {portfolio.navigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              aria-current={
                pathname.replace(/\/$/, '') === link.href.replace(/\/$/, '')
                  ? 'page'
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {link.label === 'Contact' && <Icon name="mail" />}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
