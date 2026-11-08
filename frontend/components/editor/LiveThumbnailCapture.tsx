'use client';

import { useEffect, useRef, useState } from 'react';
import { templateService } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { captureLivePreview, type LivePreviewImage } from './captureLivePreview';
import styles from './CaptureThumbnailDialog.module.css';

function errorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Tab sharing was cancelled or blocked. Choose the Studio tab to capture its preview.';
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? (error instanceof Error ? error.message : 'Could not capture the preview. Please retry.');
}

export function LiveThumbnailCapture({ templateId, getPreviewElement, disabled, onApplied, onBusyChange }: {
  templateId: number; getPreviewElement: () => HTMLElement | null; disabled?: boolean;
  onApplied: () => void; onBusyChange?: (busy: boolean) => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<(LivePreviewImage & { url: string }) | null>(null);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const url = useRef<string | null>(null);
  const busy = capturing || saving || image !== null;

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => {
    request.current?.abort();
    if (url.current) URL.revokeObjectURL(url.current);
    onBusyChange?.(false);
  }, [onBusyChange]);
  useEffect(() => {
    if (image && !capturing) { if (!dialog.current?.open) dialog.current?.showModal(); }
    else if (dialog.current?.open) dialog.current.close();
  }, [image, capturing]);

  const capture = async () => {
    if (capturing || saving) return;
    setError('');
    dialog.current?.close();
    const controller = new AbortController();
    request.current = controller;
    setCapturing(true);
    try {
      const target = getPreviewElement();
      if (!target) throw new Error('Wait for the template preview to load before capturing.');
      // Invoked in the click stack, before any await or modal: the sharing prompt needs this gesture.
      const result = await captureLivePreview(target, controller.signal);
      if (controller.signal.aborted) return;
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = URL.createObjectURL(result.blob);
      setImage({ ...result, url: url.current });
    } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e)); }
    finally { if (!controller.signal.aborted) setCapturing(false); }
  };
  const close = () => {
    if (saving) return;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null; setImage(null); setError('');
  };
  const apply = async () => {
    if (!image || saving) return;
    setSaving(true); setError('');
    try {
      await templateService.uploadThumbnail(templateId, image.blob, 'studio-preview.png');
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = null; setImage(null); onApplied();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };

  return <>
    <Button variant="secondary" tone="neutral" size="sm" disabled={disabled || capturing || saving} onClick={capture}>
      {capturing ? 'Capturing preview…' : 'Capture thumbnail'}
    </Button>
    {capturing && <span role="status" style={{ fontSize: 12 }}>Choose this Studio tab in the browser sharing dialog.</span>}
    {error && !image && <span role="alert" className={styles.error}>{error}</span>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="live-thumbnail-title" onCancel={event => { event.preventDefault(); close(); }}>
      <h2 id="live-thumbnail-title">Review thumbnail</h2>
      <p className={styles.description}>Only the visible template preview is captured, including its current animation frame. Sharing has stopped. Nothing is uploaded until you choose Use as thumbnail.</p>
      {image && <>
        <div className={styles.preview}>
          {/* Local captured pixels, never fetched by an image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="Live template preview capture" />
        </div>
        <p className={styles.description}>{image.width} × {image.height} pixels. Resolution follows the preview’s displayed size and screen density.</p>
      </>}
      {error && image && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.footer}>
        <Button variant="secondary" tone="neutral" disabled={saving} onClick={close}>Cancel</Button>
        <Button variant="secondary" tone="neutral" disabled={saving || capturing} onClick={capture}>Retake</Button>
        <Button variant="primary" tone="brand" disabled={!image || saving} loading={saving} onClick={apply}>Use as thumbnail</Button>
      </div>
    </dialog>
  </>;
}
