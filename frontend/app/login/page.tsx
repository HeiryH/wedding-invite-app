'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/marketing/Wordmark';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });

      localStorage.setItem('user', JSON.stringify({
        email: response.email,
        role: response.role,
        weddingId: response.weddingId,
        tier: response.tier,
      }));

      if (response.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else if (response.role === 'HOST_ADMIN') {
        router.push('/host-admin');
      } else if (response.role === 'ORGANIZER_ADMIN') {
        router.push('/organizer-admin');
      } else {
        setError('Unknown user role');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Brand panel (left) ─────────────────────────────────────────────── */}
      <div style={{
        display: 'none',
        width: '45%',
        flexShrink: 0,
        background: 'var(--brand-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }} className="md-panel">
        {/* Decorative glare */}
        <div style={{
          position: 'absolute', top: -120, left: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,.07)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -100,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(0,0,0,.12)',
          pointerEvents: 'none',
        }} />

        {/* Wordmark */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ margin: '0 0 16px' }}>
            <Wordmark size={44} ink="#fff" />
          </div>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: 14, color: 'rgba(255,255,255,.72)',
            letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0,
          }}>
            Wedding Invitations
          </p>
          <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,.3)', margin: '24px auto' }} />
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 17, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, margin: 0,
            maxWidth: 240,
          }}>
            Crafted for unforgettable celebrations
          </p>
        </div>
      </div>

      {/* ── Form panel (right) ─────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-app)',
        padding: '32px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Mobile wordmark — hidden on desktop where the left panel shows */}
          <div style={{ textAlign: 'center', marginBottom: 36 }} className="mobile-wordmark">
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 6px' }}>
              <Wordmark size={34} />
            </div>
            <p style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-muted)',
              letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0,
            }}>
              Wedding Invitations
            </p>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
            color: 'var(--text-strong)', margin: '0 0 6px', lineHeight: 1.2,
          }}>
            Welcome back
          </h1>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
            color: 'var(--text-subtle)', margin: '0 0 28px',
          }}>
            Sign in to manage your weddings
          </p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)',
                marginBottom: 20,
              }}
            >
              <Icon name="alert-circle" size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--danger)', lineHeight: 1.4 }}>
                {error}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <a href="/forgot-password" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--brand)', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              tone="brand"
              size="md"
              fullWidth
              loading={loading}
            >
              Sign In
            </Button>
          </form>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-panel { display: flex !important; }
          .mobile-wordmark { display: none !important; }
        }
      `}</style>
    </div>
  );
}
