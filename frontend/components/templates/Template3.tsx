'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wedding, Wish, Photo, SeatingTable, TemplateSlots, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import { toHijriString, alignClass, headingStyle, headingAnimationProps, sectionBgStyle, resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Template3Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}

function getMedia(coupleMedia: Photo[] | undefined, slot: number): string | null {
  const m = coupleMedia?.find((m) => m.templateSlot === slot);
  return m ? `${API_BASE}${m.photoUrl}` : null;
}

function PortraitSlot({ src, label }: { src: string | null; label: string }) {
  if (src) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-xl aspect-[3/4]">
        <img src={src} alt={label} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white text-sm font-medium text-center">{label}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border-2 border-dashed border-green-300 bg-green-50 aspect-[3/4] flex items-center justify-center">
      <div className="text-center text-green-400">
        <div className="text-4xl mb-2">🌿</div>
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

function ExtraImageSlot({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null;
  return (
    <div className="rounded-xl overflow-hidden shadow-md aspect-video">
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

export default function Template3({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled = false,
  tables = [],
  coupleMedia,
  customConfig,
  itinerary = [],
}: Template3Props) {
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
  const [isAttending, setIsAttending] = useState(true);
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    songRequest: '',
  });
  const [rsvpStep, setRsvpStep] = useState<1 | 2>(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Wish Form State
  const [wishData, setWishData] = useState({ guestName: '', message: '' });
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Photo Upload State
  const [photoData, setPhotoData] = useState({ guestName: '', caption: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  const weddingDate = new Date(wedding.weddingDate);

  const paxLimit = (wedding?.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;

  const navItems = sectionOrder.map((code) => ({ name: NAV_LABELS[code], section: code }));

  const groomPortrait = getMedia(coupleMedia, TemplateSlots.GROOM_PORTRAIT);
  const bridePortrait = getMedia(coupleMedia, TemplateSlots.BRIDE_PORTRAIT);
  const extra1 = getMedia(coupleMedia, TemplateSlots.EXTRA_1);
  const extra2 = getMedia(coupleMedia, TemplateSlots.EXTRA_2);
  const extra3 = getMedia(coupleMedia, TemplateSlots.EXTRA_3);

  const submitRSVP = async () => {
    setRsvpSubmitting(true);
    try {
      await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
      setRsvpSuccess(true);
      setRsvpStep(1);
      setSelectedTableId(null);
      setRsvpData({ guestName: '', email: '', phoneNumber: '', brideOrGroomSide: 'Bride', numberOfAttendees: 1, songRequest: '' });
    } catch { alert('Failed to submit RSVP'); }
    finally { setRsvpSubmitting(false); }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending && seatingEnabled && rsvpStep === 1) { setRsvpStep(2); return; }
    await submitRSVP();
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWishSubmitting(true);
    try {
      await onSubmitWish(wishData);
      setWishSuccess(true);
      setWishData({ guestName: '', message: '' });
    } finally {
      setWishSubmitting(false);
    }
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !onUploadPhoto) return;
    setPhotoSubmitting(true);
    try {
      await onUploadPhoto({ ...photoData, file: selectedFile });
      setPhotoSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoData({ guestName: '', caption: '' });
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] font-serif">
      {/* Decorative top banner */}
      <div className="h-2 bg-gradient-to-r from-green-700 via-green-500 to-emerald-400" />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-green-800 font-bold tracking-wide text-sm">
            🌿 {wedding.brideName} &amp; {wedding.groomName}
          </span>
          <div className="flex gap-1">
            {navItems.map(({ name, section }) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeSection === section
                    ? 'bg-green-600 text-white shadow'
                    : 'text-green-700 hover:bg-green-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {/* ===== WELCOME ===== */}
          {activeSection === 'welcome' && (
            <motion.div
              key="invitation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={sectionBgStyle(customConfig?.['section.welcome.bg'], API_BASE)}
              className="rounded-2xl"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <motion.p
                  {...hAnim}
                  className={`text-green-600 text-sm uppercase tracking-[0.25em] mb-3 ${alignClass(customConfig?.['invite.heading.align'])}`}
                  style={hStyle}
                >
                  — {t('invite.theme_label', 'Garden Romance')} —
                </motion.p>
                <motion.h1
                  {...hAnim}
                  transition={{ ...hAnim.transition, delay: Number(hAnim.transition?.delay ?? 0) + 0.2 }}
                  className="text-5xl md:text-6xl font-bold text-green-900 mb-3"
                  style={hStyle}
                >
                  {wedding.brideName}
                </motion.h1>
                <div className="flex items-center justify-center gap-4 my-4">
                  <div className="h-px w-24 bg-green-300" />
                  <span className="text-3xl text-green-500">&amp;</span>
                  <div className="h-px w-24 bg-green-300" />
                </div>
                <motion.h1
                  {...hAnim}
                  transition={{ ...hAnim.transition, delay: Number(hAnim.transition?.delay ?? 0) + 0.4 }}
                  className="text-5xl md:text-6xl font-bold text-green-900 mb-4"
                  style={hStyle}
                >
                  {wedding.groomName}
                </motion.h1>
                <p
                  className={`text-green-700 text-lg mb-8 max-w-md mx-auto ${alignClass(customConfig?.['invite.body.align'])}`}
                  dangerouslySetInnerHTML={{ __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding') }}
                />

                <div className="inline-block border border-green-300 rounded-2xl px-8 py-4 bg-white shadow-sm">
                  <p className="text-green-700 font-medium text-lg">
                    {weddingDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {showIslamicDate && (
                    <p className="text-green-500 text-sm mt-0.5">{toHijriString(weddingDate)}</p>
                  )}
                  <p className="text-green-600 text-sm mt-1">📍 {wedding.venue}</p>
                  {wedding.venueAddress && (
                    <p className="text-green-500 text-xs mt-0.5">{wedding.venueAddress}</p>
                  )}
                </div>
              </div>

              {/* Portraits */}
              <div className="grid grid-cols-2 gap-6 mb-10 max-w-sm mx-auto">
                <PortraitSlot src={groomPortrait} label={wedding.groomName} />
                <PortraitSlot src={bridePortrait} label={wedding.brideName} />
              </div>

              {/* Extra images */}
              {(extra1 || extra2 || extra3) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {extra1 && <ExtraImageSlot src={extra1} alt="Wedding photo 1" />}
                  {extra2 && <ExtraImageSlot src={extra2} alt="Wedding photo 2" />}
                  {extra3 && <ExtraImageSlot src={extra3} alt="Wedding photo 3" />}
                </div>
              )}

              {/* Countdown & message */}
              {wedding.daysUntilWedding > 0 && (
                <div className="text-center bg-white rounded-2xl shadow-sm border border-green-100 py-8 px-6">
                  <p className="text-green-500 text-sm mb-2">{t('invite.countdown_prefix', 'Celebrating in')}</p>
                  <p className="text-5xl font-bold text-green-800">{wedding.daysUntilWedding}</p>
                  <p className="text-green-600 text-lg">days</p>
                </div>
              )}

            </motion.div>
          )}

          {/* ===== WALIMAH ===== */}
          {activeSection === 'walimah' && (
            <motion.div
              key="walimah"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className={`max-w-lg mx-auto bg-white rounded-2xl border border-green-100 shadow-sm p-8 ${alignClass(customConfig?.['walimah.body.align'])}`}
            >
              <h2 className="text-2xl font-bold text-green-900 mb-4">Ceremony Details</h2>
              <div
                className="text-green-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: customConfig?.['walimah.body'] ?? '' }}
              />
            </motion.div>
          )}

          {/* ===== ITINERARY ===== */}
          {activeSection === 'itinerary' && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg mx-auto bg-white rounded-2xl border border-green-100 shadow-sm p-8"
            >
              {(() => {
                const iAlign = customConfig?.['walimah.body.align'] ?? 'left';
                return (
                  <>
                    <h2 className={`text-2xl font-bold text-green-900 mb-6 ${alignClass(iAlign)}`}>Schedule</h2>
                    <ol className="space-y-3">
                      {itinerary.map((item) => (
                        <li
                          key={item.itineraryItemId}
                          className={`flex gap-3 items-start ${iAlign === 'center' ? 'justify-center' : iAlign === 'right' ? 'justify-end' : ''}`}
                        >
                          {iAlign === 'left' && <span className="mt-1.5 w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                          <div className={alignClass(iAlign)}>
                            <p className="font-semibold text-green-900">{item.label}</p>
                            {item.detail && <p className="text-sm text-green-600">{item.detail}</p>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ===== RSVP ===== */}
          {activeSection === 'rsvp' && (
            <motion.div
              key="rsvp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg mx-auto rounded-2xl"
              style={sectionBgStyle(customConfig?.['section.ceremony.bg'], API_BASE)}
            >
              <h2 className="text-3xl font-bold text-green-900 text-center mb-2">RSVP</h2>
              <p className="text-green-600 text-center mb-8">{t('rsvp.subtitle', 'Will you be joining us?')}</p>

              {rsvpSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">🌿</div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Thank you!</h3>
                  <p className="text-green-600">Your RSVP has been received.</p>
                </div>
              ) : (
                <form onSubmit={handleRSVPSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-4">
                  {/* Attending toggle */}
                  <div className="flex gap-3">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setIsAttending(v)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all border-2 ${
                          isAttending === v
                            ? 'bg-green-600 text-white border-green-600'
                            : 'text-green-700 border-green-200 hover:border-green-400'
                        }`}
                      >
                        {v ? '✅ Attending' : '❌ Not Attending'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={rsvpData.guestName}
                    onChange={(e) => setRsvpData({ ...rsvpData, guestName: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={rsvpData.email}
                    onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={rsvpData.phoneNumber}
                    onChange={(e) => setRsvpData({ ...rsvpData, phoneNumber: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  {isAttending && (
                    <>
                      <div className="flex gap-3">
                        {['Bride', 'Groom'].map((side) => (
                          <button
                            key={side}
                            type="button"
                            onClick={() => setRsvpData({ ...rsvpData, brideOrGroomSide: side as 'Bride' | 'Groom' })}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                              rsvpData.brideOrGroomSide === side
                                ? 'bg-green-600 text-white border-green-600'
                                : 'text-green-700 border-green-200'
                            }`}
                          >
                            {side}&apos;s side
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={paxLimit}
                        placeholder="Number of attendees"
                        value={rsvpData.numberOfAttendees}
                        onChange={(e) => {
                          const raw = Number(e.target.value) || 1;
                          setRsvpData({ ...rsvpData, numberOfAttendees: Math.max(1, Math.min(raw, paxLimit)) });
                        }}
                        className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <input
                        type="text"
                        placeholder="Song request 🎵 (optional)"
                        value={rsvpData.songRequest}
                        onChange={(e) => setRsvpData({ ...rsvpData, songRequest: e.target.value })}
                        className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    {rsvpSubmitting ? 'Sending...' : isAttending && seatingEnabled ? 'Continue →' : 'Send RSVP'}
                  </button>
                </form>
              )}
              {!rsvpSuccess && rsvpStep === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mt-4">
                  <SeatingStep
                    tables={tables}
                    numberOfAttendees={rsvpData.numberOfAttendees}
                    selectedTableId={selectedTableId}
                    onSelect={setSelectedTableId}
                    onBack={() => setRsvpStep(1)}
                    onSubmit={submitRSVP}
                    submitting={rsvpSubmitting}
                    accentClass="bg-green-600 hover:bg-green-700"
                    accentBorderClass="border-green-500 bg-green-50"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* ===== WISHES ===== */}
          {activeSection === 'wishes' && (
            <motion.div
              key="wishes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto rounded-2xl"
              style={sectionBgStyle(customConfig?.['section.celebration.bg'], API_BASE)}
            >
              <h2 className="text-3xl font-bold text-green-900 text-center mb-4">Wishes &amp; Guestbook</h2>
              <p className="text-green-600 text-center mb-8">{t('wish.prompt', 'Leave a message for the happy couple')}</p>

              {!wishSuccess ? (
                <form onSubmit={handleWishSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-4 mb-10">
                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={wishData.guestName}
                    onChange={(e) => setWishData({ ...wishData, guestName: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <textarea
                    placeholder="Leave your wishes for the couple... *"
                    required
                    rows={4}
                    value={wishData.message}
                    onChange={(e) => setWishData({ ...wishData, message: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={wishSubmitting}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    {wishSubmitting ? 'Sending...' : 'Send Wishes 🌿'}
                  </button>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-10">
                  <p className="text-green-700 font-medium">Your wish has been sent! 🌿</p>
                </div>
              )}

              <div className="space-y-4">
                {wishes.map((wish) => (
                  <div key={wish.wishId} className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                    <p className="text-green-800 italic mb-3">&ldquo;{wish.message}&rdquo;</p>
                    <p className="text-green-500 text-sm">— {wish.guestName}</p>
                  </div>
                ))}
                {wishes.length === 0 && (
                  <p className="text-center text-green-400 text-sm py-8">Be the first to leave a wish!</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== PHOTOS ===== */}
          {activeSection === 'photobooth' && photoBoothEnabled && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-green-900 text-center mb-8">Photo Booth</h2>

              {!photoSuccess ? (
                <form onSubmit={handlePhotoSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-4 mb-10">
                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={photoData.guestName}
                    onChange={(e) => setPhotoData({ ...photoData, guestName: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={photoData.caption}
                    onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })}
                    className="w-full border border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <label className="block border-2 border-dashed border-green-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 transition-colors">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                    ) : (
                      <div className="text-green-400">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-sm">Click to select photo</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  <button
                    type="submit"
                    disabled={photoSubmitting || !selectedFile}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    {photoSubmitting ? 'Uploading...' : 'Share Photo'}
                  </button>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-10">
                  <p className="text-green-700 font-medium">Photo shared! 📸</p>
                </div>
              )}

              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {photos.map((photo) => (
                  <div key={photo.photoId} className="break-inside-avoid">
                    <img
                      src={`${API_BASE}${photo.photoUrl}`}
                      alt={photo.caption || 'Wedding photo'}
                      className="w-full rounded-xl shadow-sm"
                    />
                    {photo.caption && (
                      <p className="text-xs text-green-500 mt-1 px-1">{photo.caption}</p>
                    )}
                  </div>
                ))}
                {photos.length === 0 && (
                  <p className="text-center text-green-400 text-sm py-8 col-span-3">No photos yet. Be the first!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-green-400 text-xs">
        🌿 {wedding.brideName} &amp; {wedding.groomName} &bull;{' '}
        {weddingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        <br />
        {t('footer.tagline', 'Made with love for our special day')}
      </div>
    </div>
  );
}
