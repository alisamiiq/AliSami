export type Lang = 'ar' | 'en';

/** A bilingual string. Every user-facing text in the data files uses this shape. */
export type L = Record<Lang, string>;

export const LANGS: Lang[] = ['ar', 'en'];

export const isRTL = (lang: Lang) => lang === 'ar';
