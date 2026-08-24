// Single source of truth for the landing page's live copy: consumed both by the
// public page (as the fallback when a key has no stored override) and by the
// super-admin editor (to prefill fields instead of showing them empty).
export const LANDING_CONTENT_DEFAULTS: Record<string, string> = {
  'hero.tagline': 'Weddings · Parties · Ceremonies',
  'features.title': 'Features',
  'features.subtitle': 'Everything to send a beautiful invite.',
  'pricing.title': 'Pricing',
  'pricing.subtitle': "Start free. Upgrade when you're ready.",
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

export const DEFAULT_PRICING_ITEMS: LandingDefaultItem[] = [
  { title: 'Free', body: 'Try the editor and see how it feels before committing.', meta: '', price: 'Free forever', features: '1 free invitation template\nFull editor access\nPrivate preview (self-test only)\nTest RSVPs & wishes', cta: 'Get started free', ctaHref: '/personalise/picker', highlighted: false },
  { title: 'Premium', body: 'Share your invitation with real guests and unlock premium designs.', meta: '', price: 'Contact us', features: 'All free features\nShareable public link\nAll premium templates\nRSVP management\nWishes & guestbook', cta: 'Contact us to upgrade', ctaHref: '/login', highlighted: true },
  { title: 'Pro', body: 'The full experience for couples who want everything.', meta: '', price: 'Contact us', features: 'All premium features\nAll Pro templates\nPhoto booth\nSeating arrangement\nPriority support', cta: 'Contact us to upgrade', ctaHref: '/login', highlighted: false },
];

export const DEFAULT_STORY_ITEMS: LandingDefaultItem[] = [
  { body: 'Made our wedding invite in one lunch break. Everyone asked who designed it.', meta: '— Nur & Idris, Wedding' },
  { body: 'The RSVP tracker saved my sanity for a 200-person party.', meta: '— Mel, Birthday' },
];

export const DEFAULT_MIDDLE_SECTIONS = ['features', 'pricing', 'stories', 'about'];
