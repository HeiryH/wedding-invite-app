'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authService.resetPasswordWithToken(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 6px', lineHeight: 1.2 }}>
        Set a new password
      </h1>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', margin: '0 0 28px' }}>
        Choose a new password for your account.
      </p>

      {!token && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
          Missing reset token. Please use the link from your email.
        </p>
      )}

      {done ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', borderRadius: 'var(--radius-md)', background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)' }}>
          <Icon name="check-circle" size={15} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.5 }}>
            Password reset. Redirecting you to sign in&hellip;
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)' }}>
              <Icon name="alert-triangle" size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--danger)', lineHeight: 1.4 }}>{error}</p>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>New password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading || !token} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>Confirm password</label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required disabled={loading || !token} />
          </div>
          <Button type="submit" variant="primary" tone="brand" size="md" fullWidth loading={loading} disabled={!token}>
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)', padding: '32px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 400 }}>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
