'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { guestService, CreateGuest } from '@/lib/api';
import { useForm } from 'react-hook-form';

interface RSVPFormData {
  guestName: string;
  email: string;
  phoneNumber: string;
  brideOrGroomSide: 'Bride' | 'Groom';
  numberOfAttendees: number;
  songRequest: string;
}

export default function RSVPPage() {
  const params = useParams();
  const router = useRouter();
  const coupleName = params.coupleName as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(true); // Manual state

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RSVPFormData>({
    defaultValues: {
      numberOfAttendees: 1,
      brideOrGroomSide: 'Bride',
    },
  });

  const onSubmit = async (data: RSVPFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const weddingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wedding/couple/${coupleName}`
      );
      const wedding = await weddingResponse.json();

      const guestData: CreateGuest = {
        ...data,
        isAttending, // Use manual state
        numberOfAttendees: Number(data.numberOfAttendees),
      };

      await guestService.create(wedding.weddingId, guestData);

      setSubmitSuccess(true);

      setTimeout(() => {
        router.push(`/wedding/${coupleName}/wishes`);
      }, 2000);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || 'Failed to submit RSVP. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          RSVP
        </h1>
        <p className="text-center text-gray-600 mb-8">
          We'd love to have you celebrate with us! 💕
        </p>

        <AnimatePresence mode="wait">
          {submitSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-7xl mb-4"
              >
                ✅
              </motion.div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                RSVP Submitted!
              </h2>
              <p className="text-green-700">
                Thank you! Redirecting to wishes page...
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              {/* Attending Toggle - FIXED */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Will you be attending? *
                </label>
                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setIsAttending(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                      isAttending
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg font-semibold">
                      ✅ Yes, I'll be there!
                    </span>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setIsAttending(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                      !isAttending
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg font-semibold">
                      😢 Sorry, can't make it
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Guest Name - Always visible */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  {...register('guestName', { required: 'Name is required' })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
                {errors.guestName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.guestName.message}
                  </p>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isAttending && (
                  <motion.div
                    key="attending-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Email */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        {...register('phoneNumber')}
                        type="tel"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-colors"
                        placeholder="+60123456789"
                      />
                    </div>

                    {/* Side Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        I'm with the... *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                        >
                          <input
                            type="radio"
                            value="Bride"
                            {...register('brideOrGroomSide')}
                            className="sr-only peer"
                          />
                          <div className="rounded-lg border-2 border-gray-200 p-4 text-center peer-checked:border-rose-500 peer-checked:bg-rose-50 transition-all">
                            <span className="text-2xl block mb-1">👰</span>
                            <span className="font-semibold">Bride's Side</span>
                          </div>
                        </motion.label>

                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                        >
                          <input
                            type="radio"
                            value="Groom"
                            {...register('brideOrGroomSide')}
                            className="sr-only peer"
                          />
                          <div className="rounded-lg border-2 border-gray-200 p-4 text-center peer-checked:border-rose-500 peer-checked:bg-rose-50 transition-all">
                            <span className="text-2xl block mb-1">🤵</span>
                            <span className="font-semibold">Groom's Side</span>
                          </div>
                        </motion.label>
                      </div>
                    </div>

                    {/* Number of Attendees */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Guests *
                      </label>
                      <input
                        {...register('numberOfAttendees', {
                          required: isAttending ? 'Number of guests is required' : false,
                          min: isAttending ? { value: 1, message: 'At least 1 guest' } : undefined,
                          max: isAttending ? { value: 10, message: 'Maximum 10 guests' } : undefined,
                          setValueAs: (v) => Number(v), // Convert to number
                        })}
                        type="number"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-colors"
                        min="1"
                        max="10"
                      />
                      {errors.numberOfAttendees && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.numberOfAttendees.message}
                        </p>
                      )}
                    </div>

                    {/* Song Request */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Song Request 🎵
                      </label>
                      <input
                        {...register('songRequest')}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-colors"
                        placeholder="Your favorite song for the celebration!"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  {submitError}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit RSVP 💌'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}