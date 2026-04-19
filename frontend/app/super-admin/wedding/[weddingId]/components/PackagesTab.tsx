'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { weddingService, Wedding, Package } from '@/lib/api';

interface PackagesTabProps {
  wedding: Wedding;
  packages: Package[];
  onPackageUpdated: (updated: Wedding) => void;
}

export default function PackagesTab({ wedding, packages, onPackageUpdated }: PackagesTabProps) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (packageId: number) => {
    if (packageId === wedding.packageId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await weddingService.updatePackage(wedding.weddingId, packageId);
      onPackageUpdated(updated);
      const pkg = packages.find((p) => p.packageId === packageId);
      setSuccessMsg(`Package "${pkg?.packageName}" assigned. Its features have been auto-enabled.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign package');
    } finally {
      setSaving(false);
    }
  };

  const currentPackage = packages.find((p) => p.packageId === wedding.packageId);

  return (
    <div className="space-y-6">
      {/* Current package */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-700 mb-1">Current Package</h3>
        {currentPackage ? (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-lg font-bold text-blue-900">{currentPackage.packageName}</p>
              <p className="text-sm text-blue-700">{currentPackage.description}</p>
              {currentPackage.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentPackage.features.map((f) => (
                    <span key={f.featureId} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {f.featureName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-blue-700">No package assigned to this wedding.</p>
        )}
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <p className="text-green-700 font-medium text-sm">✅ {successMsg}</p>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Package cards */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Available Packages</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const isCurrent = pkg.packageId === wedding.packageId;
            return (
              <div
                key={pkg.packageId}
                className={`p-5 border-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${!pkg.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{pkg.packageName}</h4>
                      {isCurrent && (
                        <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-400">{pkg.packageCode}</span>
                  </div>
                  <span className={`text-sm font-bold ${pkg.price > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                    {pkg.price > 0 ? `$${pkg.price}` : 'Free'}
                  </span>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                )}

                {pkg.features.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.features.map((f) => (
                        <span key={f.featureId} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          {f.featureName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-4">No features included</p>
                )}

                {!isCurrent && (
                  <button
                    onClick={() => handleAssign(pkg.packageId)}
                    disabled={saving || !pkg.isActive}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                      saving || !pkg.isActive
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-md'
                    }`}
                  >
                    {saving ? 'Assigning...' : 'Assign Package'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {packages.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No packages available. Create packages from the{' '}
            <a href="/super-admin/packages" className="text-rose-600 hover:underline">Packages management page</a>.
          </p>
        )}
      </div>
    </div>
  );
}
