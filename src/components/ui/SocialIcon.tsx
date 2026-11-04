import type { SVGProps } from 'react';
import type { SocialLink } from '../../config/site';

/**
 * Original line-style brand glyphs (Facebook / Telegram / WhatsApp),
 * drawn to match Lucide's 24px grid and 1.75 stroke so they sit naturally next to UI icons.
 */
type Props = SVGProps<SVGSVGElement> & { id: SocialLink['id']; size?: number };

export function SocialIcon({ id, size = 22, ...rest }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };

  if (id === 'facebook') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <path d="M15.6 8.2h-1.5c-1.3 0-2.1.8-2.1 2.1V21" />
        <path d="M9.4 13.4h5.6" />
      </svg>
    );
  }
  if (id === 'telegram') {
    return (
      <svg {...common}>
        <path d="M21.2 4.3 2.9 11.4c-.8.3-.8 1.4 0 1.7l4.6 1.6 1.8 5.4c.2.7 1.1.9 1.6.4l2.6-2.4 4.7 3.4c.6.5 1.5.1 1.7-.6l3.2-14.6c.2-.8-.6-1.4-1.3-1.1z" />
        <path d="m7.5 14.7 9.7-6.4-7 7.5" />
      </svg>
    );
  }
  if (id === 'github') {
    return (
      <svg {...common}>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3.4 20.6 4.8 16.2A8.6 8.6 0 1 1 8 19.4z" />
      <path d="M9.2 8.4c.2-.5.5-.7.9-.7h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.6l-.6.7c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.4.2.1.4.1.5 0l.7-.6c.2-.2.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.5c0 .4-.2.8-.6 1-.9.5-2 .5-3.2-.1-1.7-.9-3.1-2.3-4-4-.6-1.2-.6-2.3-.1-3.2z" />
    </svg>
  );
}
