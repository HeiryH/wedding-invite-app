'use client';

import { apiErrorMessage } from '@/lib/api/errors';

import { useState } from 'react';
import { authService, OrganizerAdminUser } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { tierLabel } from '@/lib/tierRank';

type Tier = 'BASIC' | 'PREMIUM' | 'PRO';
const TIERS: Tier[] = ['BASIC', 'PREMIUM', 'PRO'];

interface AccessTabProps {
  organizerAdmin: OrganizerAdminUser | null;
  weddingId: number;
  onRefresh: () => void;
}

export default function AccessTab({ organizerAdmin, weddingId, onRefresh }: AccessTabProps) {
  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset password state
  const [showReset, setShowReset] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Toggle active state
  const [toggling, setToggling] = useState(false);

  // Tier state
  const [settingTier, setSettingTier] = useState(false);
  const viewerRole = getUser()?.role;

  const handleCreate = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      setCreateError('Email and password are required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await authService.createOrganizerAdmin(weddingId, newEmail.trim(), newPassword);
      setNewEmail('');
      setNewPassword('');
      onRefresh();
    } catch (err: unknown) {
      setCreateError(apiErrorMessage(err) || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!organizerAdmin) return;
    setToggling(true);
    try {
      await authService.setActive(organizerAdmin.userId, !organizerAdmin.isActive);
      onRefresh();
    } catch {
      alert('Failed to update access status');
    } finally {
      setToggling(false);
    }
  };

  const handleResetPassword = async () => {
    if (!organizerAdmin || !resetPassword.trim()) return;
    setResetting(true);
    try {
      await authService.resetPassword(organizerAdmin.userId, resetPassword);
      setResetPassword('');
      setShowReset(false);
      alert('Password updated successfully');
    } catch {
      alert('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleSetTier = async (tier: Tier) => {
    if (!organizerAdmin || tier === organizerAdmin.tier?.toUpperCase()) return;
    setSettingTier(true);
    try {
      await authService.setTier(organizerAdmin.userId, tier);
      onRefresh();
    } catch {
      alert('Failed to update account tier');
    } finally {
      setSettingTier(false);
    }
  };

  const handleDelete = async () => {
    if (!organizerAdmin) return;
    if (!confirm(`Delete account for ${organizerAdmin.email}? The organizer will lose access immediately.`)) return;
    try {
      await authService.deleteUser(organizerAdmin.userId);
      onRefresh();
    } catch {
      alert('Failed to delete account');
    }
  };

  // ── No account yet ────────────────────────────────────────────────────────
  if (!organizerAdmin) {
    return (
      <div className="max-w-lg">
        <div className="bg-[var(--brand-subtle)] border border-[var(--brand-border)] rounded-xl p-4 mb-6">
          <p className="text-sm text-[var(--text-body)]">
            Create a login account so the event organizer can access their dashboard to view RSVPs,
            wishes, photos, and customize their invitation.
          </p>
        </div>

        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-subtle)] p-6 space-y-4">
          <h3 className="font-semibold text-[var(--text-strong)] text-lg">Create Event Organizer Account</h3>

          {createError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-1">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="organizer@example.com"
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-strong)] focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--brand)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-strong)] focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--brand)] focus:outline-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-2.5 bg-[var(--brand)] text-[var(--brand-on)] rounded-lg font-medium text-sm hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    );
  }

  // ── Account exists ────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg space-y-6">
      {/* Account card */}
      <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-subtle)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--text-strong)] text-lg">{organizerAdmin.email}</h3>
            <p className="text-xs text-[var(--text-subtle)] mt-0.5">
              Created {new Date(organizerAdmin.createdDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              organizerAdmin.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {organizerAdmin.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-5">
          {organizerAdmin.isActive
            ? 'The event organizer can log in and manage their dashboard.'
            : 'Access is disabled. The event organizer cannot log in until you re-enable it.'}
        </p>

        {/* Tier selector — SUPER_ADMIN only */}
        {viewerRole === 'SUPER_ADMIN' && (
          <div className="mb-5 p-4 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Account Tier</p>
            <div className="flex gap-2">
              {TIERS.map(t => {
                const current = (organizerAdmin.tier ?? 'BASIC').toUpperCase() === t;
                const colors: Record<Tier, string> = {
                  BASIC:    current ? 'bg-[var(--brand-subtle-2)] text-[var(--text-strong)] border-[var(--border-default)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-default)]',
                  PREMIUM: current ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-yellow-300',
                  PRO:     current ? 'bg-[var(--brand-subtle-2)] text-[var(--brand)] border-[var(--brand)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--brand-border)]',
                };
                return (
                  <button
                    key={t}
                    onClick={() => handleSetTier(t)}
                    disabled={settingTier || current}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:cursor-default ${colors[t]}`}
                  >
                    {tierLabel[t]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Toggle active */}
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              organizerAdmin.isActive
                ? 'bg-[var(--surface-sunken)] text-[var(--text-body)] hover:bg-red-50 hover:text-red-700 border border-[var(--border-subtle)]'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {toggling
              ? 'Updating…'
              : organizerAdmin.isActive
              ? 'Disable Access'
              : 'Enable Access'}
          </button>

          {/* Reset password */}
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full py-2.5 bg-[var(--surface-sunken)] text-[var(--text-body)] rounded-lg font-medium text-sm hover:bg-[var(--brand-subtle-2)] border border-[var(--border-subtle)] transition-colors"
            >
              Reset Password
            </button>
          ) : (
            <div className="space-y-2 border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--surface-sunken)]">
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-strong)] focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--brand)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResetPassword}
                  disabled={resetting || !resetPassword.trim()}
                  className="flex-1 py-2 bg-[var(--brand)] text-[var(--brand-on)] rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resetting ? 'Saving…' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setShowReset(false); setResetPassword(''); }}
                  className="px-4 py-2 bg-[var(--surface-card)] text-[var(--text-muted)] rounded-lg text-sm border border-[var(--border-subtle)] hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete account */}
          <button
            onClick={handleDelete}
            className="w-full py-2.5 bg-[var(--surface-card)] text-red-600 rounded-lg font-medium text-sm border border-red-200 hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--text-subtle)]">
        Login URL: <span className="font-mono">/login</span> — share the email and password with the organizer.
      </p>
    </div>
  );
}
