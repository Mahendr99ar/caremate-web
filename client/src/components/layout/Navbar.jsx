import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api, useGetMeQuery, useLogoutMutation } from '../../services/api';
import { clearCart, selectCartCount } from '../../features/cart/cartSlice';

const NAV_LINKS = [
  { to: '/doctors', label: 'Doctors' },
  { to: '/lab-tests', label: 'Lab tests' },
  { to: '/medicines', label: 'Medicines' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Navbar({ onOpenSearch }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useGetMeQuery();
  const [logout] = useLogoutMutation();
  const cartCount = useSelector(selectCartCount);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      // Clear local state even if the request failed; the user asked to be logged out.
      // Pages that load the user's own data skip their queries once the user is
      // unknown (see useSignedInQueryOptions), so resetting here can't make them
      // refetch and hit a 401 while the navigation finishes.
      navigate('/');
      dispatch(api.util.resetApiState());
      dispatch(clearCart());
    }
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand__mark" aria-hidden="true" />
          CareMate
        </Link>

        <button type="button" className="search-trigger" onClick={onOpenSearch}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m14 14 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="search-trigger__text">Search doctors</span>
          <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>

        <nav id="primary-nav" className={`navbar__nav ${menuOpen ? 'navbar__nav--open' : ''}`} aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="navbar__link" onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/cart" className="navbar__link" onClick={closeMenu}>
            Cart
            {cartCount > 0 && (
              <span className="navbar__count" aria-label={`${cartCount} items`}>{cartCount}</span>
            )}
          </NavLink>

          {user ? (
            <>
              <NavLink to="/bookings" className="navbar__link" onClick={closeMenu}>My bookings</NavLink>
              <button type="button" className="navbar__link" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <NavLink to="/login" className="navbar__cta" onClick={closeMenu}>Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
