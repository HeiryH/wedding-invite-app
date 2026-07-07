import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oddstudio.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep admin surfaces out of search results.
      disallow: ['/super-admin', '/host-admin', '/couple-admin', '/login', '/reset-password'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
