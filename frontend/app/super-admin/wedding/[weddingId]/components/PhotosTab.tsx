'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '@/lib/api';
import StatCard from './StatCard';

interface PhotosTabProps {
  photos: Photo[];
  photoFilter: 'all' | 'pending' | 'approved' | 'featured';
  setPhotoFilter: (value: 'all' | 'pending' | 'approved' | 'featured') => void;
  stats: {
    totalPhotos: number;
    pendingPhotos: number;
    approvedPhotos: number;
    featuredPhotos: number;
  };
  onApprove: (photoId: number) => void;
  onReject: (photoId: number) => void;
  onSetFeatured: (photoId: number, isFeatured: boolean) => void;
  onDelete: (photoId: number) => void;
}

export default function PhotosTab({
  photos,
  photoFilter,
  setPhotoFilter,
  stats,
  onApprove,
  onReject,
  onSetFeatured,
  onDelete,
}: PhotosTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Photo Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Photos" value={stats.totalPhotos} icon="📸" color="blue" />
        <StatCard title="Pending" value={stats.pendingPhotos} icon="⏳" color="yellow" />
        <StatCard title="Approved" value={stats.approvedPhotos} icon="✅" color="green" />
        <StatCard title="Featured" value={stats.featuredPhotos} icon="⭐" color="purple" />
      </div>

      {/* Photo Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPhotoFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              photoFilter === 'all' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.totalPhotos})
          </button>
          <button
            onClick={() => setPhotoFilter('pending')}
            className={`relative px-4 py-2 rounded-lg font-medium transition-all ${
              photoFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pendingPhotos})
            {stats.pendingPhotos > 0 && photoFilter !== 'pending' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setPhotoFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              photoFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({stats.approvedPhotos})
          </button>
          <button
            onClick={() => setPhotoFilter('featured')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              photoFilter === 'featured' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Featured ({stats.featuredPhotos})
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No photos in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.photoId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow relative group"
              >
                {/* Featured Badge */}
                {photo.isFeatured && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      ⭐ Featured
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2 z-10">
                  {photo.isApproved ? (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      ✓ Approved
                    </span>
                  ) : (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      ⏳ Pending
                    </span>
                  )}
                </div>

                {/* Image */}
                <div className="relative aspect-square">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || 'Wedding photo'}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col gap-2 p-4">
                      {!photo.isApproved && (
                        <>
                          <button
                            onClick={() => onApprove(photo.photoId)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => onReject(photo.photoId)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}

                      {photo.isApproved && (
                        <button
                          onClick={() => onSetFeatured(photo.photoId, !photo.isFeatured)}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            photo.isFeatured
                              ? 'bg-purple-500 text-white hover:bg-purple-600'
                              : 'bg-white text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          {photo.isFeatured ? '⭐ Unfeature' : '⭐ Feature'}
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(photo.photoId)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Photo Info */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-800 truncate">{photo.guestName}</p>
                  {photo.caption && (
                    <p className="text-xs text-gray-600 italic truncate">"{photo.caption}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(photo.createdDate).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}