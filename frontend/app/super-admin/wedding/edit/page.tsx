'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, templateService, Wedding, Template } from '@/lib/api';

export default function EditWeddingPage() {
  const params = useParams();
  const router = useRouter();
  const weddingId = parseInt(params.weddingId as string);

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
    templateId: 1,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [weddingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weddingData, templatesData] = await Promise.all([
        weddingService.getById(weddingId),
        templateService.getActive(),
      ]);

      setWedding(weddingData);
      setTemplates(templatesData);

      // Populate form
      const weddingDate = new Date(weddingData.weddingDate);
      const year = weddingDate.getFullYear();
      const month = String(weddingDate.getMonth() + 1).padStart(2, '0');
      const day = String(weddingDate.getDate()).padStart(2, '0');
      const hours = String(weddingDate.getHours()).padStart(2, '0');
      const minutes = String(weddingDate.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      const localDateTime = new Date(
        weddingDate.getTime() - weddingDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      setFormData({
        brideName: weddingData.brideName,
        groomName: weddingData.groomName,
        weddingDate: formattedDateTime,
        venue: weddingData.venue,
        venueAddress: weddingData.venueAddress,
        templateId: weddingData.templateId,
        isActive: weddingData.isActive,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wedding');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {

      console.log('📤 Sending wedding update:', {
        brideName: formData.brideName.trim(),
        groomName: formData.groomName.trim(),
        weddingDate: formData.weddingDate,
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim(),
      });

      await weddingService.update(weddingId, {
        brideName: formData.brideName.trim(),
        groomName: formData.groomName.trim(),
        weddingDate: new Date(formData.weddingDate).toISOString(),
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim(),
        // templateId: formData.templateId,
      });

      // Update template separately
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wedding/${weddingId}/template`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ templateId: formData.templateId }),
      // });

      // 📤 Send template update separately (if changed)
      if (formData.templateId !== wedding?.templateId) {
        await weddingService.updateTemplate(weddingId, formData.templateId);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push('/super-admin');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update wedding. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading wedding...</p>
        </div>
      </div>
    );
  }

  if (error && !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error}</p>
          <button
            onClick={() => router.push('/super-admin')}
            className="text-rose-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Wedding</h1>
              <p className="text-gray-600 mt-1">
                {wedding?.brideName} & {wedding?.groomName}
              </p>
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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6"
          >
            <p className="text-green-700 font-medium">✅ Wedding updated successfully! Redirecting...</p>
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
                  required
                />
              </div>
            </div>

            {/* Current URL */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">📝 Current URL:</p>
              <p className="text-lg font-semibold text-blue-600">
                /wedding/{wedding?.coupleName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (URL slug cannot be changed after creation)
              </p>
            </div>
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
                  required
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎨 Template
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
                      setFormData({
                        ...formData,
                        templateId: parseInt(e.target.value),
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="relative p-6 border-2 border-gray-200 rounded-xl peer-checked:border-rose-500 peer-checked:bg-rose-50 hover:border-gray-300 transition-all">
                    {formData.templateId === template.templateId && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          ✓ Selected
                        </span>
                      </div>
                    )}

                    {template.isPremium && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          ⭐ PREMIUM
                        </span>
                      </div>
                    )}

                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {template.templateName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {template.description}
                      </p>

                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-500">Colors:</span>
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: template.primaryColor }}
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: template.secondaryColor }}
                        />
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
              disabled={saving}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
                }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}