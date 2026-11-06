import { useEffect, useState } from 'react';
import { site } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { useSiteConfig } from '../../context/SiteConfig';
import { heroRoles, heroDescription, heroHighlights } from '../../data/content';
import { NetworkCanvas } from '../background/NetworkCanvas';
import { SocialIcon } from '../ui/SocialIcon';
import { ArrowUpRight, ChevronDown, MapPin, Newspaper, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoMark } from '../brand/Logo';

export function Hero() {
  const { lang, t, tr } = usePrefs();
  const { openBlogHub, isSectionVisible } = useSiteConfig();
  const [roleIndex, setRoleIndex] = useState(0);

  // Cycling animated roles headline
  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % heroRoles.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="top" className="hero-section" data-float-scale="1.15">
      {/* Background network canvas */}
      <NetworkCanvas />

      <div className="container hero-container">
        <div className="hero-grid">
          {/* Main content column */}
          <div className="hero-content">
            {/* Status indicator / location badge */}
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="status-ping" aria-hidden="true">
                <span className="ping-circle" />
                <span className="ping-dot" />
              </span>
              <span className="badge-text">
                <MapPin size={14} className="badge-icon text-electric" />
                {t.hero.status}: {tr(site.locationShort)}
              </span>
            </motion.div>

            {/* Main Greeting & Names */}
            <motion.div
              className="hero-headings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="hero-greeting">{t.hero.hello}</p>
              <h1 className="hero-name">
                <span className="name-primary">{site.name.ar}</span>
                <span className="name-secondary" dir="ltr">
                  / {site.name.en}
                </span>
              </h1>
            </motion.div>

            {/* Smooth animated role switcher */}
            <div className="hero-role-wrapper">
              <span className="role-prefix">
                <Sparkles size={18} className="text-electric" />
              </span>
              <div className="role-carousel" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${roleIndex}-${lang}`}
                    className="role-text"
                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                    transition={{ duration: 0.45 }}
                  >
                    {tr(heroRoles[roleIndex])}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Short professional description */}
            <motion.p
              className="hero-desc"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {tr(heroDescription)}
            </motion.p>

            {/* Main CTA buttons */}
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <a href="#work" className="btn btn-primary">
                <span>{t.hero.explore}</span>
                <ArrowUpRight size={18} />
              </a>
              {isSectionVisible('blog') && (
                <button
                  type="button"
                  className="btn btn-blog-hero"
                  onClick={() => openBlogHub()}
                >
                  <Newspaper size={18} />
                  <span>{t.blog.openHub}</span>
                  <ArrowUpRight size={17} />
                </button>
              )}
              <a href="#contact" className="btn btn-secondary">
                <span>{t.hero.contact}</span>
              </a>
            </motion.div>

            {/* Direct social bar */}
            <motion.div
              className="hero-social"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {site.social.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-social-link"
                  aria-label={`${tr(s.label)} (${s.handle})`}
                  title={`${tr(s.label)}: ${s.handle}`}
                >
                  <SocialIcon id={s.id} size={20} />
                  <span className="social-handle">{s.handle}</span>
                </a>
              ))}
            </motion.div>
          </div>

          {/* Reserved visual dock zone for Floating Logo & Personal Portrait */}
          <div className="hero-visual-zone" data-float-dock data-float-scale="1.25">
            <div className="hero-dock-glow" />
            <div className="hero-portrait-frame">
              <img
                src="/ali-sami.jpg"
                alt="Ali Sami — علي سامي"
                className="hero-portrait-img"
              />
              <div className="portrait-corner-accent top-left" />
              <div className="portrait-corner-accent bottom-right" />
              <div className="hero-portrait-badge">
                <LogoMark size={38} animated={true} />
              </div>
            </div>
            <div className="hero-highlights">
              {heroHighlights.map((h, i) => {
                const Icon = h.icon;
                return (
                  <motion.div
                    key={i}
                    className="highlight-chip"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  >
                    <Icon size={17} className="text-electric" />
                    <span>{tr(h.label)}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="hero-scroll-hint">
          <a href="#about" aria-label={t.hero.scroll}>
            <span className="scroll-hint-text">{t.hero.scroll}</span>
            <ChevronDown size={18} className="scroll-arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
