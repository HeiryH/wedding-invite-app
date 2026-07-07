import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy · ODDSTUDIO',
  description: 'How ODDSTUDIO collects, uses, and protects your data.',
};

const wrap: React.CSSProperties = {
  maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px',
  fontFamily: 'var(--font-ui, sans-serif)', color: 'var(--text-body, #333)', lineHeight: 1.7,
};
const h2: React.CSSProperties = { fontFamily: 'var(--font-display, serif)', fontSize: 22, marginTop: 36, marginBottom: 10, color: 'var(--text-strong, #111)' };

export default function PrivacyPage() {
  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)' }}>
        Legal
      </p>
      <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 36, margin: '4px 0 8px', color: 'var(--text-strong, #111)' }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-muted, #999)', marginTop: 0 }}>Last updated: [DATE]</p>

      <p style={{ padding: '10px 14px', background: 'var(--surface-sunken, #f6f4f2)', borderRadius: 8, fontSize: 13, color: 'var(--text-subtle, #777)' }}>
        Template — review with a qualified advisor before launch. Replace [BRACKETED] placeholders.
      </p>

      <h2 style={h2}>Who we are</h2>
      <p>ODDSTUDIO (&ldquo;we&rdquo;) provides digital wedding-invitation websites. Contact: [CONTACT EMAIL].</p>

      <h2 style={h2}>What we collect</h2>
      <p>
        <strong>Account holders (couples/hosts):</strong> name, email, and login credentials (passwords are stored hashed).<br />
        <strong>Wedding guests:</strong> the details a guest submits when they RSVP or leave a wish — name, and optionally email, phone number, number of attendees, and messages/photos.
      </p>

      <h2 style={h2}>How we use it</h2>
      <p>To operate your invitation site, deliver RSVPs and notifications, and keep accounts secure. We do not sell personal data.</p>

      <h2 style={h2}>Cookies</h2>
      <p>We use essential cookies (an HTTP-only session cookie) to keep you signed in. These are required for the site to function.</p>

      <h2 style={h2}>Data sharing</h2>
      <p>We share data only with service providers needed to run the product (hosting, email delivery). Guest RSVP data is visible to the couple hosting that wedding.</p>

      <h2 style={h2}>Your rights</h2>
      <p>You may request a copy of your data or ask us to delete your account and associated data. Signed-in account holders can export their data from their dashboard; to delete your account, contact [CONTACT EMAIL].</p>

      <h2 style={h2}>Retention &amp; security</h2>
      <p>We retain data for as long as your account is active. Passwords are hashed; transport is encrypted over HTTPS.</p>

      <h2 style={h2}>Contact</h2>
      <p>Questions? Email [CONTACT EMAIL].</p>
    </main>
  );
}
