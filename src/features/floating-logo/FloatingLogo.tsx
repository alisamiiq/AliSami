import { useEffect, useRef } from 'react';
import { LogoMark } from '../../components/brand/Logo';
import { usePrefs } from '../../context/Preferences';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { FloatingLogoEngine } from './engine';

/**
 * The flying ALI SAMI logo.
 * Rendered in its own fixed layer *below* the content (z-index), with pointer-events disabled,
 * so it can never block text, buttons or links. Disabled when motion is off.
 */
export function FloatingLogo() {
  const { motion, lang } = usePrefs();
  const isMobile = useMediaQuery('(max-width: 760px), (pointer: coarse)');
  const elRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FloatingLogoEngine | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!motion || !el) return;
    const engine = new FloatingLogoEngine(el, { size: isMobile ? 54 : 90, mobile: isMobile });
    engineRef.current = engine;
    // Let fonts/entrance animations settle so the first measurement is accurate.
    const timer = window.setTimeout(() => {
      const begin = () => engine.start();
      if (document.fonts?.status === 'loaded') begin();
      else document.fonts.ready.then(begin, begin);
    }, 450);
    return () => {
      window.clearTimeout(timer);
      engine.destroy();
      engineRef.current = null;
    };
  }, [motion, isMobile]);

  // RTL ↔ LTR mirrors the layout: re-measure obstacles.
  useEffect(() => {
    const id = window.setTimeout(() => engineRef.current?.invalidate(), 60);
    return () => window.clearTimeout(id);
  }, [lang]);

  if (!motion) return null;

  return (
    <div className="float-layer" aria-hidden="true" data-float-ignore>
      <div ref={elRef} className={`float-logo${isMobile ? ' is-lite' : ''}`} style={{ width: isMobile ? 54 : 90, height: isMobile ? 54 : 90 }}>
        <span className="float-shadow" />
        <span className="float-halo" />
        <LogoMark size="100%" animated={!isMobile} />
      </div>
    </div>
  );
}
