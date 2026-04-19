'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    
    if (user) {
      // Already logged in, redirect to dashboard
      if (user.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else if (user.role === 'COUPLE_ADMIN' || 'SUPER_ADMIN') {
        router.push(`/admin/wedding/${user.weddingId}`);
      }
    } else {
      // Not logged in, go to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}