'use client';

import { StatCard } from '@/components/ui/Card';
import Image from 'next/image';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { photoService, eventService, Photo, Event } from '@/lib/api';
import PhotoSkeleton from '@/components/skeletons/PhotoSkeleton';

export default function PhotoManagementPage() {
    const params = useParams();
    const router = useRouter();
    const weddingId = parseInt(params.weddingId as string);

    const [wedding, setWedding] = useState<Event | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            const [weddingData, photosData] = await Promise.all([
                eventService.getById(weddingId),
                photoService.getByWeddingId(weddingId),
            ]);
            if (signal?.aborted) return;
            setWedding(weddingData);
            setPhotos(photosData);
        } catch (err) {
            if (signal?.aborted) return;
            console.error('Failed to load data:', err);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [weddingId]);
  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

    const handleApprove = async (photoId: number) => {
        setActionLoading(photoId);
        try {
            await photoService.approve(photoId, { isApproved: true });
            await fetchData();
        } catch {
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
        } catch {
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
        } catch {
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
        } catch {
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
            <div className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-strong)]">Photo Management</h1>
                            <p className="text-[var(--text-muted)] mt-1">
                                {wedding?.displayName}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/super-admin/wedding/${weddingId}`)}
                                className="px-4 py-2 bg-[var(--brand-subtle-2)] text-[var(--text-body)] rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                ← Back to Wedding
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <StatCard label="Total photos" value={photos.length} />
                    <StatCard label="Pending review" value={pendingCount} tone="gold" />
                    <StatCard label="Approved" value={approvedCount} tone="success" />
                    <StatCard label="Featured" value={featuredCount} tone="brand" />
                </div>

                {/* Filter Tabs */}
                <div className="bg-[var(--surface-card)] rounded-xl shadow-md mb-6 p-4">
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
                    <div className="bg-[var(--surface-card)] rounded-xl shadow-md p-12 text-center">
                        <p className="text-[var(--text-muted)] text-lg">No photos in this category</p>
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
                                    className="bg-[var(--surface-card)] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow relative group"
                                >
                                    {/* Featured Badge */}
                                    {photo.isFeatured && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <span className="bg-[var(--brand-subtle)] text-[var(--brand)] text-xs px-2 py-1 rounded-full font-semibold">
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
                                        <Image fill unoptimized loading="eager" sizes="(min-width: 768px) 33vw, 100vw"
                                            src={photo.photoUrl}

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
                                                                ? 'bg-[var(--brand)] text-[var(--brand-on)] hover:bg-[var(--brand-hover)]'
                                                                : 'bg-[var(--surface-card)] text-[var(--brand)] hover:bg-[var(--brand-subtle)]'
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
                                        <p className="font-semibold text-sm text-[var(--text-strong)] truncate">
                                            {photo.guestName}
                                        </p>
                                        {photo.caption && (
                                            <p className="text-xs text-[var(--text-muted)] italic truncate">
                                                &quot;{photo.caption}&quot;
                                            </p>
                                        )}
                                        <p className="text-xs text-[var(--text-subtle)] mt-1">
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
                    ? 'bg-[var(--brand)] text-[var(--brand-on)]'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-body)] hover:bg-[var(--brand-subtle-2)]'
                }`}
        >
            {label}
            {badge && !active && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}