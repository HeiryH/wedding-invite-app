'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  weddingService,
  photoService,
  templateConfigService,
  weddingFeatureService,
  Wedding,
  Photo,
  TemplateSlots,
} from '@/lib/api';
import { getConfigFields, buildDefaultConfig } from '@/lib/templateConfigSchema';
import TemplateWrapper from '@/components/templates/TemplateWrapper';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

const SAMPLE_WISHES = [
  { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of happiness!', createdDate: new Date().toISOString() },
  { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the happy couple!', createdDate: new Date().toISOString() },
];

const PORTRAIT_SLOTS_T3 = [
  { slot: TemplateSlots.GROOM_PORTRAIT, label: 'Groom Portrait' },
  { slot: TemplateSlots.BRIDE_PORTRAIT, label: 'Bride Portrait' },
  { slot: TemplateSlots.EXTRA_1, label: 'Extra Image 1' },
  { slot: TemplateSlots.EXTRA_2, label: 'Extra Image 2' },
  { slot: TemplateSlots.EXTRA_3, label: 'Extra Image 3' },
];

// Template 4 — Minimal Noir
const PORTRAIT_SLOTS_T4 = [
  { slot: TemplateSlots.GROOM_PORTRAIT, label: 'Hero Background (Couple Photo)' },
  { slot: TemplateSlots.BRIDE_PORTRAIT, label: 'Mid-Page Photo' },
  { slot: TemplateSlots.EXTRA_1, label: 'Photo Booth — Card 1' },
  { slot: TemplateSlots.EXTRA_2, label: 'Photo Booth — Card 2' },
  { slot: TemplateSlots.EXTRA_3, label: 'Photo Booth — Card 3' },
];

// ── Rich text editor for invite.body ─────────────────────────────────────────
function RichTextEditor({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (html: string) => void;
  maxLength: number;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, horizontalRule: false }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const count = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div className="border-2 border-gray-200 rounded-lg focus-within:border-rose-400 transition-colors">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded font-bold transition-colors ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded italic transition-colors ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          I
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[80px] focus:outline-none [&_.ProseMirror]:outline-none"
      />
      <div className={`text-right text-xs px-3 py-1 border-t border-gray-100 ${count >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
        {count} / {maxLength}
      </div>
    </div>
  );
}

// ── Drag-and-drop photo slot ──────────────────────────────────────────────────
function PhotoDropZone({
  slot,
  label,
  photo,
  uploading,
  onDrop,
  onRemove,
}: {
  slot: number;
  label: string;
  photo: Photo | undefined;
  uploading: boolean;
  onDrop: (slot: number, file: File) => void;
  onRemove: (photo: Photo) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onDrop(slot, file);
  };
  const handleClick = () => inputRef.current?.click();
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onDrop(slot, file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {photo ? (
        <div className="relative rounded-xl overflow-hidden aspect-[3/4] shadow-sm group">
          <img src={`${API_BASE}${photo.photoUrl}`} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onRemove(photo)}
              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver ? 'border-rose-400 bg-rose-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="text-gray-400 text-sm">Uploading…</div>
          ) : (
            <>
              <div className="text-3xl mb-2">📷</div>
              <p className="text-xs text-gray-500 text-center px-2">Drop image here<br />or click to browse</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;
  const role = user?.role ?? '';

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [coupleMedia, setCoupleMedia] = useState<Photo[]>([]);
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});
  const [savedConfig, setSavedConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'photos'>('content');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);

  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(savedConfig);

  useEffect(() => {
    if (!weddingId) {
      router.push('/login');
      return;
    }
    load();
  }, [weddingId]);

  const load = async () => {
    if (!weddingId) return;
    try {
      const [w, media, config, photoBooth] = await Promise.all([
        weddingService.getById(weddingId),
        photoService.getCoupleMediaByWeddingId(weddingId),
        templateConfigService.getByWeddingId(weddingId),
        weddingFeatureService.isFeatureEnabled(weddingId, 'PHOTO_BOOTH'),
      ]);
      setWedding(w);
      setCoupleMedia(media);
      setPhotoBoothEnabled(photoBooth);

      const defaults = buildDefaultConfig(w.templateId);
      const merged = { ...defaults, ...config };
      setDraftConfig(merged);
      setSavedConfig(merged);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = useCallback((key: string, value: string) => {
    setDraftConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!weddingId) return;
    setSaving(true);
    try {
      await templateConfigService.save(weddingId, draftConfig);
      setSavedConfig({ ...draftConfig });
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoDrop = async (slot: number, file: File) => {
    if (!weddingId) return;
    setUploadingSlot(slot);
    try {
      const uploaded = await photoService.upload(weddingId, '', '', file, 'COUPLE', slot);
      setCoupleMedia((prev) => {
        const filtered = prev.filter((p) => p.templateSlot !== slot);
        return [...filtered, uploaded];
      });
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handlePhotoRemove = async (photo: Photo) => {
    try {
      await photoService.delete(photo.photoId);
      setCoupleMedia((prev) => prev.filter((p) => p.photoId !== photo.photoId));
    } catch {
      alert('Could not remove photo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading editor…</p>
      </div>
    );
  }

  if (!wedding) return null;

  const fields = getConfigFields(wedding.templateId, role);
  const sections = [...new Set(fields.map((f) => f.section))];

  const sectionLabel: Record<string, string> = {
    invitation: 'Invitation',
    rsvp: 'RSVP',
    wishes: 'Wishes',
    footer: 'Footer',
    navigation: 'Navigation Labels',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/couple-admin')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <h1 className="font-semibold text-gray-800">Customize Template</h1>
            {isDirty && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saving || !isDirty
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
            }`}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* LEFT: Editor (40%) */}
        <div className="w-[400px] shrink-0 overflow-y-auto h-[calc(100vh-56px)] sticky top-14 border-r border-gray-200 bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'content'
                  ? 'text-rose-600 border-b-2 border-rose-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Content
            </button>
            {[3, 4].includes(wedding.templateId) && (
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'photos'
                    ? 'text-rose-600 border-b-2 border-rose-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Photos
              </button>
            )}
          </div>

          <div className="p-5 space-y-8">
            {activeTab === 'content' && sections.map((section) => {
              const sectionFields = fields.filter((f) => f.section === section);
              return (
                <div key={section}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {sectionLabel[section] ?? section}
                  </h3>
                  <div className="space-y-4">
                    {sectionFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.adminOnly && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </label>
                        {field.richText ? (
                          <RichTextEditor
                            key={field.key}
                            value={draftConfig[field.key] ?? field.defaultValue}
                            onChange={(html) => handleFieldChange(field.key, html)}
                            maxLength={field.maxLength}
                          />
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={draftConfig[field.key] ?? field.defaultValue}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              maxLength={field.maxLength}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-rose-400 focus:outline-none"
                            />
                            <p className={`text-right text-xs mt-0.5 ${
                              (draftConfig[field.key] ?? '').length >= field.maxLength
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }`}>
                              {(draftConfig[field.key] ?? '').length} / {field.maxLength}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {activeTab === 'photos' && [3, 4].includes(wedding.templateId) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Portrait & Gallery Slots
                </h3>
                {wedding.templateId === 4 && (
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    <strong>Hero Background</strong> appears full-screen behind the couple&apos;s names.
                    The three <strong>Photo Booth</strong> cards are the first images guests see in the swipe stack.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {(wedding.templateId === 4 ? PORTRAIT_SLOTS_T4 : PORTRAIT_SLOTS_T3).map(({ slot, label }) => (
                    <PhotoDropZone
                      key={slot}
                      slot={slot}
                      label={label}
                      photo={coupleMedia.find((m) => m.templateSlot === slot)}
                      uploading={uploadingSlot === slot}
                      onDrop={handlePhotoDrop}
                      onRemove={handlePhotoRemove}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview (60%) */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex flex-col">
          <div className="text-center py-2 bg-gray-200 text-xs text-gray-500 font-medium tracking-wide select-none">
            PREVIEW — changes update in real time
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div
              style={{
                transform: 'scale(0.55)',
                transformOrigin: 'top center',
                width: '181.8%',
              }}
            >
              <TemplateWrapper
                wedding={wedding}
                wishes={SAMPLE_WISHES}
                photos={[]}
                guests={[]}
                photoBoothEnabled={photoBoothEnabled}
                coupleMedia={coupleMedia}
                customConfig={draftConfig}
                onRSVP={async () => {}}
                onSubmitWish={async () => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
