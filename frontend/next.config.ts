// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Template art/video under public/templates/ — Next's default `public/` caching is
        // effectively none (`max-age=0`, forcing a revalidation round-trip on every single load,
        // even for a returning visitor), because filenames here aren't content-hashed the way
        // `_next/static/*` chunks are, so Next can't safely assume a fixed URL's content never
        // changes. Deliberately NOT `immutable`+a huge max-age for the same reason in reverse: a
        // fixed filename here HAS been overwritten in place by a fix before (the RSVP scroll video
        // re-encode, docs/FIX_QUEUE.md Issue 3) — `immutable` would let a browser skip revalidating
        // entirely and keep serving a since-fixed asset indefinitely. 1 day fresh + up to a week
        // serving stale-while-revalidating covers the common case (a guest re-opening an invite
        // link, a couple re-checking their own page) without that risk.
        source: '/templates/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;