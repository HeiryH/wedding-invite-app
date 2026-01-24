'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, guestService, wishService, Wedding, Guest, Wish } from '@/lib/api';

export default function AdminDashboard() {
    const params = useParams();
    const coupleName = params.coupleName as string;

    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'wishes'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSide, setFilterSide] = useState<'All' | 'Bride' | 'Groom'>('All');
    const [filterAttending, setFilterAttending] = useState<'All' | 'Yes' | 'No'>('All');
    const [isEditingWedding, setIsEditingWedding] = useState(false);
    const [editWeddingData, setEditWeddingData] = useState({
        brideName: '',
        groomName: '',
        weddingDate: '',
        venue: '',
        venueAddress: '',
    });

    // Load wedding data, guests, and wishes from API on component mount or when couple name changes
    useEffect(() => {
        // Fetch all wedding information: ceremony details, guest list, and well wishes
        // Old way: Total time = A + B + C
        // New way: Total time = Max(A, B, C)
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Get the wedding first (since we need the ID for others)
                const weddingData = await weddingService.getByCoupleName(coupleName);
                setWedding(weddingData);

                // 2. Fire the next two AT THE SAME TIME
                const [guestsData, wishesData] = await Promise.all([
                    guestService.getByWeddingId(weddingData.weddingId),
                    wishService.getByWeddingId(weddingData.weddingId)
                ]);

                setGuests(guestsData);
                setWishes(wishesData);
            } catch (err) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [coupleName]);

    useEffect(() => {
        if (wedding) {
            setEditWeddingData({
                brideName: wedding.brideName,
                groomName: wedding.groomName,
                weddingDate: new Date(wedding.weddingDate).toISOString().split('T')[0],
                venue: wedding.venue,
                venueAddress: wedding.venueAddress,
            });
        }
    }, [wedding]);

    // Filter guests by search name, side (bride/groom), and attendance status
    // Returns refined guest list based on active filter selections
    const filteredGuests = guests.filter((guest) => {
        const matchesSearch = guest.guestName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSide = filterSide === 'All' || guest.brideOrGroomSide === filterSide;
        const matchesAttending =
            filterAttending === 'All' ||
            (filterAttending === 'Yes' && guest.isAttending) ||
            (filterAttending === 'No' && !guest.isAttending);

        return matchesSearch && matchesSide && matchesAttending;
    });

    // Compute dashboard statistics: total guests, attendance count, side breakdown, wishes count
    // Powers the metric cards and charts displayed throughout the dashboard
    const stats = {
        totalGuests: guests.length,
        totalAttending: guests.filter((g) => g.isAttending).reduce((sum, g) => sum + g.numberOfAttendees, 0),
        totalNotAttending: guests.filter((g) => !g.isAttending).length,
        brideSide: guests.filter((g) => g.brideOrGroomSide === 'Bride').length,
        groomSide: guests.filter((g) => g.brideOrGroomSide === 'Groom').length,
        totalWishes: wishes.length,
    };

    const handleUpdateWedding = async () => {
    if (!wedding) return;
    try {
      setLoading(true);
      const updated = await weddingService.update(wedding.weddingId, editWeddingData);
      setWedding(updated);
      setIsEditingWedding(false);
    
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update wedding');
    } finally {
      setLoading(false);
    }
  };

    // Delete a guest and update the UI list
    const handleDeleteGuest = async (guestId: number) => {
        if (!window.confirm('Are you sure you want to remove this guest?')) return;

        try {
            await guestService.delete(guestId); // Calls the backend Delete endpoint
            setGuests((prev) => prev.filter((g) => g.guestId !== guestId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete guest');
        }
    };

    // Delete a wish and update the UI list
    const handleDeleteWish = async (wishId: number) => {
        if (!window.confirm('Are you sure you want to remove this wish?')) return;

        try {
            await wishService.delete(wishId); // Calls the backend Delete endpoint
            setWishes((prev) => prev.filter((w) => w.wishId !== wishId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete wish');
        }
    };

    // Build and download a CSV file containing all guest information for external use
    // Useful for sharing guest lists or importing into other systems
    const exportToCSV = () => {
        // Prepare column headers and guest data rows for CSV format
        const headers = ['Name', 'Email', 'Phone', 'Side', 'Attending', 'Number of Guests', 'Song Request', 'RSVP Date'];
        const rows = guests.map((guest) => [
            guest.guestName,
            guest.email,
            guest.phoneNumber,
            guest.brideOrGroomSide,
            guest.isAttending ? 'Yes' : 'No',
            guest.numberOfAttendees,
            guest.songRequest,
            guest.respondedDate ? new Date(guest.respondedDate).toLocaleDateString() : '',
        ]);

        // Format data as CSV text and trigger browser download
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${coupleName}-guest-list.csv`;
        a.click();
    };

    // Show loading spinner while fetching data from API
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error message if data fetch failed or wedding doesn't exist
    if (error || !wedding) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-2xl text-red-500 mb-4">😢 {error || 'Wedding not found'}</p>
                    <a href="/" className="text-rose-600 hover:underline">
                        ← Back to home
                    </a>
                </div>
            </div>
        );
    }

    // Main dashboard layout with header, navigation tabs, and content sections
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header displaying couple's names, wedding date, and link to guest invitation */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        {isEditingWedding ? (
                            <div className="space-y-3 w-full max-w-md">
                                <div className="flex gap-2">
                                    <input
                                        className="text-2xl font-bold border rounded px-2 py-1 w-full"
                                        value={editWeddingData.brideName}
                                        onChange={(e) => setEditWeddingData({ ...editWeddingData, brideName: e.target.value })}
                                        placeholder="Bride's Name"
                                    />
                                    <span className="text-2xl font-bold self-center">&</span>
                                    <input
                                        className="text-2xl font-bold border rounded px-2 py-1 w-full"
                                        value={editWeddingData.groomName}
                                        onChange={(e) => setEditWeddingData({ ...editWeddingData, groomName: e.target.value })}
                                        placeholder="Groom's Name"
                                    />
                                </div>
                                <input
                                    type="date"
                                    className="block border rounded px-2 py-1"
                                    value={editWeddingData.weddingDate}
                                    onChange={(e) => setEditWeddingData({ ...editWeddingData, weddingDate: e.target.value })}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleUpdateWedding} className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">
                                        Save
                                    </button>
                                    <button onClick={() => setIsEditingWedding(false)} className="bg-gray-200 px-4 py-1 rounded hover:bg-gray-300">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-800">
                                        {wedding.brideName} & {wedding.groomName}
                                    </h1>
                                    <button
                                        onClick={() => setIsEditingWedding(true)}
                                        className="text-gray-400 hover:text-rose-500 transition-colors"
                                    >
                                        ✏️
                                    </button>
                                </div>
                                <p className="text-gray-600 mt-1">
                                    {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}

                        <a href={`/wedding/${coupleName}`} target="_blank" rel="noopener noreferrer" className="...">
                            View Invitation →
                        </a>
                    </div>

                    {/* Navigation tabs to switch between Overview, Guests, and Wishes sections */}
                    <div className="flex gap-4 mt-6 border-b border-gray-200">
                        {['overview', 'guests', 'wishes'].map((tab) => (

                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 font-medium transition-colors relative ${activeTab === tab
                                    ? 'text-rose-600 border-b-2 border-rose-600'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content area that renders different sections based on selected tab */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Overview Tab: Display dashboard statistics, guest distribution, attendance breakdown */}
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total RSVPs"
                                value={stats.totalGuests}
                                icon="📋"
                                color="blue"
                            />
                            <StatCard
                                title="Total Attending"
                                value={stats.totalAttending}
                                subtitle="guests"
                                icon="✅"
                                color="green"
                            />
                            <StatCard
                                title="Not Attending"
                                value={stats.totalNotAttending}
                                icon="❌"
                                color="red"
                            />
                            <StatCard
                                title="Wishes Received"
                                value={stats.totalWishes}
                                icon="💬"
                                color="purple"
                            />
                        </div>

                        {/* Side Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Guest Distribution
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">👰 Bride's Side</span>
                                            <span className="font-semibold">{stats.brideSide} guests</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-pink-500"
                                                style={{
                                                    width: `${(stats.brideSide / stats.totalGuests) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">🤵 Groom's Side</span>
                                            <span className="font-semibold">{stats.groomSide} guests</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{
                                                    width: `${(stats.groomSide / stats.totalGuests) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Attendance Status
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">✅ Attending</span>
                                            <span className="font-semibold">{stats.totalAttending} people</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{
                                                    width: `${(stats.totalAttending / (stats.totalAttending + stats.totalNotAttending)) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">❌ Not Attending</span>
                                            <span className="font-semibold">{stats.totalNotAttending} guests</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500"
                                                style={{
                                                    width: `${(stats.totalNotAttending / stats.totalGuests) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent RSVPs */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Recent RSVPs
                            </h3>
                            <div className="space-y-3">
                                {guests
                                    .sort((a, b) =>
                                        new Date(b.respondedDate || 0).getTime() - new Date(a.respondedDate || 0).getTime()
                                    )
                                    .slice(0, 5)
                                    .map((guest) => (
                                        <div
                                            key={guest.guestId}
                                            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-800">{guest.guestName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {guest.brideOrGroomSide} side • {guest.numberOfAttendees} guest(s)
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${guest.isAttending
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {guest.isAttending ? 'Attending' : 'Not Attending'}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {guest.respondedDate
                                                        ? new Date(guest.respondedDate).toLocaleDateString()
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Guests Tab: Show filterable guest table with search, side, and attendance filters */}
                {activeTab === 'guests' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Filter controls: search by name, filter by side and attendance status */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-rose-400"
                                />

                                {/* Side Filter */}
                                <select
                                    value={filterSide}
                                    onChange={(e) => setFilterSide(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-rose-400"
                                >
                                    <option value="All">All Sides</option>
                                    <option value="Bride">Bride's Side</option>
                                    <option value="Groom">Groom's Side</option>
                                </select>

                                {/* Attending Filter */}
                                <select
                                    value={filterAttending}
                                    onChange={(e) => setFilterAttending(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-rose-400"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Yes">Attending</option>
                                    <option value="No">Not Attending</option>
                                </select>

                                {/* Export Button */}
                                <button
                                    onClick={exportToCSV}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                                >
                                    📥 Export CSV
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mt-4">
                                Showing {filteredGuests.length} of {guests.length} guests
                            </p>
                        </div>

                        {/* Sortable guest table with name, contact, side, attendance, headcount, and song request columns */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Side
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Attending
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Guests
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Song Request
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredGuests.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No guests found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredGuests.map((guest) => (
                                                <tr key={guest.guestId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{guest.guestName}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {guest.respondedDate
                                                                ? new Date(guest.respondedDate).toLocaleDateString()
                                                                : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{guest.email}</div>
                                                        <div className="text-sm text-gray-500">{guest.phoneNumber}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${guest.brideOrGroomSide === 'Bride'
                                                                ? 'bg-pink-100 text-pink-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                                }`}
                                                        >
                                                            {guest.brideOrGroomSide === 'Bride' ? '👰 Bride' : '🤵 Groom'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${guest.isAttending
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}
                                                        >
                                                            {guest.isAttending ? '✅ Yes' : '❌ No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {guest.numberOfAttendees}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                        {guest.songRequest || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteGuest(guest.guestId)}
                                                            className="text-red-600 hover:text-red-900 transition-colors">
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Wishes Tab: Display all well wishes from guests in a grid layout */}
                {activeTab === 'wishes' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                All Wishes ({wishes.length})
                            </h3>

                            {wishes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No wishes yet
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {wishes
                                        .sort((a, b) =>
                                            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                                        )
                                        .map((wish) => (
                                            <div
                                                key={wish.wishId}
                                                className="relative group bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border-l-4 border-pink-400"
                                            >
                                                <button
                                                    onClick={() => handleDeleteWish(wish.wishId)}
                                                    className="absolute top-1 left-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete wish">
                                                    🆇
                                                </button>
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold text-gray-800">{wish.guestName}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(wish.createdDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-gray-600 text-sm italic">"{wish.message}"</p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Reusable statistics card component displaying key metrics with color-coded gradients
// Used in the dashboard overview to show total RSVPs, attendance, not attending, and wishes count
function StatCard({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: number;
    subtitle?: string;
    icon: string;
    color: 'blue' | 'green' | 'red' | 'purple';
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
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
                    <p className="text-3xl font-bold">
                        {value} {subtitle && <span className="text-lg font-normal">{subtitle}</span>}
                    </p>
                </div>
                <div className="text-4xl opacity-80">{icon}</div>
            </div>
        </motion.div>
    );
}