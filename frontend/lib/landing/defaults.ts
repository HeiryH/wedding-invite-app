// Single source of truth for the landing page's live copy: consumed both by the
// public page (as the fallback when a key has no stored override) and by the
// super-admin editor (to prefill fields instead of showing them empty).
export const LANDING_CONTENT_DEFAULTS: Record<string, string> = {
  'hero.tagline': 'Weddings · Parties · Ceremonies',
  'features.title': 'Features',
  'features.subtitle': 'Everything to send a beautiful invite.',
  'pricing.title': 'Pricing',
  'pricing.subtitle': 'One simple price per tier. Pick the designs you love.',
  'stories.title': 'Stories',
  'stories.subtitle': 'Real celebrations, really sent.',
  'about.title': 'About',
  'about.heading': 'The Invit_e is a little studio product for people who care how the invitation feels.',
  'about.body': 'Built by ODDSTUDIO, we make templates that look hand-designed, then let you fill them in from your phone in minutes — no design skills, no fuss.',
  'about.stat1.value': '40k+',
  'about.stat1.label': 'invites sent',
  'about.stat2.value': '120+',
  'about.stat2.label': 'templates',
  'footer.tagline': 'Made with love for unforgettable celebrations',
};

export interface LandingDefaultItem {
  title?: string;
  body: string;
  meta: string;
  price?: string;
  features?: string;
  cta?: string;
  ctaHref?: string;
  highlighted?: boolean;
}

export const DEFAULT_FEATURE_ITEMS: LandingDefaultItem[] = [
  { title: 'Designer templates', body: '120+ hand-crafted invites for weddings, parties & ceremonies — no design skills needed.', meta: '#8fd8f2' },
  { title: 'Instant RSVP', body: 'Guests tap to reply. You watch responses roll in, live.', meta: '#f2b7ab' },
  { title: 'Live guest list', body: "Track who's coming, dietary notes and plus-ones in one place.", meta: '#8fe6b0' },
  { title: 'Share anywhere', body: 'One link works on WhatsApp, Instagram, SMS or email.', meta: '#e9c98a' },
];

// `meta` on a pricing item is the tier code (BASIC/PREMIUM/PRO) — the landing page uses it to
// build the "View templates" link into the picker filtered to that tier. It falls back to
// matching the title when a CMS row leaves it blank.
export const DEFAULT_PRICING_ITEMS: LandingDefaultItem[] = [
  { title: 'Basic', body: 'Everything you need to send a beautiful invitation.', meta: 'BASIC', price: '$30', features: 'All Basic templates\nFull editor access\nShareable public link\nRSVP management\nWishes & guestbook', cta: 'Get started', ctaHref: '/personalise/picker?tier=BASIC', highlighted: false },
  { title: 'Premium', body: 'Unlock the premium designs and richer customisation.', meta: 'PREMIUM', price: '$50', features: 'All Basic features\nAll Premium templates\nAdvanced customisation\nMusic & photo gallery\nPriority support', cta: 'Get started', ctaHref: '/personalise/picker?tier=PREMIUM', highlighted: true },
  { title: 'Pro', body: 'The full experience for couples who want everything.', meta: 'PRO', price: '$80', features: 'All Premium features\nAll Pro templates\nAdjust editor (stage layouts)\nPhoto booth & seating\nCustom domain', cta: 'Get started', ctaHref: '/personalise/picker?tier=PRO', highlighted: false },
];

/** Resolves a pricing item to a tier code for the "View templates" link. */
export function pricingTierOf(item: LandingDefaultItem): 'BASIC' | 'PREMIUM' | 'PRO' | null {
  const raw = (item.meta || item.title || '').trim().toUpperCase();
  if (raw === 'BASIC' || raw === 'PREMIUM' || raw === 'PRO') return raw;
  return null;
}

export const DEFAULT_STORY_ITEMS: LandingDefaultItem[] = [
  { body: 'Made our wedding invite in one lunch break. Everyone asked who designed it.', meta: '— Nur & Idris, Wedding' },
  { body: 'The RSVP tracker saved my sanity for a 200-person party.', meta: '— Mel, Birthday' },
];

export const DEFAULT_MIDDLE_SECTIONS = ['features', 'pricing', 'stories', 'about'];
