'use client';

import { useEffect, useMemo, useState } from 'react';
import { weddingService, templateService, Wedding, Template } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Breakpoint = 'mobile' | 'desktop';
type Status = 'idle' | 'loading' | 'done' | 'error';
type ThumbStatus = 'idle' | 'saving' | 'done' | 'error';

export default function ScreenshotToolPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [weddingId, setWeddingId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [lastFilename, setLastFilename] = useState('');
  // Which wedding/template the current capture actually shows — guards the "use as thumbnail"
  // button against applying a stale capture after the dropdowns have since changed.
  const [capturedFor, setCapturedFor] = useState<{ weddingId: string; templateId: string } | null>(null);

  const [thumbStatus, setThumbStatus] = useState<ThumbStatus>('idle');
  const [thumbError, setThumbError] = useState('');

  useEffect(() => {
    Promise.all([weddingService.getAll(), templateService.getActive()])
      .then(([w, t]) => {
        setWeddings(w);
        setTemplates(t);
        if (w.length > 0) setWeddingId(String(w[0].weddingId));
        if (t.length > 0) setTemplateId(String(t[0].templateId));
      })
      .finally(() => setLoading(false));
  }, []);

  // Revoke the previous preview object URL whenever a new one is created / page unmounts.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const wedding = useMemo(() => weddings.find((w) => String(w.weddingId) === weddingId), [weddings, weddingId]);
  const template = useMemo(() => templates.find((t) => String(t.templateId) === templateId), [templates, templateId]);

  const weddingOptions = weddings.map((w) => ({
    value: String(w.weddingId),
    label: `${w.brideName} & ${w.groomName} — ${w.coupleName}${w.isPublic ? '' : ' (private)'}`,
  }));
  const templateOptions = templates.map((t) => ({ value: String(t.templateId), label: `${t.templateName} (${t.tier})` }));

  const capture = async () => {
    if (!wedding || !template) return;
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(
        `/api/super-admin/screenshot?coupleName=${encodeURIComponent(wedding.coupleName)}&templateId=${template.templateId}&breakpoint=${breakpoint}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Capture failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      setPreviewBlob(blob);
      setLastFilename(`${wedding.coupleName}-t${template.templateId}-${breakpoint}.png`);
      setCapturedFor({ weddingId, templateId });
      setThumbStatus('idle');
      setThumbError('');
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed');
      setStatus('error');
    }
  };

  const openLivePreview = () => {
    if (!wedding || !template) return;
    window.open(`/wedding/${wedding.coupleName}?preview=${template.templateId}`, '_blank');
  };

  // The capture is a real client's actual invite content (names, date, any custom text they've
  // written) — making it the public picker thumbnail means every visitor sees it, including for
  // weddings that are still private. Confirm explicitly rather than let a click be undo-only.
  const useAsThumbnail = async () => {
    if (!previewBlob || !wedding || !template) return;
    const visibility = wedding.isPublic ? '' : ' (this wedding is currently private)';
    const ok = window.confirm(
      `This will make ${wedding.brideName} & ${wedding.groomName}'s captured invite the public template-picker thumbnail for "${template.templateName}" — visible to every visitor${visibility}.\n\nContinue?`
    );
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

  const previewMatchesSelection = capturedFor?.weddingId === weddingId && capturedFor?.templateId === templateId;

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 40px)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-strong)', margin: 0 }}>Screenshot tool</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
          Capture a real client&apos;s invite in any template — their actual data, any design, without changing what&apos;s saved.
        </p>
      </div>

      {weddings.length === 0 ? (
        <EmptyState title="No weddings yet" description="Create a wedding first to capture a screenshot of it." />
      ) : (
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <Select label="Client / wedding" value={weddingId} onChange={(e) => setWeddingId(e.target.value)} options={weddingOptions} />
            <Select label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} options={templateOptions} />
            <Select
              label="Breakpoint"
              value={breakpoint}
              onChange={(e) => setBreakpoint(e.target.value as Breakpoint)}
              options={[{ value: 'mobile', label: 'Mobile (390×700)' }, { value: 'desktop', label: 'Desktop (1280×800)' }]}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button onClick={capture} loading={status === 'loading'} disabled={!wedding || !template}>
              {status === 'loading' ? 'Capturing…' : 'Capture screenshot'}
            </Button>
            <Button variant="secondary" onClick={openLivePreview} disabled={!wedding || !template}>
              Open live preview
            </Button>
          </div>

          {status === 'loading' && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Rendering {wedding?.brideName} &amp; {wedding?.groomName}&apos;s invite in {template?.templateName}… this launches a real browser server-side and can take a few seconds.
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
            style={{ maxWidth: '100%', width: breakpoint === 'mobile' ? 320 : '100%', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
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
              Selection changed since this capture — re-capture to use it as a thumbnail.
            </p>
          )}
          {thumbStatus === 'done' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--em)' }}>
              Set as the picker thumbnail for {template?.templateName}. Existing gallery pages will show it immediately.
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
