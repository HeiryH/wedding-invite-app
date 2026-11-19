'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplatePicker } from '@/components/marketing/TemplatePicker';

function PickerInner() {
  const searchParams = useSearchParams();

  return <TemplatePicker initialTier={searchParams.get('tier')} initialView={searchParams.get('view')} />;
}

export default function PickerPage() {
  return (
    <Suspense>
      <PickerInner />
    </Suspense>
  );
}
