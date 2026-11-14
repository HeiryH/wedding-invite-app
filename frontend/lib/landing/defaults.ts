// Single source of truth for the landing page's live copy: consumed both by the
// public page (as the fallback when a key has no stored override) and by the
// super-admin editor (to prefill fields instead of showing them empty).
export const LANDING_CONTENT_DEFAULTS: Record<string, string> = {
  'hero.tagline': 'Weddings · Parties · Ceremonies',
  'hero.heading': 'Beautiful digital invitations, made simple.',
  'hero.body': 'Choose a design, share your link, and collect RSVPs — all in one place.',
  'explore.title': 'Explore Invitation Designs',
  'explore.subtitle': 'Thoughtful templates for every kind of celebration.',
  'explore.templates': 'auto',
  'steps.title': 'From invite to RSVP in four simple steps.',
  'steps.subtitle': '',
  'steps.design.title': 'Choose a design',
  'steps.design.body': 'Pick from a curated collection for weddings, parties, and more.',
  'steps.details.title': 'Fill in your invite details',
  'steps.details.body': 'Add the names, date, time, and venue to make the invitation yours.',
  'steps.share.title': 'Share your link',
  'steps.share.body': 'Send your invitation in seconds via chat, email, or social media.',
  'steps.reply.title': 'See replies roll in',
  'steps.reply.body': 'Track RSVPs and guest details in a simple, organized list.',
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

export const INVITE_STEPS = ['design', 'details', 'share', 'reply'] as const;

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
