'use client';
import { useState, type ReactNode } from 'react';
import type { Wish } from '@/lib/api';

export function useWishPagination() {
  const [limit, setLimit] = useState(10);
  return { limit, loadMore: () => setLimit((current) => current + 10) };
}
/** DOM pagination only: retain the caller's cards and ordering without mounting every wish. */
export default function WishBatch({ wishes, children }: { wishes: Wish[]; children: (visible: Wish[]) => ReactNode }) {
  const { limit, loadMore } = useWishPagination();
  return <>{children(wishes.slice(0, limit))}{wishes.length > limit && <button type="button" onClick={loadMore} style={{ gridColumn: '1 / -1', justifySelf: 'center', color: 'inherit', padding: 8 }}>Load more ({wishes.length - limit} remaining)</button>}</>;
}
