import { site } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { SocialIcon } from '../ui/SocialIcon';
import { Logo } from '../brand/Logo';
import { ArrowUp, MapPin } from 'lucide-react';

export function Footer() {
  const { t, tr } = usePrefs();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer" data-float-avoid>
      <div className="container footer-inner">
        <div className="footer-top">
          {/* Brand info */}
          <div className="footer-brand-col">
            <Logo markSize={36} showTagline={true} />
            <p className="footer-tagline">{t.footer.tagline}</p>
            <div className="footer-location">
              <MapPin size={16} className="text-electric" />
              <span>{tr(site.location)}</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">{t.footer.quickLinks}</h3>
            <ul className="footer-links">
              <li><a href="#about">{t.nav.about}</a></li>
              <li><a href="#services">{t.nav.services}</a></li>
              <li><a href="#work">{t.nav.work}</a></li>
              <li><a href="#studies">{t.nav.studies}</a></li>
              <li><a href="#internet">{t.nav.internet}</a></li>
              <li><a href="#contact">{t.nav.contact}</a></li>
            </ul>
          </div>

          {/* Social connections */}
          <div className="footer-social-col">
            <h3 className="footer-col-title">{t.footer.social}</h3>
            <div className="footer-social-icons">
              {site.social.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                  aria-label={`${tr(item.label)} (${item.handle})`}
                  title={`${tr(item.label)}: ${item.handle}`}
                >
                  <SocialIcon id={item.id} size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} {site.brand} — {site.brandTagline}. {t.footer.rights}
          </p>
          <div className="footer-actions">
            <button
              type="button"
              className="back-to-top-btn"
              onClick={scrollToTop}
              aria-label={t.a11y.toTop}
            >
              <ArrowUp size={16} />
              <span>{t.a11y.toTop}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
