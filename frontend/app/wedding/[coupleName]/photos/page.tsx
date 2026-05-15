'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { weddingService, photoService, weddingFeatureService, Wedding, Photo } from '@/lib/api';

export default function PhotoBoothPage() {
  const params = useParams();
  const router = useRouter();
  const coupleName = params.coupleName as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch wedding
        const weddingData = await weddingService.getByCoupleName(coupleName);
        setWedding(weddingData);

        // Check if Photo Booth is enabled
        const isEnabled = await weddingFeatureService.isFeatureEnabled(
          weddingData.weddingId,
          'PHOTO_BOOTH'
        );
        setFeatureEnabled(isEnabled);

        if (isEnabled) {
          // Fetch photos
          const photosData = await photoService.getVisibleByWeddingId(weddingData.weddingId);
          setPhotos(photosData);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load photo booth');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coupleName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wedding || !selectedFile) return;

    if (!guestName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload photo
      await photoService.upload(
        wedding.weddingId,
        guestName.trim(),
        caption.trim(),
        selectedFile
      );

      // Success!
      setUploadSuccess(true);
      
      // Reset form
      setGuestName('');
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowUploadForm(false);

      // Refresh photos
      const updatedPhotos = await photoService.getVisibleByWeddingId(wedding.weddingId);
      setPhotos(updatedPhotos);

      // Hide success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading photo booth...</p>
        </div>
      </div>
    );
  }

  if (error && !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error}</p>
          <button
            onClick={() => router.push(`/wedding/${coupleName}`)}
            className="text-rose-600 hover:underline"
          >
            ← Back to invitation
          </button>
        </div>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Photo Booth Not Available
          </h2>
          <p className="text-gray-600 mb-6">
            The photo booth feature is not enabled for this wedding.
          </p>
          <button
            onClick={() => router.push(`/wedding/${coupleName}`)}
            className="text-rose-600 hover:underline"
          >
            ← Back to invitation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            📸 Photo Booth
          </h1>
          <p className="text-gray-600 text-lg">
            Share your favorite moments from {wedding?.brideName} & {wedding?.groomName}'s special day!
          </p>
          <button
            onClick={() => router.push(`/wedding/${coupleName}`)}
            className="text-sm text-rose-600 hover:underline mt-4"
          >
            ← Back to invitation
          </button>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8 text-center"
            >
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-700 font-semibold text-lg">
                Photo uploaded successfully!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 text-center"
          >
            <p className="text-red-700 font-semibold">{error}</p>
          </motion.div>
        )}

        {/* Upload Button */}
        {!showUploadForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
            >
              📤 Upload a Photo
            </button>
          </motion.div>
        )}

        {/* Upload Form */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-8 mb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Your Photo</h2>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photo *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF - Max 10MB
                  </p>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </motion.div>
                )}

                {/* Guest Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                    required
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption to your photo..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                    uploading || !selectedFile
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg'
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    '📤 Upload Photo'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Gallery */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Photo Gallery ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-600 text-lg">
                No photos yet. Be the first to share!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.photoId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-64">
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption || 'Wedding photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-800 mb-1">
                      {photo.guestName}
                    </p>
                    {photo.caption && (
                      <p className="text-sm text-gray-600 italic mb-2">
                        "{photo.caption}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(photo.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}