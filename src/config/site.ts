/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONFIG — the single place for personal & contact data.
 *  عدّل هذا الملف لتحديث بيانات التواصل والمعلومات الشخصية.
 * ─────────────────────────────────────────────────────────────
 *  Rules:
 *  - Any field set to `null` is simply hidden on the website.
 *  - Never put API keys or secrets here (this code ships to the browser).
 */
import type { L } from '../i18n/types';

export interface SocialLink {
  id: 'facebook' | 'telegram' | 'whatsapp' | 'github';
  label: L;
  handle: string;
  url: string;
}

export const site = {
  name: { ar: 'علي سامي', en: 'Ali Sami' } as L,
  brand: 'ALI SAMI',
  brandTagline: 'DIGITAL TECHNOLOGIES',

  location: {
    ar: 'الكوفة، البراكية — محافظة النجف، العراق',
    en: 'Al-Barakiya, Kufa — Najaf, Iraq',
  } as L,
  locationShort: { ar: 'الكوفة · العراق', en: 'Kufa · Iraq' } as L,

  /** Academic info. */
  study: {
    major: { ar: 'هندسة تقنيات الذكاء الاصطناعي', en: 'AI Engineering Technologies' } as L,
    university: {
      ar: 'جامعة الفرات الأوسط التقنية',
      en: 'Al-Furat Al-Awsat Technical University',
    } as L,
  },

  social: [
    {
      id: 'facebook',
      label: { ar: 'فيسبوك', en: 'Facebook' },
      handle: 'AliSamii.mu',
      url: 'https://www.facebook.com/AliSamii.mu',
    },
    {
      id: 'telegram',
      label: { ar: 'تيليجرام', en: 'Telegram' },
      handle: '@AliSamii_mu',
      url: 'https://t.me/AliSamii_mu',
    },
    {
      /**
       * WhatsApp username link (verified: wa.me/bc.9 opens a chat with @bc.9).
       * To use a phone number instead, use the international format without "+" or zeros,
       * e.g. https://wa.me/9647XXXXXXXXX
       */
      id: 'whatsapp',
      label: { ar: 'واتساب', en: 'WhatsApp' },
      handle: '@bc.9',
      url: 'https://wa.me/bc.9',
    },
    {
      id: 'github',
      label: { ar: 'جيت هاب', en: 'GitHub' },
      handle: 'alisamiiq',
      url: 'https://github.com/alisamiiq',
    },
  ] satisfies SocialLink[],

  /**
   * Internet-service section. Leave a field `null` until you have the real value.
   * لا تضع أسعاراً أو سرعات أو مناطق تغطية غير مؤكدة.
   */
  internetService: {
    workingHours: null as L | null, // e.g. { ar: 'يومياً 10 صباحاً – 10 مساءً', en: 'Daily 10 AM – 10 PM' }
    phone: null as string | null, // e.g. '+964 7XX XXX XXXX'
    coverage: null as L | null, // e.g. { ar: 'البراكية والمناطق المجاورة', en: 'Al-Baraqiya & nearby' }
    /** Google Maps "Embed a map" iframe src. When set, an interactive map is shown. */
    mapEmbedUrl: null as string | null,
    /** Opens Google Maps search for the area (no invented coordinates). */
    mapSearchUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('البراكية، الكوفة، النجف، العراق'),
  },
};

export const getSocial = (id: SocialLink['id']) => site.social.find((s) => s.id === id)!;

/** Build a WhatsApp link with an optional pre-filled message. */
export function whatsappLink(text?: string) {
  const base = getSocial('whatsapp').url;
  if (!text) return base;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
}

/** Shared props for every external link (security + new tab). */
export const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
