import { useEffect, useState } from 'react';
import { Logo } from '../brand/Logo';
import { usePrefs } from '../../context/Preferences';
import { useActiveSection, useScrolledPast, useScrollProgress } from '../../hooks/useScroll';
import { Moon, Sun, Languages, Menu, X, Play, Pause } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'about', labelKey: 'about' as const },
  { id: 'services', labelKey: 'services' as const },
  { id: 'work', labelKey: 'work' as const },
  { id: 'studies', labelKey: 'studies' as const },
  { id: 'internet', labelKey: 'internet' as const },
  { id: 'contact', labelKey: 'contact' as const },
];

export function Navbar() {
  const { theme, motion, t, toggleLang, toggleTheme, toggleMotion } = usePrefs();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isScrolled = useScrolledPast(40);
  const scrollProgress = useScrollProgress();
  const activeSection = useActiveSection(NAV_ITEMS.map((item) => item.id));

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}
      data-float-header
    >
      {/* Glowing Top Scroll Progress Bar */}
      <div className="scroll-progress-track" aria-hidden="true">
        <div
          className="scroll-progress-bar"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>

      <a href="#main-content" className="skip-link">
        {t.a11y.skip}
      </a>

      <div className="header-inner container">
        {/* Brand Lockup */}
        <a
          href="#top"
          className="brand-link"
          onClick={closeMobile}
          aria-label={t.a11y.homeLink}
        >
          <Logo markSize={34} showTagline={false} />
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <a
                    href={`#${item.id}`}
                    className={`nav-link ${isActive ? 'is-active' : ''}`}
                  >
                    {t.nav[item.labelKey]}
                    {isActive && <span className="active-dot" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Action Controls (Theme, Language, Motion) */}
        <div className="header-controls">
          {/* Language Switch */}
          <button
            type="button"
            className="ctrl-btn ctrl-lang"
            onClick={toggleLang}
            aria-label={t.controls.switchLangLabel}
            title={t.controls.switchLang}
          >
            <Languages size={17} />
            <span className="ctrl-lang-text">{t.controls.switchLangShort}</span>
          </button>

          {/* Theme Switch */}
          <button
            type="button"
            className="ctrl-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.controls.themeToLight : t.controls.themeToDark}
            title={theme === 'dark' ? t.controls.themeToLight : t.controls.themeToDark}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Motion Toggle */}
          <button
            type="button"
            className={`ctrl-btn ctrl-motion ${!motion ? 'is-disabled' : ''}`}
            onClick={toggleMotion}
            aria-label={motion ? t.controls.motionOff : t.controls.motionOn}
            title={motion ? t.controls.motionOff : t.controls.motionOn}
          >
            {motion ? <Pause size={17} /> : <Play size={17} />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="ctrl-btn mobile-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? t.a11y.menuClose : t.a11y.menuOpen}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="drawer-overlay" onClick={closeMobile} />
        <div className="drawer-panel">
          <nav className="drawer-nav">
            <ul className="drawer-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="drawer-link"
                    onClick={closeMobile}
                  >
                    {t.nav[item.labelKey]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
