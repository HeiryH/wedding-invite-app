'use client';

import Link from 'next/link';

import { apiErrorMessage } from '@/lib/api/errors';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/marketing/Wordmark';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: unknown) {
      setError(apiErrorMessage(err) || (err instanceof Error ? err.message : '') || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <Link href="/home" className={styles.back}>
        <span aria-hidden="true">←</span> Back to website
      </Link>

      <section className={styles.card} aria-labelledby="login-heading">
        <header className={styles.heading}>
          <Wordmark size={35} />
          <p className={styles.byline}>by <strong>ODDSTUDIO</strong></p>
          <div className={styles.divider} aria-hidden="true">✧</div>
          <h1 id="login-heading">Welcome back</h1>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <Icon name="alert-circle" size={16} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email">Email</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              leading={<Icon name="mail" size={18} />}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              leading={<Icon name="lock" size={18} />}
              trailing={
                <button
                  type="button"
                  className={styles.visibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                >
                  <Icon name="eye" size={18} />
                  {showPassword && <span aria-hidden="true" />}
                </button>
              }
              required
              disabled={loading}
            />
            <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" fullWidth loading={loading} className={styles.submit}>
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
