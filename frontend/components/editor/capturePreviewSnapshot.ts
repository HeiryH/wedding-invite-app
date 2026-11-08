import type { CapturePreviewSnapshot } from '@/lib/api/templateStudio.service';

// Copy the same payload already sent to the Studio iframe, not another sample invitation.
export function capturePreviewSnapshot(payload: unknown, viewport: Omit<CapturePreviewSnapshot, 'payload'>): CapturePreviewSnapshot {
  if (!payload || typeof payload !== 'object' || !('wedding' in payload)) throw new Error('Wait for the preview to load before capturing.');
  const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  const editor = copy.editor as Record<string, unknown> | undefined;
  if (editor) {
    delete editor.selectedLayer;
    delete editor.selectedStage;
    editor.revealOverflow = false;
    if (editor.cinematic) {
      // Keep the camera pose shown in the preview, without reference artwork or selection UI.
      const cinematic = editor.cinematic as Record<string, unknown>;
      delete cinematic.referenceSrc;
      delete cinematic.referenceOpacity;
      delete cinematic.referenceFit;
    } else editor.enabled = false;
  }
  return { payload: copy, ...viewport };
}
