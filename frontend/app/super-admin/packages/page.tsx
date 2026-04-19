'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { packageService, featureService, Package, Feature, CreatePackage, UpdatePackage } from '@/lib/api';

type FormMode = 'create' | 'edit' | null;

interface PackageForm {
  packageName: string;
  packageCode: string;
  description: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  featureIds: number[];
}

const emptyForm: PackageForm = {
  packageName: '',
  packageCode: '',
  description: '',
  price: 0,
  sortOrder: 0,
  isActive: true,
  featureIds: [],
};

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgs, features] = await Promise.all([
        packageService.getAll(),
        featureService.getAll(),
      ]);
      setPackages(pkgs);
      setAllFeatures(features);
    } catch (err: any) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormMode('create');
    setError(null);
  };

  const openEditForm = (pkg: Package) => {
    setForm({
      packageName: pkg.packageName,
      packageCode: pkg.packageCode,
      description: pkg.description,
      price: pkg.price,
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
      featureIds: pkg.features.map((f) => f.featureId),
    });
    setEditingId(pkg.packageId);
    setFormMode('edit');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (formMode === 'create') {
        const payload: CreatePackage = {
          packageName: form.packageName,
          packageCode: form.packageCode,
          description: form.description,
          price: form.price,
          sortOrder: form.sortOrder,
          featureIds: form.featureIds,
        };
        await packageService.create(payload);
      } else if (formMode === 'edit' && editingId !== null) {
        const payload: UpdatePackage = {
          packageName: form.packageName,
          description: form.description,
          price: form.price,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
          featureIds: form.featureIds,
        };
        await packageService.update(editingId, payload);
      }

      setFormMode(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Delete package "${pkg.packageName}"? Weddings using this package will have their package unset.`)) return;

    try {
      await packageService.delete(pkg.packageId);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete package');
    }
  };

  const toggleFeature = (featureId: number) => {
    setForm((prev) => ({
      ...prev,
      featureIds: prev.featureIds.includes(featureId)
        ? prev.featureIds.filter((id) => id !== featureId)
        : [...prev.featureIds, featureId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Packages</h1>
              <p className="text-gray-600 mt-1">Create and manage feature bundles for weddings</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openCreateForm}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                + New Package
              </button>
              <button
                onClick={() => router.push('/super-admin')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Create / Edit Form */}
        <AnimatePresence>
          {formMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-md p-8 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {formMode === 'create' ? '📦 Create New Package' : '✏️ Edit Package'}
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      value={form.packageName}
                      onChange={(e) => setForm({ ...form, packageName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none text-gray-800"
                      placeholder="e.g., Starter, Premium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Code * {formMode === 'edit' && <span className="text-gray-400">(read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={form.packageCode}
                      onChange={(e) => setForm({ ...form, packageCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="e.g., STARTER"
                      required
                      disabled={formMode === 'edit'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none resize-none text-gray-800"
                    placeholder="Brief description of this package"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none text-gray-800"
                    />
                  </div>

                  {formMode === 'edit' && (
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 accent-rose-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Feature selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allFeatures.map((feature) => (
                      <label
                        key={feature.featureId}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          form.featureIds.includes(feature.featureId)
                            ? 'border-rose-400 bg-rose-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!feature.isActive ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.featureIds.includes(feature.featureId)}
                          onChange={() => toggleFeature(feature.featureId)}
                          className="w-4 h-4 accent-rose-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{feature.featureName}</p>
                          {feature.isPremium && (
                            <span className="text-xs text-purple-600">Premium</span>
                          )}
                          {!feature.isActive && (
                            <span className="text-xs text-gray-400">Inactive</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setFormMode(null); setError(null); }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                      saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-md'
                    }`}
                  >
                    {saving ? 'Saving...' : formMode === 'create' ? 'Create Package' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Packages List */}
        {packages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            <p className="text-lg mb-2">No packages yet.</p>
            <p className="text-sm">Create your first package to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.packageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-md p-6 ${!pkg.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{pkg.packageName}</h3>
                      {!pkg.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                      {pkg.packageCode}
                    </span>
                  </div>
                  <div className="text-right">
                    {pkg.price > 0 ? (
                      <span className="text-lg font-bold text-rose-600">${pkg.price}</span>
                    ) : (
                      <span className="text-sm font-semibold text-green-600">Free</span>
                    )}
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                )}

                {pkg.features.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Included features:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.features.map((f) => (
                        <span
                          key={f.featureId}
                          className="text-xs bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-medium"
                        >
                          {f.featureName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-4">No features included</p>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditForm(pkg)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
