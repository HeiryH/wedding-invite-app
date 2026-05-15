'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wedding, Guest, Wish, Photo, SeatingTable, ItineraryItem } from '@/lib/api';
import SeatingStep from './SeatingStep';
import { toHijriString, alignClass, headingStyle, headingAnimationProps, sectionBgStyle, resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Template2Props {
    wedding: Wedding;
    onRSVP: (data: any) => Promise<void>;
    onSubmitWish: (data: any) => Promise<void>;
    onUploadPhoto?: (data: any) => Promise<void>;
    guests?: Guest[];
    wishes: Wish[];
    photos: Photo[];
    photoBoothEnabled: boolean;
    seatingEnabled?: boolean;
    tables?: SeatingTable[];
    customConfig?: Record<string, string>;
    itinerary?: ItineraryItem[];
}

export default function Template2({
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
}: Template2Props) {
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
    const NAV_ICONS: Record<SectionCode, string> = {
        welcome: '💍', walimah: '🕌', rsvp: '✉️',
        itinerary: '📋', wishes: '✨', photobooth: '📸',
    };
    const NAV_LABELS: Record<SectionCode, string> = {
        welcome: t('nav.invite', 'Invite'),
        walimah: t('nav.walimah', 'Ceremony'),
        rsvp: t('nav.rsvp', 'RSVP'),
        itinerary: t('nav.itinerary', 'Schedule'),
        wishes: t('nav.wishes', 'Wishes'),
        photobooth: t('nav.photos', 'Photos'),
    };
    const [activeSection, setActiveSection] = useState<SectionCode>('welcome');
    const [showNav, setShowNav] = useState(true);

    const weddingDate = new Date(wedding.weddingDate);

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

    // Scroll to section
    const scrollToSection = (code: SectionCode) => {
        setActiveSection(code);
        document.getElementById(code)?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle scroll spy
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            for (const code of sectionOrder) {
                const element = document.getElementById(code);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(code);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionOrder.join(',')]);

    const submitRSVP = async () => {
        setRsvpSubmitting(true);
        try {
            await onRSVP({ ...rsvpData, isAttending, tableId: selectedTableId });
            setRsvpSuccess(true);
            setRsvpStep(1);
            setSelectedTableId(null);
            setRsvpData({ guestName: '', email: '', phoneNumber: '', brideOrGroomSide: 'Bride', numberOfAttendees: 1, songRequest: '' });
            setTimeout(() => { setRsvpSuccess(false); scrollToSection('wishes'); }, 2000);
        } catch { alert('Failed to submit RSVP'); }
        finally { setRsvpSubmitting(false); }
    };

    // RSVP Submit
    const handleRSVPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAttending && seatingEnabled && rsvpStep === 1) { setRsvpStep(2); return; }
        await submitRSVP();
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
        <>
        <div className="flex flex-col bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
            {/* Floating Navigation */}
            <AnimatePresence>
                {showNav && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-4"
                    >
                        {sectionOrder.map((code) => ({ id: code, label: NAV_ICONS[code], name: NAV_LABELS[code] })).map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={() => scrollToSection(item.id as SectionCode)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`group relative w-14 h-14 rounded-full shadow-lg transition-all ${activeSection === item.id
                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                                    : 'bg-white hover:bg-yellow-50'
                                    }`}
                            >
                                <span className="text-2xl">{item.label}</span>
                                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {item.name}
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section: Welcome */}
            <section
                id="welcome"
                className="min-h-screen flex items-center justify-center px-4 py-20"
                style={{ order: sectionOrder.indexOf('welcome'), ...sectionBgStyle(customConfig?.['section.welcome.bg'], API_BASE) }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl"
                >
                    {/* Decorative Ring */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        className="text-8xl mb-8"
                    >
                        💍
                    </motion.div>

                    {/* You're Invited */}
                    <motion.p
                        {...hAnim}
                        className={`text-amber-700 text-sm uppercase tracking-widest mb-6 font-semibold ${alignClass(customConfig?.['invite.heading.align'])}`}
                        style={hStyle}
                    >
                        {t('invite.heading', "You're Cordially Invited to Celebrate")}
                    </motion.p>

                    {/* Couple Names */}
                    <motion.h1
                        initial={Object.keys(hAnim.initial).length ? hAnim.initial : { opacity: 0, y: 20 }}
                        animate={Object.keys(hAnim.animate).length ? hAnim.animate : { opacity: 1, y: 0 }}
                        transition={{ ...(Object.keys(hAnim.transition).length ? hAnim.transition : {}), delay: 0.7 }}
                        className="text-6xl md:text-8xl font-serif font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-4"
                    >
                        {wedding.brideName}
                    </motion.h1>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="text-5xl md:text-6xl text-amber-400 my-6"
                    >
                        &
                    </motion.div>

                    <motion.h1
                        initial={Object.keys(hAnim.initial).length ? hAnim.initial : { opacity: 0, y: 20 }}
                        animate={Object.keys(hAnim.animate).length ? hAnim.animate : { opacity: 1, y: 0 }}
                        transition={{ ...(Object.keys(hAnim.transition).length ? hAnim.transition : {}), delay: 1.1 }}
                        className="text-6xl md:text-8xl font-serif font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-8"
                    >
                        {wedding.groomName}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className={`text-gray-600 text-lg mb-12 max-w-md mx-auto ${alignClass(customConfig?.['invite.body.align'])}`}
                        dangerouslySetInnerHTML={{ __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding') }}
                    />

                    {/* Wedding Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border-2 border-yellow-200"
                    >
                        <div className="mb-8">
                            <p className="text-sm text-amber-700 uppercase tracking-wider mb-2">
                                Save the Date
                            </p>
                            <p className="text-3xl font-bold text-gray-800 mb-2">
                                {weddingDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                            <p className="text-xl text-gray-600">
                                {weddingDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                            {showIslamicDate && (
                                <p className="text-sm text-amber-500 mt-1 tracking-wide">
                                    {toHijriString(weddingDate)}
                                </p>
                            )}
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mb-8" />

                        <div className="mb-8">
                            <p className="text-sm text-amber-700 uppercase tracking-wider mb-2">
                                Venue
                            </p>
                            <p className="text-2xl font-semibold text-gray-800 mb-1">
                                {wedding.venue}
                            </p>
                            <p className="text-gray-600">{wedding.venueAddress}</p>
                        </div>

                        {/* Countdown */}
                        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-6">
                            <p className="text-sm text-amber-700 mb-2">Countdown</p>
                            <p className="text-5xl font-bold text-amber-600">
                                {wedding.daysUntilWedding}
                            </p>
                            <p className="text-gray-600 mt-1">
                                {wedding.daysUntilWedding === 1 ? 'day' : 'days'} to go! 🎉
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="mt-16"
                    >
                        <p className="text-amber-700 text-sm mb-2">Scroll to RSVP</p>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-3xl"
                        >
                            ↓
                        </motion.div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Section: Walimah */}
            {sectionOrder.includes('walimah') && (
                <section
                    id="walimah"
                    className="flex items-center justify-center px-4 py-20"
                    style={{ order: sectionOrder.indexOf('walimah') }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className={`w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-amber-200 p-8 ${alignClass(customConfig?.['walimah.body.align'])}`}
                    >
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-4">
                            Ceremony Details
                        </h2>
                        <div
                            className="text-gray-600 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: customConfig?.['walimah.body'] ?? '' }}
                        />
                    </motion.div>
                </section>
            )}

            {/* Section: Itinerary */}
            {sectionOrder.includes('itinerary') && (
                <section
                    id="itinerary"
                    className="flex items-center justify-center px-4 py-20"
                    style={{ order: sectionOrder.indexOf('itinerary') }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-amber-200 p-8"
                    >
                        {(() => {
                            const iAlign = customConfig?.['walimah.body.align'] ?? 'left';
                            return (
                                <>
                                    <h2 className={`text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-6 ${alignClass(iAlign)}`}>
                                        Schedule
                                    </h2>
                                    <ol className="space-y-3">
                                        {itinerary.map((item) => (
                                            <li
                                                key={item.itineraryItemId}
                                                className={`flex gap-4 items-start ${iAlign === 'center' ? 'justify-center' : iAlign === 'right' ? 'justify-end' : ''}`}
                                            >
                                                {iAlign === 'left' && <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
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
                </section>
            )}

            {/* Section: RSVP */}
            <section
                id="rsvp"
                className="min-h-screen flex items-center justify-center px-4 py-20"
                style={{ order: sectionOrder.indexOf('rsvp'), ...sectionBgStyle(customConfig?.['section.ceremony.bg'], API_BASE) }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
                            RSVP
                        </h2>
                        <p className="text-gray-600 text-lg">
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
                                className="bg-green-50 border-2 border-green-200 rounded-3xl p-12 text-center"
                            >
                                <div className="text-7xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-green-800 mb-2">
                                    RSVP Submitted!
                                </h3>
                                <p className="text-green-700">Thank you!</p>
                            </motion.div>
                        ) : rsvpStep === 2 ? (
                            <div key="step2" className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-yellow-200">
                                <SeatingStep
                                    tables={tables}
                                    numberOfAttendees={rsvpData.numberOfAttendees}
                                    selectedTableId={selectedTableId}
                                    onSelect={setSelectedTableId}
                                    onBack={() => setRsvpStep(1)}
                                    onSubmit={submitRSVP}
                                    submitting={rsvpSubmitting}
                                    accentClass="bg-gradient-to-r from-yellow-500 to-amber-500"
                                    accentBorderClass="border-yellow-500 bg-yellow-50"
                                />
                            </div>
                        ) : (
                            <motion.form
                                key="form"
                                onSubmit={handleRSVPSubmit}
                                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-yellow-200"
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
                                                ? 'border-amber-500 bg-amber-50'
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
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                            required
                                        />

                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={rsvpData.email}
                                            onChange={(e) =>
                                                setRsvpData({ ...rsvpData, email: e.target.value })
                                            }
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                        />

                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={rsvpData.phoneNumber}
                                            onChange={(e) =>
                                                setRsvpData({ ...rsvpData, phoneNumber: e.target.value })
                                            }
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
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
                                                <div className="rounded-xl border-2 border-gray-200 p-4 text-center peer-checked:border-amber-500 peer-checked:bg-amber-50">
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
                                                <div className="rounded-xl border-2 border-gray-200 p-4 text-center peer-checked:border-amber-500 peer-checked:bg-amber-50">
                                                    <span className="text-2xl block mb-1">🤵</span>
                                                    <span className="font-semibold">Groom's Side</span>
                                                </div>
                                            </label>
                                        </div>

                                        <input
                                            type="number"
                                            placeholder="Number of Guests *"
                                            min="1"
                                            max="10"
                                            value={rsvpData.numberOfAttendees}
                                            onChange={(e) =>
                                                setRsvpData({
                                                    ...rsvpData,
                                                    numberOfAttendees: parseInt(e.target.value),
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                            required
                                        />

                                        <input
                                            type="text"
                                            placeholder="Song Request 🎵"
                                            value={rsvpData.songRequest}
                                            onChange={(e) =>
                                                setRsvpData({ ...rsvpData, songRequest: e.target.value })
                                            }
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                        />
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={rsvpSubmitting}
                                    className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all ${rsvpSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:shadow-lg'
                                        }`}
                                >
                                    {rsvpSubmitting ? 'Submitting...' : isAttending && seatingEnabled ? 'Continue →' : 'Submit RSVP 💌'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </section>

            {/* Section: Wishes */}
            <section
                id="wishes"
                className="min-h-screen flex items-center justify-center px-4 py-20"
                style={{ order: sectionOrder.indexOf('wishes'), ...sectionBgStyle(customConfig?.['section.celebration.bg'], API_BASE) }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-6xl"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
                            Wishes & Blessings
                        </h2>
                        <p className="text-gray-600 text-lg">
                            {t('wish.prompt', "Share your heartfelt wishes for the happy couple ✨")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Wish Form */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-yellow-200">
                            <h3 className="text-2xl font-semibold mb-6">Share Your Wish</h3>

                            {wishSuccess && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 text-center">
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
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                    required
                                />

                                <textarea
                                    placeholder="Your wishes for the couple... *"
                                    value={wishData.message}
                                    onChange={(e) =>
                                        setWishData({ ...wishData, message: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none resize-none"
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={wishSubmitting}
                                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${wishSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:shadow-lg'
                                        }`}
                                >
                                    {wishSubmitting ? 'Submitting...' : 'Submit Wish ✨'}
                                </button>
                            </form>
                        </div>

                        {/* Wishes Display */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-yellow-200 max-h-[600px] overflow-y-auto">
                            <h3 className="text-2xl font-semibold mb-6">
                                All Wishes ({wishes.length})
                            </h3>

                            {wishes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No wishes yet. Be the first! 💕
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wishes.slice().map((wish, index) => (
                                        <div
                                            key={wish.wishId}
                                            className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-l-4 border-amber-400"
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
            </section>

            {/* Section: Photos (if enabled) */}
            {photoBoothEnabled && sectionOrder.includes('photobooth') && (
                <section
                    id="photobooth"
                    className="min-h-screen flex items-center justify-center px-4 py-20"
                    style={{ order: sectionOrder.indexOf('photobooth') }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl"
                    >
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
                                Photo Booth
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Share your favorite moments! 📸
                            </p>
                        </div>

                        {/* Photo Upload Form */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-yellow-200 mb-8">
                            <h3 className="text-2xl font-semibold mb-6">Upload a Photo</h3>

                            {photoSuccess && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 text-center">
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
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                />

                                {previewUrl && (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-64 object-cover rounded-xl"
                                    />
                                )}

                                <input
                                    type="text"
                                    placeholder="Your Name *"
                                    value={photoData.guestName}
                                    onChange={(e) =>
                                        setPhotoData({ ...photoData, guestName: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Caption (optional)"
                                    value={photoData.caption}
                                    onChange={(e) =>
                                        setPhotoData({ ...photoData, caption: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none"
                                />

                                <button
                                    type="submit"
                                    disabled={photoSubmitting || !selectedFile}
                                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${photoSubmitting || !selectedFile
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:shadow-lg'
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
                            </h3>Continue7:28 AM
                            {photos.length === 0 ? (
                                <div className="text-center py-12 bg-white/80 rounded-3xl shadow-md">
                                    <p className="text-gray-500">No photos yet. Be the first to share!</p>
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
                                                className="w-full h-48 object-cover" />
                                            <div className="p-3">
                                                <p className="font-semibold text-sm">{photo.guestName}</p>
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
                </section>
            )}
        </div>
        <footer className="text-center py-6 text-amber-500 text-xs">
            {t('footer.tagline', 'Made with love for our special day')}
        </footer>
        </>
    );
}