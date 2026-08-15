'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { templateService, Template } from '@/lib/api';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { Wordmark } from '@/components/marketing/Wordmark';
import { getUser } from '@/lib/auth';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? getUser() : null;
  const userTier = user?.tier ?? 'FREE';

  useEffect(() => {
    templateService.getActive()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (t: Template) => {
    if (user) {
      // Logged-in users: go to their customize page
      router.push('/organizer-admin/customize');
    } else {
      router.push(`/try?template=${t.templateId}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sand-0)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={22} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <a
                href={user.role === 'SUPER_ADMIN' ? '/super-admin' : '/organizer-admin'}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', textDecoration: 'none', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}
              >
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', textDecoration: 'none' }}>
                  Sign in
                </a>
                <a
                  href="/try"
                  style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '8px 18px', borderRadius: 'var(--radius-full)', background: 'var(--em)' }}
                >
                  Try free
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'var(--em-subtle)', borderBottom: '1px solid var(--em-border)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', color: 'var(--em)', textTransform: 'uppercase' }}>
            Template gallery
          </p>
          <h1 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.15 }}>
            Find your perfect design
          </h1>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Free templates are yours to customize immediately — no account needed.
            Premium & Pro designs unlock when you upgrade.
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--em-border)', borderTopColor: 'var(--em)', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            No templates available yet.
          </div>
        ) : (
          <TemplateLibrary
            templates={templates}
            userTier={userTier}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* CTA banner */}
      {!user && (
        <div style={{ background: 'var(--em-gradient)', padding: '56px 24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#fff', fontWeight: 700 }}>
            Ready to build your invitation?
          </h2>
          <p style={{ margin: '0 0 28px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.85)' }}>
            Start with a free template — no credit card required.
          </p>
          <a
            href="/try"
            style={{ display: 'inline-block', background: '#fff', color: 'var(--em)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 'var(--text-base)', padding: '14px 36px', borderRadius: 'var(--radius-full)', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Start for free
          </a>
        </div>
      )}
    </div>
  );
}
