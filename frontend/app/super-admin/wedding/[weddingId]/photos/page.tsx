'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { photoService, weddingService, Photo, Wedding } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import PhotoSkeleton from '@/components/skeletons/PhotoSkeleton';

export default function PhotoManagementPage() {
    const params = useParams();
    const router = useRouter();
    const weddingId = parseInt(params.weddingId as string);

    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [weddingId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [weddingData, photosData] = await Promise.all([
                weddingService.getById(weddingId),
                photoService.getByWeddingId(weddingId),
            ]);
            setWedding(weddingData);
            setPhotos(photosData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (photoId: number) => {
        setActionLoading(photoId);
        try {
            await photoService.approve(photoId, { isApproved: true });
            await fetchData();
        } catch (err) {
            alert('Failed to approve photo');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (photoId: number) => {
        const reason = prompt('Reason for rejection (optional):');
        setActionLoading(photoId);
        try {
            await photoService.approve(photoId, {
                isApproved: false,
                rejectionReason: reason || undefined,
            });
            await fetchData();
        } catch (err) {
            alert('Failed to reject photo');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetFeatured = async (photoId: number, isFeatured: boolean) => {
        setActionLoading(photoId);
        try {
            await photoService.setFeatured(photoId, isFeatured);
            await fetchData();
        } catch (err) {
            alert('Failed to set featured status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (photoId: number) => {
        if (!confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
            return;
        }
        setActionLoading(photoId);
        try {
            await photoService.delete(photoId);
            await fetchData();
        } catch (err) {
            alert('Failed to delete photo');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredPhotos = photos.filter((photo) => {
        switch (filter) {
            case 'pending':
                return !photo.isApproved;
            case 'approved':
                return photo.isApproved;
            case 'featured':
                return photo.isFeatured;
            default:
                return true;
        }
    });

    const pendingCount = photos.filter((p) => !p.isApproved).length;
    const approvedCount = photos.filter((p) => p.isApproved).length;
    const featuredCount = photos.filter((p) => p.isFeatured).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Photo Management</h1>
                            <p className="text-gray-600 mt-1">
                                {wedding?.brideName} & {wedding?.groomName}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/super-admin/wedding/${weddingId}`)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                ← Back to Wedding
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Photos" value={photos.length} icon="📸" color="blue" />
                    <StatCard
                        title="Pending Review"
                        value={pendingCount}
                        icon="⏳"
                        color="yellow"
                    />
                    <StatCard
                        title="Approved"
                        value={approvedCount}
                        icon="✅"
                        color="green"
                    />
                    <StatCard
                        title="Featured"
                        value={featuredCount}
                        icon="⭐"
                        color="purple"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6 p-4">
                    <div className="flex gap-2">
                        <FilterButton
                            active={filter === 'all'}
                            onClick={() => setFilter('all')}
                            label={`All (${photos.length})`}
                        />
                        <FilterButton
                            active={filter === 'pending'}
                            onClick={() => setFilter('pending')}
                            label={`Pending (${pendingCount})`}
                            badge={pendingCount > 0}
                        />
                        <FilterButton
                            active={filter === 'approved'}
                            onClick={() => setFilter('approved')}
                            label={`Approved (${approvedCount})`}
                        />
                        <FilterButton
                            active={filter === 'featured'}
                            onClick={() => setFilter('featured')}
                            label={`Featured (${featuredCount})`}
                        />
                    </div>
                </div>

                {/* Photo Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <PhotoSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredPhotos.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg">No photos in this category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredPhotos.map((photo, index) => (
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
                                            // src={getImageUrl(photo.photoUrl)}
                                            src={`http://localhost:5000${photo.photoUrl}`}

                                            alt={photo.caption || 'Wedding photo'}
                                            className="w-full h-full object-cover"
                                        />


                                        {/* Hover Overlay with Actions */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="flex flex-col gap-2 p-4">
                                                {!photo.isApproved && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(photo.photoId)}
                                                            disabled={actionLoading === photo.photoId}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(photo.photoId)}
                                                            disabled={actionLoading === photo.photoId}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </>
                                                )}

                                                {photo.isApproved && (
                                                    <button
                                                        onClick={() =>
                                                            handleSetFeatured(photo.photoId, !photo.isFeatured)
                                                        }
                                                        disabled={actionLoading === photo.photoId}
                                                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${photo.isFeatured
                                                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                                                : 'bg-white text-purple-600 hover:bg-purple-50'
                                                            }`}
                                                    >
                                                        {photo.isFeatured ? '⭐ Unfeature' : '⭐ Feature'}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDelete(photo.photoId)}
                                                    disabled={actionLoading === photo.photoId}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Loading Overlay */}
                                        {actionLoading === photo.photoId && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Photo Info */}
                                    <div className="p-3">
                                        <p className="font-semibold text-sm text-gray-800 truncate">
                                            {photo.guestName}
                                        </p>
                                        {photo.caption && (
                                            <p className="text-xs text-gray-600 italic truncate">
                                                "{photo.caption}"
                                            </p>
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
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        yellow: 'from-yellow-500 to-yellow-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 text-white`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm opacity-90 mb-1">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className="text-4xl opacity-80">{icon}</div>
            </div>
        </motion.div>
    );
}

// Filter Button Component
function FilterButton({
    active,
    onClick,
    label,
    badge,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    badge?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-2 rounded-lg font-medium transition-all ${active
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
            {label}
            {badge && !active && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}