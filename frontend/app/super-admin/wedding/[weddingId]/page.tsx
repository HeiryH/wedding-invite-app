'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { weddingFeatureService, WeddingWithFeatures, ToggleFeature } from '@/lib/api';

export default function FeatureManagementPage() {
  const params = useParams();
  const router = useRouter();
  const weddingId = parseInt(params.weddingId as string);

  const [data, setData] = useState<WeddingWithFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track feature states
  const [featureStates, setFeatureStates] = useState<{
    [featureId: number]: boolean;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const weddingData = await weddingFeatureService.getWeddingWithFeatures(weddingId);
        setData(weddingData);

        // Initialize feature states
        const initialStates: { [featureId: number]: boolean } = {};
        weddingData.features.forEach((feature) => {
          initialStates[feature.featureId] = feature.isEnabled;
        });
        setFeatureStates(initialStates);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wedding data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [weddingId]);

  const handleToggle = (featureId: number) => {
    setFeatureStates((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      // Prepare toggle requests
      const toggleRequests: ToggleFeature[] = data.features.map((feature) => ({
        featureId: feature.featureId,
        isEnabled: featureStates[feature.featureId] || false,
        configuration: null,
      }));

      // Bulk toggle
      await weddingFeatureService.bulkToggle(weddingId, toggleRequests);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh data
      const updatedData = await weddingFeatureService.getWeddingWithFeatures(weddingId);
      setData(updatedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!data) return false;
    return data.features.some(
      (feature) => feature.isEnabled !== featureStates[feature.featureId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading features...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error}</p>
          <button
            onClick={() => router.push('/super-admin')}
            className="text-rose-600 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { wedding, features } = data;

  // Separate free and premium features
  const freeFeatures = features.filter((f) => !f.isPremium);
  const premiumFeatures = features.filter((f) => f.isPremium);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/super-admin')}
                className="text-sm text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-1"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-800">
                {wedding.brideName} & {wedding.groomName}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage features for this wedding
              </p>
            </div>
            
              <a href={`/wedding/${wedding.coupleName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Invitation →
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Wedding Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-rose-600">
                {wedding.totalAttending}
              </p>
              <p className="text-sm text-gray-600">Guests Attending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {wedding.totalGuests}
              </p>
              <p className="text-sm text-gray-600">Total RSVPs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {wedding.totalPhotos}
              </p>
              <p className="text-sm text-gray-600">Photos Shared</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {wedding.daysUntilWedding}
              </p>
              <p className="text-sm text-gray-600">Days to Go</p>
            </div>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <span className="text-2xl">✅</span>
              <p className="text-green-700 font-medium">
                Features updated successfully!
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3"
            >
              <span className="text-2xl">❌</span>
              <p className="text-red-700 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Free Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md mb-6"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span>🆓</span>
              Free Features
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Available to all weddings
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {freeFeatures.map((feature) => (
              <FeatureToggle
                key={feature.featureId}
                feature={feature}
                isEnabled={featureStates[feature.featureId] || false}
                onToggle={() => handleToggle(feature.featureId)}
              />
            ))}
          </div>
        </motion.div>

        {/* Premium Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border-2 border-purple-200"
        >
          <div className="p-6 border-b border-purple-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span>⭐</span>
              Premium Features
            </h2>
            <p className="text-sm text-purple-700 mt-1">
              Advanced features for enhanced experience
            </p>
          </div>

          <div className="divide-y divide-purple-200">
            {premiumFeatures.map((feature) => (
              <FeatureToggle
                key={feature.featureId}
                feature={feature}
                isEnabled={featureStates[feature.featureId] || false}
                onToggle={() => handleToggle(feature.featureId)}
                isPremium
              />
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        {hasChanges() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-full shadow-2xl px-8 py-4 flex items-center gap-4 border-2 border-rose-300">
              <p className="text-gray-700 font-medium">
                You have unsaved changes
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg text-white'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Feature Toggle Component
function FeatureToggle({
  feature,
  isEnabled,
  onToggle,
  isPremium = false,
}: {
  feature: any;
  isEnabled: boolean;
  onToggle: () => void;
  isPremium?: boolean;
}) {
  return (
    <div className={`p-6 ${isPremium ? 'bg-white/50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {feature.featureName}
            </h3>
            {isPremium && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{feature.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            Code: <code className="bg-gray-100 px-1 py-0.5 rounded">{feature.featureCode}</code>
          </p>
        </div>

        {/* Toggle Switch */}
        <motion.button
          onClick={onToggle}
          className={`relative w-16 h-8 rounded-full transition-colors ${
            isEnabled
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gray-300'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
            animate={{
              left: isEnabled ? '36px' : '4px',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      {/* Show status */}
      <div className="mt-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            isEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isEnabled ? '✓ Enabled' : '○ Disabled'}
        </span>
      </div>
    </div>
  );
}