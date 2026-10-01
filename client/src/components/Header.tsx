import { ChevronDown, Mail, Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useText } from '../lib/content';
import { NAV, SITE, telHref } from '../lib/site';
import { A11yControls } from './A11yControls';
import { Logo } from './Logo';

export function Header() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const t = useText();
  const announcement = t('site.announcement');

  useEffect(() => {
    setOpen(false);
    setExpanded(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {announcement && <div className="announcement">{announcement}</div>}
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__contact">
            <a href={telHref(SITE.phones[0])}>
              <Phone size={14} /> {SITE.phones[0]}
            </a>
            <a href={`mailto:${SITE.email}`} className="hide-sm">
              <Mail size={14} /> {SITE.email}
            </a>
            <span className="hide-md">{SITE.act}</span>
          </div>
          <A11yControls />
        </div>
      </div>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand" aria-label="G|K Ventures home">
            <Logo />
          </Link>
          <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
          <nav className={`nav ${open ? 'nav--open' : ''}`} aria-label="Main">
            <ul>
              {NAV.map((item) => (
                <li key={item.to} className={item.children ? 'has-dropdown' : ''}>
                  <div className="nav__row">
                    <NavLink to={item.to} end={item.to === '/'}>
                      {item.label}
                    </NavLink>
                    {item.children && (
                      <button
                        className="nav__expand"
                        aria-label={`Show ${item.label} pages`}
                        aria-expanded={expanded === item.to}
                        onClick={() => setExpanded(expanded === item.to ? null : item.to)}
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <ul className={`dropdown ${expanded === item.to ? 'dropdown--open' : ''}`}>
                      {item.children.map((c) => (
                        <li key={c.to}>
                          <NavLink to={c.to} end>
                            {c.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <Link to="/contact" className="btn btn--gold nav__cta">
              Book a Consultation
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
