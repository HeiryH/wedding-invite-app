'use client';

import { useParams } from 'next/navigation';
import CustomizationWorkspace from '@/components/editor/CustomizationWorkspace';

export default function TemplateStudioPage() {
  const params = useParams<{ templateId: string }>();
  const id = Number(params.templateId);
  if (!Number.isInteger(id) || id < 1) return <p role="alert">Invalid template.</p>;
  return <CustomizationWorkspace key={id} masterTemplateId={id} />;
}
