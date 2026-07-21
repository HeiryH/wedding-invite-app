import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, JetBrains_Mono, Playfair_Display, Great_Vibes, Fredoka } from "next/font/google";

import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { MotionProvider } from "@/components/MotionProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// ── Marketing (The Invit_e) landing fonts ─────────────────────────────
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-vibes",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oddstudio.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ODDSTUDIO — Beautiful digital wedding invitations',
    template: '%s · ODDSTUDIO',
  },
  description:
    'Create a stunning digital wedding invitation with RSVP, photo booth, wishes, and more — crafted by ODDSTUDIO.',
  applicationName: 'ODDSTUDIO',
  openGraph: {
    type: 'website',
    siteName: 'ODDSTUDIO',
    title: 'ODDSTUDIO — Beautiful digital wedding invitations',
    description:
      'Create a stunning digital wedding invitation with RSVP, photo booth, wishes, and more.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ODDSTUDIO — Beautiful digital wedding invitations',
    description: 'Create a stunning digital wedding invitation.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${hanken.variable} ${jetbrains.variable} ${playfair.variable} ${greatVibes.variable} ${fredoka.variable} antialiased`}
      >
        <MotionProvider>{children}</MotionProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
