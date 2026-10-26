import { Suspense, useCallback, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useHotkey } from '../../hooks/useHotkey';
import { PageLoader } from '../ui';
import { CommandPalette } from './CommandPalette';
import { Navbar } from './Navbar';

export function AppLayout() {
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useHotkey('k', openSearch, { withModifier: true });
  useHotkey('/', openSearch);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar onOpenSearch={openSearch} />
      {/* The home page draws full-width bands; every other page sits in the content column. */}
      <main id="main" className={pathname === '/' ? 'page page--bleed' : 'page container'}>
        {/* Pages are lazy-loaded; this shows while a page's chunk downloads. */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Link to="/" className="site-footer__brand">CareMate</Link>
          <p>A portfolio project. Doctors, tests and prices are made up; no real bookings are made.</p>
          <p className="site-footer__keys">
            Press <kbd className="kbd">/</kbd> anywhere to search.
          </p>
        </div>
      </footer>
      <CommandPalette isOpen={searchOpen} onClose={closeSearch} />
    </>
  );
}
