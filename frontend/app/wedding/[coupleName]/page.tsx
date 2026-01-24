'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { weddingService, Wedding } from '@/lib/api';

// import ClassicTheme from '@/components/templates/Classic';
// import BohoTheme from '@/components/templates/Boho';

export default function InvitationPage() {
  const params = useParams();
  const coupleName = params.coupleName as string;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWedding = async () => {
      try {
        setLoading(true);
        const data = await weddingService.getByCoupleName(coupleName);
        setWedding(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Wedding not found');
      } finally {
        setLoading(false);
      }
    };

    fetchWedding();
  }, [coupleName]);

//   const themes: any = {
//   THEME_CLASSIC: ClassicTheme,
//   THEME_BOHO: BohoTheme,
// };

// export default function Invitation({ wedding }) {
//   // Dynamically select the component based on the DB value
//   const SelectedTheme = themes[wedding.templateCode] || ClassicTheme;
  
//   return <SelectedTheme data={wedding} />;
// }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-2xl text-red-500 mb-4">😢 {error}</p>
          <Link
            href="/"
            className="text-rose-600 hover:underline"
          >
            ← Back to home
          </Link>
        </motion.div>
      </div>
    );
  }

//   const Template = dynamic(() => import(`@/components/templates/${wedding.templateCode}`));
// return <Template data={wedding} />;

  const weddingDate = new Date(wedding.weddingDate);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        {/* Decorative Elements */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          💍
        </motion.div>

        {/* You're Invited */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-rose-600 text-sm uppercase tracking-widest mb-4 font-semibold"
        >
          You're Invited to the Wedding of
        </motion.p>

        {/* Couple Names */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-5xl md:text-7xl font-serif font-bold text-gray-800 mb-2"
        >
          {wedding.brideName}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-4xl md:text-5xl text-rose-400 my-4"
        >
          &
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-5xl md:text-7xl font-serif font-bold text-gray-800"
        >
          {wedding.groomName}
        </motion.h1>
      </motion.div>

      {/* Wedding Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8"
      >
        {/* Date & Time */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
              Save the Date
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {weddingDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-xl text-gray-600 mt-2">
              {weddingDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </motion.div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent mb-8" />

        {/* Venue */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
              Venue
            </p>
            <p className="text-2xl font-semibold text-gray-800 mb-1">
              {wedding.venue}
            </p>
            <p className="text-gray-600">{wedding.venueAddress}</p>
          </motion.div>
        </div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6"
        >
          <p className="text-sm text-gray-600 mb-2">Countdown</p>
          <motion.p
            key={wedding.daysUntilWedding}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-rose-600"
          >
            {wedding.daysUntilWedding}
          </motion.p>
          <p className="text-gray-600 mt-1">
            {wedding.daysUntilWedding === 1 ? 'day' : 'days'} to go! 🎉
          </p>
        </motion.div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link href={`/wedding/${coupleName}/rsvp`}>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(244, 63, 94, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            RSVP Now 💌
          </motion.button>
        </Link>

        <Link href={`/wedding/${coupleName}/wishes`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-rose-600 font-semibold rounded-xl border-2 border-rose-200 hover:border-rose-300 transition-colors"
          >
            Leave a Wish ✨
          </motion.button>
        </Link>
      </motion.div>

      {/* Guest Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="text-center mt-12 text-gray-500 text-sm"
      >
        <p>
          {wedding.totalAttending > 0
            ? `${wedding.totalAttending} ${wedding.totalAttending === 1 ? 'guest' : 'guests'} attending`
            : 'Be the first to RSVP!'}
        </p>
      </motion.div>
    </div>
  );
}