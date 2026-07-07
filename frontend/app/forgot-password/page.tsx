'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { authService } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch {
      // Intentionally ignore — the endpoint always succeeds to avoid revealing accounts.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)', padding: '32px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 6px', lineHeight: 1.2 }}>
          Reset your password
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', margin: '0 0 28px' }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', borderRadius: 'var(--radius-md)', background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)' }}
          >
            <Icon name="mail" size={15} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
              If that email is registered, a reset link is on its way. It expires in 1 hour.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>
                Email
              </label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required disabled={loading} />
            </div>
            <Button type="submit" variant="primary" tone="brand" size="md" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/login" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--brand)', textDecoration: 'none' }}>
            &larr; Back to sign in
          </a>
        </div>
      </motion.div>
    </div>
  );
}
