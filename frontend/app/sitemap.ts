import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oddstudio.app';

// Public marketing + legal pages. Per-wedding invite pages are intentionally excluded —
// they're personal and shouldn't be broadly indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ['', '/home', '/templates', '/try', '/privacy', '/terms'];
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
