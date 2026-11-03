import { useId } from 'react';

/**
 * ALI SAMI brand mark.
 * Concept: the "A" is drawn as two circuit traces rising to a glowing AI "neuron" (apex node);
 * the "S" is an octilinear PCB data path that forms the A's crossbar, connecting both legs
 * like a network link. Feet end in solder pads.
 *
 * Geometry lives on a 64×64 grid so it stays crisp from 16px favicons to large hero sizes.
 */
export const MARK = {
  a: 'M9 54 L32 6 L55 54',
  s: 'M41.6 26 H30 L26 30 L30 34 H38 L42 38 L38 42 H14.7',
  apex: { cx: 32, cy: 6 },
  pads: [
    { cx: 9, cy: 54 },
    { cx: 55, cy: 54 },
  ],
  joints: [
    { cx: 41.6, cy: 26 },
    { cx: 14.7, cy: 42 },
  ],
} as const;

interface MarkProps {
  size?: number | string;
  className?: string;
  /** Animated data-flow along the S trace + apex pulse. */
  animated?: boolean;
  /** Render with a rounded tile background (app-icon style). */
  tile?: boolean;
  title?: string;
}

export function LogoMark({ size = 40, className, animated = false, tile = false, title }: MarkProps) {
  const id = useId().replace(/:/g, '');
  const grad = `lg-${id}`;
  const glow = `gl-${id}`;
  return (
    <svg
      className={`logo-mark${animated ? ' is-animated' : ''}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox={tile ? '-8 -8 80 80' : '0 0 64 64'}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={grad} x1="8" y1="56" x2="56" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--logo-from)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-to)' }} />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: 'var(--logo-to)', stopOpacity: 0.85 }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-to)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {tile && <rect x="-8" y="-8" width="80" height="80" rx="20" className="logo-tile" />}

      {/* A — circuit traces */}
      <path d={MARK.a} stroke={`url(#${grad})`} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* S — data path / crossbar */}
      <path
        d={MARK.s}
        className="logo-s"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {animated && <path d={MARK.s} className="logo-flow" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />}

      {MARK.joints.map((j) => (
        <circle key={`${j.cx}`} cx={j.cx} cy={j.cy} r="2.3" className="logo-joint" />
      ))}
      {MARK.pads.map((p) => (
        <circle key={`${p.cx}`} cx={p.cx} cy={p.cy} r="3.1" fill={`url(#${grad})`} />
      ))}

      {/* Apex neuron */}
      <circle cx={MARK.apex.cx} cy={MARK.apex.cy} r="9" fill={`url(#${glow})`} className="logo-apex-glow" />
      <circle cx={MARK.apex.cx} cy={MARK.apex.cy} r="3.8" className="logo-apex" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markSize?: number;
  showTagline?: boolean;
}

/** Full lockup: mark + ALI SAMI wordmark + DIGITAL TECHNOLOGIES. Always LTR (it's a brand). */
export function Logo({ className, markSize = 38, showTagline = true }: LogoProps) {
  return (
    <span className={`logo${className ? ` ${className}` : ''}`} dir="ltr">
      <LogoMark size={markSize} />
      <span className="logo-text">
        <span className="logo-word">ALI SAMI</span>
        {showTagline && <span className="logo-tagline">DIGITAL TECHNOLOGIES</span>}
      </span>
    </span>
  );
}
