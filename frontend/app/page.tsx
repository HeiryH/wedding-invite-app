'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      if (user.role === 'SUPER_ADMIN')  { router.replace('/super-admin'); return; }
      if (user.role === 'HOST_ADMIN')   { router.replace('/host-admin'); return; }
      if (user.role === 'COUPLE_ADMIN') { router.replace('/couple-admin'); return; }
    }
    router.replace('/home');
  }, [router]);

  return null;
}
