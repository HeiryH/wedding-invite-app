'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, templateService, packageService, Template, Package } from '@/lib/api';

export default function CreateWeddingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
    templateId: 1,
    packageId: null as number | null,
  });

  useEffect(() => {
    fetchTemplates();
    fetchPackages();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getActive();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates');
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await packageService.getActive();
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const wedding = await weddingService.create({
        coupleName: `${formData.brideName.split(' ')[0].toLowerCase()}-and-${formData.groomName.split(' ')[0].toLowerCase()}`,
        brideName: formData.brideName.trim(),
        groomName: formData.groomName.trim(),
        weddingDate: new Date(formData.weddingDate).toISOString(),
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim(),
        templateId: formData.templateId,
        packageId: formData.packageId ?? undefined,
      });

      router.push(`/super-admin/wedding/${wedding.weddingId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create wedding. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Create New Wedding</h1>
              <p className="text-gray-600 mt-1">Set up a new wedding invitation</p>
            </div>
            <button
              onClick={() => router.push('/super-admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-700 font-medium">❌ {error}</p>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md p-8"
        >
          {/* Couple Names */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              👰🤵 Couple Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bride's Name *
                </label>
                <input
                  type="text"
                  value={formData.brideName}
                  onChange={(e) =>
                    setFormData({ ...formData, brideName: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
                  placeholder="e.g., Sarah Johnson"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groom's Name *
                </label>
                <input
                  type="text"
                  value={formData.groomName}
                  onChange={(e) =>
                    setFormData({ ...formData, groomName: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
                  placeholder="e.g., Michael Smith"
                  required
                />
              </div>
            </div>

            {formData.brideName && formData.groomName && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">📝 Auto-generated URL slug:</p>
                <p className="text-lg font-semibold text-rose-600">
                  /wedding/{formData.brideName.split(' ')[0].toLowerCase()}-and-{formData.groomName.split(' ')[0].toLowerCase()}
                </p>
                <p className="text-xs text-gray-500 mt-1">(This will be generated automatically)</p>
              </div>
            )}
          </div>

          {/* Wedding Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📅 Wedding Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wedding Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.weddingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, weddingDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
                  placeholder="e.g., Grand Ballroom Hotel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Address *
                </label>
                <textarea
                  value={formData.venueAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, venueAddress: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none resize-none"
                  placeholder="e.g., 123 Main Street, City, State 12345"
                  required
                />
              </div>
            </div>
          </div>

          {/* Package Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              📦 Choose Package
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select a package to automatically enable its features. You can change this later.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {/* No package option */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="package"
                  value=""
                  checked={formData.packageId === null}
                  onChange={() => setFormData({ ...formData, packageId: null })}
                  className="sr-only peer"
                />
                <div className="relative p-5 border-2 border-gray-200 rounded-xl peer-checked:border-gray-500 peer-checked:bg-gray-50 hover:border-gray-300 transition-all h-full">
                  {formData.packageId === null && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-semibold">✓ Selected</span>
                    </div>
                  )}
                  <h3 className="text-base font-bold text-gray-700 mb-1">No Package</h3>
                  <p className="text-sm text-gray-500">Start with no features. Enable them manually later.</p>
                </div>
              </label>

              {packages.map((pkg) => (
                <label key={pkg.packageId} className="cursor-pointer">
                  <input
                    type="radio"
                    name="package"
                    value={pkg.packageId}
                    checked={formData.packageId === pkg.packageId}
                    onChange={() => setFormData({ ...formData, packageId: pkg.packageId })}
                    className="sr-only peer"
                  />
                  <div className="relative p-5 border-2 border-gray-200 rounded-xl peer-checked:border-rose-500 peer-checked:bg-rose-50 hover:border-gray-300 transition-all h-full">
                    {formData.packageId === pkg.packageId && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full font-semibold">✓ Selected</span>
                      </div>
                    )}
                    {pkg.price > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          ${pkg.price}
                        </span>
                      </div>
                    )}
                    <div className={pkg.price > 0 ? 'mt-6' : ''}>
                      <h3 className="text-base font-bold text-gray-800 mb-1">{pkg.packageName}</h3>
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                      {pkg.features.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                          <div className="flex flex-wrap gap-1">
                            {pkg.features.map((f) => (
                              <span key={f.featureId} className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                {f.featureName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎨 Choose Template
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <label key={template.templateId} className="cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={template.templateId}
                    checked={formData.templateId === template.templateId}
                    onChange={(e) =>
                      setFormData({ ...formData, templateId: parseInt(e.target.value) })
                    }
                    className="sr-only peer"
                  />
                  <div className="relative p-6 border-2 border-gray-200 rounded-xl peer-checked:border-rose-500 peer-checked:bg-rose-50 hover:border-gray-300 transition-all">
                    {formData.templateId === template.templateId && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-semibold">✓ Selected</span>
                      </div>
                    )}
                    {template.isPremium && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold">⭐ PREMIUM</span>
                      </div>
                    )}
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{template.templateName}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-500">Colors:</span>
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: template.primaryColor }} />
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: template.secondaryColor }} />
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/super-admin')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                '✨ Create Wedding'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
