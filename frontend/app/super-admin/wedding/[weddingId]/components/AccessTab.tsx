'use client';

import { useState } from 'react';
import { authService, CoupleAdminUser } from '@/lib/api';

interface AccessTabProps {
  coupleAdmin: CoupleAdminUser | null;
  weddingId: number;
  onRefresh: () => void;
}

export default function AccessTab({ coupleAdmin, weddingId, onRefresh }: AccessTabProps) {
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

  const handleCreate = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      setCreateError('Email and password are required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await authService.createCoupleAdmin(weddingId, newEmail.trim(), newPassword);
      setNewEmail('');
      setNewPassword('');
      onRefresh();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!coupleAdmin) return;
    setToggling(true);
    try {
      await authService.setActive(coupleAdmin.userId, !coupleAdmin.isActive);
      onRefresh();
    } catch {
      alert('Failed to update access status');
    } finally {
      setToggling(false);
    }
  };

  const handleResetPassword = async () => {
    if (!coupleAdmin || !resetPassword.trim()) return;
    setResetting(true);
    try {
      await authService.resetPassword(coupleAdmin.userId, resetPassword);
      setResetPassword('');
      setShowReset(false);
      alert('Password updated successfully');
    } catch {
      alert('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!coupleAdmin) return;
    if (!confirm(`Delete account for ${coupleAdmin.email}? The couple will lose access immediately.`)) return;
    try {
      await authService.deleteUser(coupleAdmin.userId);
      onRefresh();
    } catch {
      alert('Failed to delete account');
    }
  };

  // ── No account yet ────────────────────────────────────────────────────────
  if (!coupleAdmin) {
    return (
      <div className="max-w-lg">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            Create a login account so the couple can access their wedding dashboard to view RSVPs,
            wishes, photos, and customize their invitation.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Create Couple Admin Account</h3>

          {createError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="couple@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 focus:outline-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-2.5 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{coupleAdmin.email}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Created {new Date(coupleAdmin.createdDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              coupleAdmin.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {coupleAdmin.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          {coupleAdmin.isActive
            ? 'The couple can log in and manage their wedding dashboard.'
            : 'Access is disabled. The couple cannot log in until you re-enable it.'}
        </p>

        <div className="space-y-3">
          {/* Toggle active */}
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              coupleAdmin.isActive
                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {toggling
              ? 'Updating…'
              : coupleAdmin.isActive
              ? 'Disable Access'
              : 'Enable Access'}
          </button>

          {/* Reset password */}
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 border border-gray-200 transition-colors"
            >
              Reset Password
            </button>
          ) : (
            <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResetPassword}
                  disabled={resetting || !resetPassword.trim()}
                  className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resetting ? 'Saving…' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setShowReset(false); setResetPassword(''); }}
                  className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete account */}
          <button
            onClick={handleDelete}
            className="w-full py-2.5 bg-white text-red-600 rounded-lg font-medium text-sm border border-red-200 hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Login URL: <span className="font-mono">/login</span> — share the email and password with the couple.
      </p>
    </div>
  );
}
