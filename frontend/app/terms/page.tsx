import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service · ODDSTUDIO',
  description: 'The terms that govern your use of ODDSTUDIO.',
};

const wrap: React.CSSProperties = {
  maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px',
  fontFamily: 'var(--font-ui, sans-serif)', color: 'var(--text-body, #333)', lineHeight: 1.7,
};
const h2: React.CSSProperties = { fontFamily: 'var(--font-display, serif)', fontSize: 22, marginTop: 36, marginBottom: 10, color: 'var(--text-strong, #111)' };

export default function TermsPage() {
  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #999)' }}>
        Legal
      </p>
      <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 36, margin: '4px 0 8px', color: 'var(--text-strong, #111)' }}>
        Terms of Service
      </h1>
      <p style={{ color: 'var(--text-muted, #999)', marginTop: 0 }}>Last updated: [DATE]</p>

      <p style={{ padding: '10px 14px', background: 'var(--surface-sunken, #f6f4f2)', borderRadius: 8, fontSize: 13, color: 'var(--text-subtle, #777)' }}>
        Template — review with a qualified advisor before launch. Replace [BRACKETED] placeholders.
      </p>

      <h2 style={h2}>Acceptance</h2>
      <p>By using ODDSTUDIO you agree to these terms. If you don&rsquo;t agree, don&rsquo;t use the service.</p>

      <h2 style={h2}>Your account</h2>
      <p>You are responsible for keeping your login credentials secure and for the content you publish. You must have the right to use any names, images, and guest details you upload.</p>

      <h2 style={h2}>Acceptable use</h2>
      <p>Don&rsquo;t use the service for anything unlawful, or to upload content that is abusive, infringing, or harmful. We may suspend accounts that violate these terms.</p>

      <h2 style={h2}>Plans &amp; payment</h2>
      <p>Paid plans are arranged directly with us [PAYMENT TERMS / BANK TRANSFER DETAILS]. Feature access depends on your current plan.</p>

      <h2 style={h2}>Availability</h2>
      <p>We aim for high availability but the service is provided &ldquo;as is&rdquo; without warranty of uninterrupted operation.</p>

      <h2 style={h2}>Limitation of liability</h2>
      <p>To the extent permitted by law, ODDSTUDIO is not liable for indirect or consequential damages arising from use of the service.</p>

      <h2 style={h2}>Changes</h2>
      <p>We may update these terms; continued use after changes constitutes acceptance.</p>

      <h2 style={h2}>Contact</h2>
      <p>Questions about these terms? Email [CONTACT EMAIL].</p>
    </main>
  );
}
