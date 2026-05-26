'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Wedding, Wish, Photo, SeatingTable, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import { toHijriString, alignClass, headingStyle, headingAnimationProps, sectionBgStyle, resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Template1Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}

export default function Template1({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled = false,
  tables = [],
  customConfig,
  itinerary = [],
}: Template1Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const showIslamicDate = customConfig?.['general.showIslamicDate'] === 'true';
  const hStyle = headingStyle(customConfig);
  const hAnim = headingAnimationProps(customConfig);
  const sectionOrder = resolveSectionOrder(
    customConfig?.['section.order'],
    !!customConfig?.['walimah.body'],
    itinerary.length > 0,
    photoBoothEnabled,
  );
  const NAV_LABELS: Record<SectionCode, string> = {
    welcome: t('nav.invite', 'Invitation'),
    walimah: t('nav.walimah', 'Ceremony'),
    rsvp: t('nav.rsvp', 'RSVP'),
    itinerary: t('nav.itinerary', 'Schedule'),
    wishes: t('nav.wishes', 'Wishes'),
    photobooth: t('nav.photos', 'Photos'),
  };
  const [activeSection, setActiveSection] = useState<SectionCode>('welcome');

  // RSVP Form State
  const [rsvpStep, setRsvpStep] = useState<1 | 2>(1);
  const [isAttending, setIsAttending] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    songRequest: '',
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Wish Form State
  const [wishData, setWishData] = useState({
    guestName: '',
    message: '',
  });
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Photo Upload State
  const [photoData, setPhotoData] = useState({
    guestName: '',
    caption: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const weddingDate = new Date(wedding.weddingDate);

  const paxLimit = (wedding?.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;

  const navItems = sectionOrder.map((code) => ({ name: NAV_LABELS[code], section: code }));

  const goToSeating = () => setRsvpStep(2);
  const goBackToForm = () => setRsvpStep(1);

  const submitRSVP = async () => {
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
      setRsvpSuccess(true);
      setRsvpStep(1);
      setSelectedTableId(null);
      setRsvpData({
        guestName: '',
        email: '',
        phoneNumber: '',
        brideOrGroomSide: 'Bride',
        numberOfAttendees: 1,
        songRequest: '',
      });
      setTimeout(() => {
        setRsvpSuccess(false);
        setActiveSection('wishes');
      }, 2000);
    } catch {
      alert('Failed to submit RSVP');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // RSVP Submit
  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If attending + seating enabled → go to step 2 first
    if (isAttending && seatingEnabled && rsvpStep === 1) {
      goToSeating();
      return;
    }
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
      setRsvpSuccess(true);
      setRsvpData({
        guestName: '',
        email: '',
        phoneNumber: '',
        brideOrGroomSide: 'Bride',
        numberOfAttendees: 1,
        songRequest: '',
      });
      setTimeout(() => {
        setRsvpSuccess(false);
        setActiveSection('wishes');
      }, 2000);
    } catch (err) {
      alert('Failed to submit RSVP');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Wish Submit
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishSubmitting(true);
    try {
      await onSubmitWish(wishData);
      setWishSuccess(true);
      setWishData({ guestName: '', message: '' });
      setTimeout(() => setWishSuccess(false), 3000);
    } catch (err) {
      alert('Failed to submit wish');
    } finally {
      setWishSubmitting(false);
    }
  };

  // Photo Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !onUploadPhoto) return;

    setPhotoSubmitting(true);
    try {
      await onUploadPhoto({
        ...photoData,
        file: selectedFile,
      });
      setPhotoSuccess(true);
      setPhotoData({ guestName: '', caption: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setPhotoSuccess(false), 3000);
    } catch (err) {
      alert('Failed to upload photo');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-center gap-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveSection(item.section)}
                >
                  <motion.div
                    className={`relative px-4 py-2 rounded-lg transition-colors ${isActive
                        ? 'text-rose-600 font-semibold'
                        : 'text-gray-600 hover:text-rose-500'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"
                        layoutId="activeTab"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Welcome Section */}
          {activeSection === 'welcome' && (
            <motion.div
              key="invitation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={sectionBgStyle(customConfig?.['section.welcome.bg'], API_BASE)}
              className="rounded-2xl"
            >
              {/* Hero Section */}
              <div className={`mb-16 ${alignClass(customConfig?.['invite.heading.align'])}`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  💍
                </motion.div>

                <motion.p
                  {...hAnim}
                  className="text-rose-600 text-sm uppercase tracking-widest mb-4 font-semibold"
                  style={hStyle}
                >
                  {t('invite.heading', "You're Invited to the Wedding of")}
                </motion.p>

                <motion.h1
                  {...hAnim}
                  transition={{ ...hAnim.transition, delay: Number(hAnim.transition?.delay ?? 0) + 0.2 }}
                  className="text-5xl md:text-7xl font-serif font-bold text-gray-800 mb-2"
                  style={hStyle}
                >
                  {wedding.brideName}
                </motion.h1>

                <div className="text-4xl md:text-5xl text-rose-400 my-4">&</div>

                <motion.h1
                  {...hAnim}
                  transition={{ ...hAnim.transition, delay: Number(hAnim.transition?.delay ?? 0) + 0.4 }}
                  className="text-5xl md:text-7xl font-serif font-bold text-gray-800"
                  style={hStyle}
                >
                  {wedding.groomName}
                </motion.h1>
                <p
                  className={`text-gray-600 text-lg mt-6 max-w-md mx-auto ${alignClass(customConfig?.['invite.body.align'])}`}
                  dangerouslySetInnerHTML={{ __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding') }}
                />
              </div>

              {/* Wedding Details */}
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
                <div className="text-center mb-8">
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
                  {showIslamicDate && (
                    <p className="text-sm text-rose-400 mt-1 tracking-wide">
                      {toHijriString(weddingDate)}
                    </p>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent mb-8" />

                <div className="text-center mb-8">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Venue
                  </p>
                  <p className="text-2xl font-semibold text-gray-800 mb-1">
                    {wedding.venue}
                  </p>
                  <p className="text-gray-600">{wedding.venueAddress}</p>
                </div>

                <div className="text-center bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6">
                  <p className="text-sm text-gray-600 mb-2">Countdown</p>
                  <p className="text-4xl font-bold text-rose-600">
                    {wedding.daysUntilWedding}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {wedding.daysUntilWedding === 1 ? 'day' : 'days'} to go! 🎉
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={() => setActiveSection('rsvp')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg"
                >
                  RSVP Now 💌
                </motion.button>

                <motion.button
                  onClick={() => setActiveSection('wishes')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-rose-600 font-semibold rounded-xl border-2 border-rose-200"
                >
                  Leave a Wish ✨
                </motion.button>
              </div>

              <div className="text-center mt-12 text-gray-500 text-sm">
                <p>
                  {wedding.totalAttending > 0
                    ? `${wedding.totalAttending} ${wedding.totalAttending === 1 ? 'guest' : 'guests'
                    } attending`
                    : 'Be the first to RSVP!'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Walimah Section */}
          {activeSection === 'walimah' && (
            <motion.div
              key="walimah"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-2xl shadow-md p-8 ${alignClass(customConfig?.['walimah.body.align'])}`}
            >
              <h2 className="text-3xl font-bold text-rose-500 mb-6">Ceremony Details</h2>
              <div
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: customConfig?.['walimah.body'] ?? '' }}
              />
            </motion.div>
          )}

          {/* Itinerary Section */}
          {activeSection === 'itinerary' && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-md p-8"
            >
              {(() => {
                const iAlign = customConfig?.['walimah.body.align'] ?? 'left';
                return (
                  <>
                    <h2 className={`text-3xl font-bold text-rose-500 mb-6 ${alignClass(iAlign)}`}>Schedule</h2>
                    <ol className="space-y-3">
                      {itinerary.map((item) => (
                        <li
                          key={item.itineraryItemId}
                          className={`flex gap-4 items-start ${iAlign === 'center' ? 'justify-center' : iAlign === 'right' ? 'justify-end' : ''}`}
                        >
                          {iAlign === 'left' && <span className="mt-1 w-2 h-2 rounded-full bg-rose-400 shrink-0" />}
                          <div className={alignClass(iAlign)}>
                            <p className="font-semibold text-gray-800">{item.label}</p>
                            {item.detail && <p className="text-sm text-gray-500">{item.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* RSVP Section */}
          {activeSection === 'rsvp' && (
            <motion.div
              key="rsvp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto rounded-2xl"
              style={sectionBgStyle(customConfig?.['section.ceremony.bg'], API_BASE)}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">RSVP</h2>
                <p className="text-gray-600">
                  {t('rsvp.subtitle', "We'd love to have you celebrate with us! 💕")}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {rsvpSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center"
                  >
                    <div className="text-7xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">RSVP Submitted!</h3>
                    <p className="text-green-700">Thank you! Redirecting to wishes...</p>
                  </motion.div>
                ) : rsvpStep === 2 ? (
                  <div key="step2" className="bg-white rounded-2xl shadow-xl p-8">
                    <SeatingStep
                      tables={tables}
                      numberOfAttendees={rsvpData.numberOfAttendees}
                      selectedTableId={selectedTableId}
                      onSelect={setSelectedTableId}
                      onBack={goBackToForm}
                      onSubmit={submitRSVP}
                      submitting={rsvpSubmitting}
                    />
                  </div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleRSVPSubmit}
                    className="bg-white rounded-2xl shadow-xl p-8"
                  >
                    {/* Attending Toggle */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Will you be attending? *
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setIsAttending(true)}
                          className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${isAttending
                              ? 'border-rose-500 bg-rose-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <span className="text-lg font-semibold">
                            ✅ Yes, I'll be there!
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAttending(false)}
                          className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${!isAttending
                              ? 'border-gray-500 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <span className="text-lg font-semibold">
                            😢 Sorry, can't make it
                          </span>
                        </button>
                      </div>
                    </div>

                    {isAttending && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <input
                          type="text"
                          placeholder="Your Name *"
                          value={rsvpData.guestName}
                          onChange={(e) =>
                            setRsvpData({ ...rsvpData, guestName: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none"
                          required
                        />

                        <input
                          type="email"
                          placeholder="Email"
                          value={rsvpData.email}
                          onChange={(e) =>
                            setRsvpData({ ...rsvpData, email: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none"
                        />

                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={rsvpData.phoneNumber}
                          onChange={(e) =>
                            setRsvpData({ ...rsvpData, phoneNumber: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name="side"
                              value="Bride"
                              checked={rsvpData.brideOrGroomSide === 'Bride'}
                              onChange={(e) =>
                                setRsvpData({
                                  ...rsvpData,
                                  brideOrGroomSide: e.target.value as 'Bride',
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="rounded-lg border-2 border-gray-200 p-4 text-center peer-checked:border-rose-500 peer-checked:bg-rose-50">
                              <span className="text-2xl block mb-1">👰</span>
                              <span className="font-semibold">Bride's Side</span>
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name="side"
                              value="Groom"
                              checked={rsvpData.brideOrGroomSide === 'Groom'}
                              onChange={(e) =>
                                setRsvpData({
                                  ...rsvpData,
                                  brideOrGroomSide: e.target.value as 'Groom',
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="rounded-lg border-2 border-gray-200 p-4 text-center peer-checked:border-rose-500 peer-checked:bg-rose-50">
                              <span className="text-2xl block mb-1">🤵</span>
                              <span className="font-semibold">Groom's Side</span>
                            </div>
                          </label>
                        </div>

                        <input
                          type="number"
                          placeholder="Number of Guests *"
                          min="1"
                          max={paxLimit}
                          value={rsvpData.numberOfAttendees}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value) || 1;
                            setRsvpData({ ...rsvpData, numberOfAttendees: Math.max(1, Math.min(raw, paxLimit)) });
                          }}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none"
                          required
                        />

                        <input
                          type="text"
                          placeholder="Song Request 🎵"
                          value={rsvpData.songRequest}
                          onChange={(e) =>
                            setRsvpData({ ...rsvpData, songRequest: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-rose-400 focus:outline-none"
                        />
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={rsvpSubmitting}
                      className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all ${rsvpSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
                        }`}
                    >
                      {rsvpSubmitting
                        ? 'Submitting...'
                        : isAttending && seatingEnabled
                        ? 'Continue →'
                        : 'Submit RSVP 💌'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Wishes Section */}
          {activeSection === 'wishes' && (
            <motion.div
              key="wishes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={sectionBgStyle(customConfig?.['section.celebration.bg'], API_BASE)}
              className="rounded-2xl"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">
                  Wishes & Blessings
                </h2>
                <p className="text-gray-600">
                  {t('wish.prompt', "Share your heartfelt wishes for the happy couple ✨")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Wish Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-semibold mb-6">Share Your Wish</h3>

                  {wishSuccess && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 text-center">
                      <p className="text-green-700 font-medium">
                        ✅ Wish submitted successfully!
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleWishSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={wishData.guestName}
                      onChange={(e) =>
                        setWishData({ ...wishData, guestName: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-rose-400"
                      required
                    />

                    <textarea
                      placeholder="Your wishes for the couple... *"
                      value={wishData.message}
                      onChange={(e) =>
                        setWishData({ ...wishData, message: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-rose-400 resize-none"
                      required
                    />

                    <button
                      type="submit"
                      disabled={wishSubmitting}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${wishSubmitting
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg'
                        }`}
                    >
                      {wishSubmitting ? 'Submitting...' : 'Submit Wish ✨'}
                    </button>
                  </form>
                </div>

                {/* Wishes Display */}
                <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[600px] overflow-y-auto">
                  <h3 className="text-2xl font-semibold mb-6">
                    All Wishes ({wishes.length})
                  </h3>

                  {wishes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No wishes yet. Be the first! 💕
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wishes
                        .slice()
                        .map((wish) => (
                          <div
                            key={wish.wishId}
                            className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border-l-4 border-rose-400"
                          >
                            <p className="font-semibold text-gray-800 mb-2">
                              {wish.guestName}
                            </p>
                            <p className="text-gray-600 text-sm italic">
                              "{wish.message}"
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(wish.createdDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Photos Section */}
      {activeSection === 'photobooth' && photoBoothEnabled && (
        <motion.div
          key="photos"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              Photo Booth
            </h2>
            <p className="text-gray-600">
              Share your favorite moments! 📸
            </p>
          </div>

          {/* Photo Upload Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Upload a Photo</h3>

            {photoSuccess && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-green-700 font-medium">
                  ✅ Photo uploaded successfully!
                </p>
              </div>
            )}

            <form onSubmit={handlePhotoSubmit} className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <input
                type="text"
                placeholder="Your Name *"
                value={photoData.guestName}
                onChange={(e) =>
                  setPhotoData({ ...photoData, guestName: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
                required
              />

              <input
                type="text"
                placeholder="Caption (optional)"
                value={photoData.caption}
                onChange={(e) =>
                  setPhotoData({ ...photoData, caption: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-rose-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={photoSubmitting || !selectedFile}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
                  photoSubmitting || !selectedFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg'
                }`}
              >
                {photoSubmitting ? 'Uploading...' : 'Upload Photo 📤'}
              </button>
            </form>
          </div>

          {/* Photo Gallery */}
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-center">
              Gallery ({photos.length})
            </h3>

            {photos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <p className="text-gray-500">
                  No photos yet. Be the first to share!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.photoId}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={`${API_BASE}${photo.photoUrl}`}
                      alt={photo.caption}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-sm">
                        {photo.guestName}
                      </p>
                      {photo.caption && (
                        <p className="text-xs text-gray-600 italic">
                          "{photo.caption}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </main>
  <footer className="text-center py-6 text-gray-400 text-xs">
    {t('footer.tagline', 'Made with love for our special day')}
  </footer>
</div>
  );
}