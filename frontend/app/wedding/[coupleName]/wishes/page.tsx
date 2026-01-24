'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { wishService, CreateWish } from '@/lib/api';
import { useForm } from 'react-hook-form';
import confetti from 'canvas-confetti';


interface WishFormData {
  guestName: string;
  wish: string;
}

export default function WishesPage() {
  const params = useParams();
  const router = useRouter();
  const coupleName = params.coupleName as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wishes, setWishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wishLength, setWishLength] = useState(0);


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WishFormData>({
    defaultValues: {
      guestName: '',
      wish: '',
    },
  });

  // Fetch wishes on component mount
const [weddingId, setWeddingId] = useState<number | null>(null);

// Fetch wedding once on mount
useEffect(() => {
  const fetchWeddingAndWishes = async () => {
    try {
      setIsLoading(true);
      const weddingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wedding/couple/${coupleName}`
      );
      const wedding = await weddingResponse.json();
      setWeddingId(wedding.weddingId); // Cache wedding ID

      const wishesData = await wishService.getByWeddingId(wedding.weddingId);
      setWishes(wishesData);
    } catch (err) {
      console.error('Failed to fetch wishes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchWeddingAndWishes();
}, [coupleName]);

// In onSubmit, use cached weddingId
const onSubmit = async (data: WishFormData) => {
  if (!weddingId) return; // Safety check

  try {
    setIsSubmitting(true);
    setSubmitError(null);

    const wishData: CreateWish = {
      guestName: data.guestName,
      message: data.wish,
    };

    await wishService.create(weddingId, wishData); // Use cached ID

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSubmitSuccess(true);
    reset();

    const updatedWishes = await wishService.getByWeddingId(weddingId);
    setWishes(updatedWishes);

    setTimeout(() => {
      setSubmitSuccess(false);
    }, 3000);
  } catch (err: any) {
    setSubmitError(
      err.response?.data?.message || 'Failed to submit wish. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-center mb-2 text-gray-800">
            Wishes & Blessings
          </h1>
          <p className="text-center text-gray-600 mb-12">
            Share your heartfelt wishes for the happy couple ✨
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 max-h-[600px] md:max-h-[600px] max-h-[400px] overflow-y-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Share Your Wish
              </h2>

              <AnimatePresence mode="wait">
                {submitSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 text-center"
                  >
                    <p className="text-green-700 font-medium">
                      ✅ Wish submitted successfully!
                    </p>
                  </motion.div>
                )}

                {submitError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-center"
                  >
                    <p className="text-red-700 font-medium">{submitError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    {...register('guestName', {
                      required: 'Name is required',
                    })}
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-400 transition-colors"
                  />
                  {errors.guestName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.guestName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Wish/Blessing *
                  </label>
                  <textarea
                    {...register('wish', {
                      required: 'Wish is required',
                      minLength: {
                        value: 10,
                        message: 'Wish must be at least 10 characters',
                      },
                      onChange: (e) => setWishLength(e.target.value.length),
                    })}
                    placeholder="Share your heartfelt wishes for the couple..."
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-400 transition-colors resize-none"
                  />
                    <div className="flex justify-between items-center mt-1">
                    {errors.wish ? (
                      <p className="text-red-500 text-sm">
                        {errors.wish.message}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        {wishLength}/10 characters minimum
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Wish'}
                </motion.button>
              </form>
            </motion.div>

            {/* Wishes Display Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 max-h-[600px] overflow-y-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                All Wishes ({wishes.length})
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Loading wishes...</p>
                </div>
              ) : wishes.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 text-center">
                    No wishes yet. Be the first to share! 💕
                  </p>
                </div>
              ) : (
                <motion.div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {wishes.map((wish, index) => (
                      <motion.div
                        key={wish.wishId || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-pink-50 to-blue-50 rounded-lg p-4 border-l-4 border-pink-400"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800">
                            {wish.guestName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(wish.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-600 text-sm italic">
                          "{wish.message}"
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Navigation Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => router.back()}
              className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
