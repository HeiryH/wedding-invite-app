import { describe, expect, it } from 'vitest';
import { capturePreviewSnapshot } from './capturePreviewSnapshot';

describe('Studio preview capture snapshot', () => {
  it('keeps the displayed names, draft config, media, frame and scroll without mutating the editor', () => {
    const source = { wedding: { templateId: 7, brideName: 'Mary', groomName: 'John' },
      customConfig: { 'invite.heading': 'My unsaved heading' }, coupleMedia: [{ photoUrl: '/uploads/custom.png' }],
      editor: { enabled: true, selectedLayer: 'names', selectedStage: 'welcome', frame: { w: 510, svh: 915 } } };
    const snapshot = capturePreviewSnapshot(source, { width: 510, height: 915, scrollX: 0, scrollY: 300 });
    expect(snapshot.payload.wedding).toEqual(source.wedding);
    expect(snapshot.payload.customConfig).toEqual(source.customConfig);
    expect(snapshot.payload.coupleMedia).toEqual(source.coupleMedia);
    expect(snapshot.payload.editor).toEqual({ enabled: false, frame: { w: 510, svh: 915 }, revealOverflow: false });
    expect(snapshot.scrollY).toBe(300);
    expect(source.editor.selectedLayer).toBe('names');
    expect(source.editor.enabled).toBe(true);
  });

  it('keeps a cinematic camera pose but excludes reference artwork', () => {
    const source = { wedding: { templateId: 15 }, editor: { enabled: true,
      cinematic: { progress: .6, beatId: 'couple', cameraOverride: { x: 10 }, referenceSrc: '/reference.png' } } };
    const snapshot = capturePreviewSnapshot(source, { width: 510, height: 915, scrollX: 0, scrollY: 0 });
    expect((snapshot.payload.editor as typeof source.editor).cinematic).toEqual({ progress: .6, beatId: 'couple', cameraOverride: { x: 10 } });
    expect(source.editor.cinematic.referenceSrc).toBe('/reference.png');
  });
});
