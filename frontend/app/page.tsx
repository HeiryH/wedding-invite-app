'use client';

import { useEffect, useState } from 'react';
import { weddingService, Wedding } from '@/lib/api';

export default function Home() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeddings = async () => {
      try {
        setLoading(true);
        const data = await weddingService.getAll();
        setWeddings(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch weddings');
      } finally {
        setLoading(false);
      }
    };

    fetchWeddings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500">Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure your .NET API is running on http://localhost:5000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Wedding Invites</h1>
      
      {weddings.length === 0 ? (
        <p className="text-gray-500">No weddings yet. Create one via Swagger!</p>
      ) : (
        <div className="grid gap-4">
          {weddings.map((wedding) => (
            <div key={wedding.weddingId} className="border p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-2">
                {wedding.brideName} & {wedding.groomName}
              </h2>
              <p className="text-gray-600">
                📍 {wedding.venue} • 📅 {new Date(wedding.weddingDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                👥 {wedding.totalAttending} attending • ⏰ {wedding.daysUntilWedding} days to go
              </p>
              
               <a href={`/wedding/${wedding.coupleName}`}
                className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Invitation
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}