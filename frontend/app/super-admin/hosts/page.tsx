'use client';

import { useEffect, useState } from 'react';
import { authService, HostAdminUser } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { tierLabel } from '@/lib/tierRank';

type Tier = 'FREE' | 'PREMIUM' | 'PRO';
const TIERS: Tier[] = ['FREE', 'PREMIUM', 'PRO'];

export default function HostsPage() {
  const [hosts, setHosts] = useState<HostAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset password
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Delete confirm
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tier
  const [settingTierFor, setSettingTierFor] = useState<number | null>(null);

  useEffect(() => { fetchHosts(); }, []);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getHostAdmins();
      setHosts(data);
    } catch (err: any) {
      // 404 means endpoint not yet available (backend not restarted) — treat as empty
      if (err?.response?.status === 404) {
        setHosts([]);
      } else {
        setError(err?.response?.data?.message || 'Failed to load hosts');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCreate = async () => {
    if (!newEmail || !newPassword) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      await authService.createHostAdmin(newEmail, newPassword);
      setCreating(false);
      setNewEmail('');
      setNewPassword('');
      await fetchHosts();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create host admin');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCreate();
  };

  const handleToggleActive = async (host: HostAdminUser) => {
    try {
      await authService.setActive(host.userId, !host.isActive);
      await fetchHosts();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPw) return;
    setResetLoading(true);
    try {
      await authService.resetPassword(resetUserId, newPw);
      setResetUserId(null);
      setNewPw('');
    } catch {
      alert('Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetTier = async (userId: number, tier: Tier, currentTier: Tier) => {
    if (tier === currentTier) return;
    setSettingTierFor(userId);
    try {
      await authService.setTier(userId, tier);
      await fetchHosts();
    } catch {
      alert('Failed to update tier');
    } finally {
      setSettingTierFor(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    try {
      await authService.deleteUser(deleteUserId);
      setDeleteUserId(null);
      await fetchHosts();
    } catch {
      alert('Failed to delete host');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
            Host <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>admins</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            Manage organizers who create and own wedding invitations.
          </p>
        </div>
        <Button
          variant="primary"
          tone="brand"
          iconLeft={<Icon name="plus" size={15} />}
          onClick={() => setCreating(true)}
        >
          Add host
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog
        open={creating}
        onClose={() => { setCreating(false); setCreateError(''); setNewEmail(''); setNewPassword(''); }}
        title="Add host admin"
        description="They can create and manage their own weddings, and assign packages."
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => { setCreating(false); setCreateError(''); setNewEmail(''); setNewPassword(''); }}>Cancel</Button>
            <Button loading={createLoading} onClick={submitCreate}>Create account</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Email address" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
          <Input label="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required hint="Minimum 6 characters" />
          {createError && (
            <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>{createError}</p>
          )}
        </form>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={resetUserId !== null}
        onClose={() => { setResetUserId(null); setNewPw(''); }}
        title="Reset password"
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => { setResetUserId(null); setNewPw(''); }}>Cancel</Button>
            <Button loading={resetLoading} onClick={handleResetPassword}>Update password</Button>
          </>
        }
      >
        <Input label="New password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required />
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        title="Delete host admin?"
        description="Their weddings remain but will move to the Platform / Direct group. This cannot be undone."
        tone="danger"
        icon="trash"
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => setDeleteUserId(null)}>Cancel</Button>
            <Button tone="danger" variant="soft" loading={deleteLoading} onClick={handleDelete}>Delete account</Button>
          </>
        }
      />

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <div style={{ width: 36, height: 36, borderWidth: '2.5px', borderStyle: 'solid', borderColor: 'transparent var(--brand) var(--brand) var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Something went wrong" description={error} action={<Button variant="secondary" tone="neutral" onClick={fetchHosts}>Try again</Button>} />
      ) : hosts.length === 0 ? (
        <EmptyState
          icon="users"
          title="No host admins yet"
          description="Add a host admin to let organizers manage their own wedding portfolios."
          action={<Button variant="primary" tone="brand" iconLeft={<Icon name="plus" size={15} />} onClick={() => setCreating(true)}>Add host</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hosts.map(host => (
            <div key={host.userId} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xs)',
            }}>
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'var(--brand-subtle)', color: 'var(--brand)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
              }}>
                {host.email.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {host.email}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>
                  Host Admin · Joined {new Date(host.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Status badge */}
              <Badge tone={host.isActive ? 'success' : 'neutral'} dot>{host.isActive ? 'Active' : 'Disabled'}</Badge>

              {/* Tier selector */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {TIERS.map(t => (
                  <button
                    key={t}
                    disabled={settingTierFor === host.userId}
                    onClick={() => handleSetTier(host.userId, t, host.tier as Tier)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-ui)',
                      cursor: settingTierFor === host.userId ? 'not-allowed' : 'pointer',
                      transition: 'var(--transition-control)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: host.tier === t ? 'var(--brand)' : 'var(--border-default)',
                      background: host.tier === t ? 'var(--brand-subtle)' : 'var(--surface-card)',
                      color: host.tier === t ? 'var(--brand)' : 'var(--text-muted)',
                    }}
                  >
                    {tierLabel[t]}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <IconButton
                  name={host.isActive ? 'lock' : 'check-circle'}
                  label={host.isActive ? 'Disable account' : 'Enable account'}
                  variant="ghost"
                  onClick={() => handleToggleActive(host)}
                />
                <IconButton
                  name="key"
                  label="Reset password"
                  variant="ghost"
                  onClick={() => setResetUserId(host.userId)}
                />
                <IconButton
                  name="trash"
                  label="Delete account"
                  variant="ghost"
                  tone="danger"
                  onClick={() => setDeleteUserId(host.userId)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
