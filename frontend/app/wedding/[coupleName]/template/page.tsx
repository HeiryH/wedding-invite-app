'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  weddingService,
  guestService,
  wishService,
  photoService,
  weddingFeatureService,
  Wedding,
  Guest,
  Wish,
  Photo,
} from '@/lib/api';
import Template2 from '@/components/templates/Template2';

export default function Template2Page() {
  const params = useParams();
  const coupleName = params.coupleName as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch wedding
        const weddingData = await weddingService.getByCoupleName(coupleName);
        setWedding(weddingData);

        // Fetch guests
        const guestsData = await guestService.getByWeddingId(weddingData.weddingId);
        setGuests(guestsData);

        // Fetch wishes
        const wishesData = await wishService.getByWeddingId(weddingData.weddingId);
        setWishes(wishesData);

        // Check photo booth
        const photoEnabled = await weddingFeatureService.isFeatureEnabled(
          weddingData.weddingId,
          'PHOTO_BOOTH'
        );
        setPhotoBoothEnabled(photoEnabled);

        if (photoEnabled) {
          const photosData = await photoService.getVisibleByWeddingId(weddingData.weddingId);
          setPhotos(photosData);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wedding');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coupleName]);

  const handleRSVP = async (data: any) => {
    if (!wedding) return;
    
    await guestService.create(wedding.weddingId, {
      guestName: data.guestName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      brideOrGroomSide: data.brideOrGroomSide,
      numberOfAttendees: data.numberOfAttendees,
      songRequest: data.songRequest,
      isAttending: data.isAttending,
    });

    // Refresh guests
    const updatedGuests = await guestService.getByWeddingId(wedding.weddingId);
    setGuests(updatedGuests);
  };

  const handleSubmitWish = async (data: any) => {
    if (!wedding) return;
    
    await wishService.create(wedding.weddingId, {
      guestName: data.guestName,
      message: data.message,
    });

    // Refresh wishes
    const updatedWishes = await wishService.getByWeddingId(wedding.weddingId);
    setWishes(updatedWishes);
  };

  const handleUploadPhoto = async (data: any) => {
    if (!wedding) return;
    
    await photoService.upload(
      wedding.weddingId,
      data.guestName,
      data.caption,
      data.file
    );

    // Refresh photos
    const updatedPhotos = await photoService.getVisibleByWeddingId(wedding.weddingId);
    setPhotos(updatedPhotos);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <Template2
      wedding={wedding}
      onRSVP={handleRSVP}
      onSubmitWish={handleSubmitWish}
      onUploadPhoto={handleUploadPhoto}
      guests={guests}
      wishes={wishes}
      photos={photos}
      photoBoothEnabled={photoBoothEnabled}
    />
  );
}