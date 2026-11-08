'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { templateStudioService, type CapturePreviewSnapshot } from '@/lib/api/templateStudio.service';
import { Button } from '@/components/ui/Button';
import styles from './CaptureThumbnailDialog.module.css';

function message(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? (error instanceof Error ? error.message : 'Could not capture the preview. Please retry.');
}

export function CaptureThumbnailDialog({ open, templateId, onClose, onApplied, getSnapshot }: {
  open: boolean; templateId: number; onClose: () => void; onApplied: () => void; getSnapshot?: () => CapturePreviewSnapshot;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const jobId = useRef<string | null>(null);
  const imageUrl = useRef<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('pending');
  const [applying, setApplying] = useState(false);
  const [revision, setRevision] = useState<number | null>(null);

  const discard = useCallback(() => {
    request.current?.abort();
    const pendingCancel = jobId.current ? templateStudioService.cancelCapture(templateId, jobId.current).catch(() => {}) : Promise.resolve();
    jobId.current = null;
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = null;
    return pendingCancel;
  }, [templateId]);

  const capture = useCallback(async () => {
    const cancelling = discard();
    const controller = new AbortController();
    request.current = controller;
    setImage(null); setError(''); setPhase('pending'); setRevision(null);
    try {
      await cancelling;
      if (controller.signal.aborted) return;
      let job = await templateStudioService.startCapture(templateId, controller.signal, getSnapshot?.());
      if (controller.signal.aborted) {
        void templateStudioService.cancelCapture(templateId, job.id).catch(() => {});
        return;
      }
      jobId.current = job.id;
      setRevision(job.publishedRevision ?? null);
      while (job.status === 'pending' || job.status === 'processing') {
        setPhase(job.status);
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
          const timer = setTimeout(() => { controller.signal.removeEventListener('abort', onAbort); resolve(); }, 1000);
          controller.signal.addEventListener('abort', onAbort, { once: true });
        });
        job = await templateStudioService.getCapture(templateId, job.id, controller.signal);
        if (controller.signal.aborted) return;
      }
      if (job.status !== 'ready') throw { response: { data: { message: job.error ?? 'This capture is unavailable. Please retake it.' } } };
      const blob = await templateStudioService.captureImage(templateId, job.id, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      imageUrl.current = url;
      setImage(url); setPhase('ready');
    } catch (e) {
      if (!controller.signal.aborted) { setError(message(e)); setPhase('failed'); }
    }
  }, [discard, templateId, getSnapshot]);

  useEffect(() => {
    if (!open) { if (dialog.current?.open) dialog.current.close(); return; }
    dialog.current?.showModal();
    // Start after opening the native modal; its focus containment and inert background are native.
    const timer = setTimeout(() => { void capture(); }, 0);
    return () => { clearTimeout(timer); discard(); };
  }, [open, capture, discard]);

  const close = () => {
    if (applying) return;
    discard(); onClose();
  };
  const apply = async () => {
    if (!jobId.current || !image || applying) return;
    setApplying(true); setError('');
    try {
      await templateStudioService.applyCapture(templateId, jobId.current);
      jobId.current = null;
      onApplied();
    } catch (e) { setError(message(e)); }
    finally { setApplying(false); }
  };

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="capture-thumbnail-title"
    onCancel={e => { e.preventDefault(); close(); }}>
    <h2 id="capture-thumbnail-title">{image ? 'Review thumbnail' : 'Capture thumbnail'}</h2>
    <p className={styles.description}>{getSnapshot ? 'Current Studio preview, including the displayed names, design and scroll position. Editor controls are excluded. Saving this image does not publish your draft.' : `${revision ? `Published revision ${revision}` : 'Published design'} · 390 × 700.`} Your current thumbnail stays in place until you save this image.</p>
    {image ? <div className={styles.preview}>
      {/* A temporary, authenticated Blob URL; Next image optimization cannot fetch it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={getSnapshot ? 'Captured Studio preview' : 'Captured published invitation preview'} />
    </div> : phase !== 'failed' && <div className={styles.progress} role="status">{phase === 'processing' ? 'Rendering your preview…' : 'Preparing your capture…'}</div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.footer}>
      <Button variant="secondary" tone="neutral" onClick={close} disabled={applying}>Cancel</Button>
      {(image || phase === 'failed') && <Button variant="secondary" tone="neutral" onClick={() => void capture()} disabled={applying}>Retake</Button>}
      {image && <Button variant="primary" tone="brand" onClick={apply} loading={applying} disabled={applying}>Use as thumbnail</Button>}
    </div>
  </dialog>;
}
