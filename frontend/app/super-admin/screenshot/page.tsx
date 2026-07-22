'use client';

import { useEffect, useMemo, useState } from 'react';
import { templateService, Template } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Status = 'idle' | 'loading' | 'done' | 'error';
type ThumbStatus = 'idle' | 'saving' | 'done' | 'error';

// Render /template-preview/<code>?capture=1 in a hidden iframe; that page rasterizes its own
// dummy-data render to a PNG (client-side, html-to-image) and posts the dataURL back. No server
// browser involved.
function captureTemplate(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // The iframe must sit INSIDE the viewport, not off-screen: some templates (e.g. T7's stage
    // engine) reveal their layers via IntersectionObserver, which reports "not intersecting" for
    // an off-screen iframe and leaves those layers invisible. So render it at 0,0 and hide it
    // behind an opaque overlay instead — geometrically in-viewport, so IO fires like a real visit.
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:var(--surface-app,#fff);';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:390px;height:700px;border:0;z-index:2147483646;';
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      iframe.remove();
      overlay.remove();
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.code !== code) return;
      if (e.data?.type === 'THUMB_CAPTURE') { settled = true; cleanup(); resolve(e.data.dataUrl as string); }
      else if (e.data?.type === 'THUMB_CAPTURE_ERROR') { settled = true; cleanup(); reject(new Error(e.data.message || 'Capture failed')); }
    };
    const timer = setTimeout(() => { if (!settled) { cleanup(); reject(new Error('Capture timed out')); } }, 30000);

    window.addEventListener('message', onMsg);
    iframe.src = `/template-preview/${encodeURIComponent(code)}?capture=1`;
    document.body.appendChild(iframe);
    document.body.appendChild(overlay);
  });
}

export default function ScreenshotToolPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string>('');

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [lastFilename, setLastFilename] = useState('');
  // Which template the current capture is of — guards "use as thumbnail" against a stale capture.
  const [capturedFor, setCapturedFor] = useState<string | null>(null);

  const [thumbStatus, setThumbStatus] = useState<ThumbStatus>('idle');
  const [thumbError, setThumbError] = useState('');

  useEffect(() => {
    templateService.getActive()
      .then((t) => { setTemplates(t); if (t.length > 0) setTemplateId(String(t[0].templateId)); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const template = useMemo(() => templates.find((t) => String(t.templateId) === templateId), [templates, templateId]);
  const templateOptions = templates.map((t) => ({ value: String(t.templateId), label: `${t.templateName} (${t.tier})` }));
  const previewMatchesSelection = capturedFor === templateId;

  const capture = async () => {
    if (!template) return;
    setStatus('loading');
    setError('');
    try {
      const dataUrl = await captureTemplate(template.templateCode);
      const blob = await (await fetch(dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      setPreviewBlob(blob);
      setLastFilename(`${template.templateCode}-thumbnail.png`);
      setCapturedFor(templateId);
      setThumbStatus('idle');
      setThumbError('');
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed');
      setStatus('error');
    }
  };

  const useAsThumbnail = async () => {
    if (!previewBlob || !template) return;
    const ok = window.confirm(`Set this capture as the public picker thumbnail for "${template.templateName}"? It replaces the current thumbnail everywhere the template is shown.`);
    if (!ok) return;
    setThumbStatus('saving');
    setThumbError('');
    try {
      const updated = await templateService.uploadThumbnail(template.templateId, previewBlob, lastFilename);
      setTemplates((prev) => prev.map((t) => (t.templateId === updated.templateId ? updated : t)));
      setThumbStatus('done');
    } catch (e) {
      setThumbError(e instanceof Error ? e.message : 'Failed to set thumbnail');
      setThumbStatus('error');
    }
  };

  const openLivePreview = () => {
    if (!template) return;
    window.open(`/template-preview/${template.templateCode}`, '_blank');
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 40px)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-strong)', margin: 0 }}>Screenshot tool</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
          Generate a fresh thumbnail for any template from a sample render — captured in your browser, no server needed.
        </p>
      </div>

      {templates.length === 0 ? (
        <EmptyState title="No templates" description="No active templates to capture." />
      ) : (
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <Select label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} options={templateOptions} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button onClick={capture} loading={status === 'loading'} disabled={!template}>
              {status === 'loading' ? 'Capturing…' : 'Capture screenshot'}
            </Button>
            <Button variant="secondary" onClick={openLivePreview} disabled={!template}>
              Open live preview
            </Button>
          </div>

          {status === 'loading' && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Rendering {template?.templateName} and rasterizing it in your browser… this takes a few seconds.
            </p>
          )}
          {status === 'error' && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', fontSize: 14, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </Card>
      )}

      {previewUrl && (
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{lastFilename}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={lastFilename}
            style={{ width: 320, maxWidth: '100%', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={previewUrl} download={lastFilename}>
              <Button variant="secondary">Download PNG</Button>
            </a>
            {previewMatchesSelection && (
              <Button onClick={useAsThumbnail} loading={thumbStatus === 'saving'} disabled={thumbStatus === 'saving'}>
                {thumbStatus === 'done' ? '✓ Set as template thumbnail' : 'Use as template thumbnail'}
              </Button>
            )}
          </div>
          {!previewMatchesSelection && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-subtle)' }}>
              Template selection changed since this capture — re-capture to use it as a thumbnail.
            </p>
          )}
          {thumbStatus === 'done' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--em)' }}>
              Set as the picker thumbnail for {template?.templateName}. Gallery pages show it immediately.
            </p>
          )}
          {thumbStatus === 'error' && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', fontSize: 14, color: 'var(--danger)' }}>
              {thumbError}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
