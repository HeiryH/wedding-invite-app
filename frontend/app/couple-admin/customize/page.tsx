'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  weddingService,
  photoService,
  audioService,
  templateConfigService,
  weddingFeatureService,
  itineraryService,
  Wedding,
  Photo,
  ItineraryItem,
  TemplateSlots,
} from '@/lib/api';
import { buildDefaultConfig } from '@/lib/templateConfigSchema';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

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

const PORTRAIT_SLOTS_T4 = [
  { slot: TemplateSlots.GROOM_PORTRAIT, label: 'Hero Background (Couple Photo)' },
  { slot: TemplateSlots.BRIDE_PORTRAIT, label: 'Mid-Page Photo' },
  { slot: TemplateSlots.EXTRA_1, label: 'Photo Booth — Card 1' },
  { slot: TemplateSlots.EXTRA_2, label: 'Photo Booth — Card 2' },
  { slot: TemplateSlots.EXTRA_3, label: 'Photo Booth — Card 3' },
];


// ── Tab / section-order types ─────────────────────────────────────────────────

type Tab = 'welcome' | 'ceremony' | 'celebration' | 'music';

// Music tab is fixed (not reorderable) — only these 3 go into tabOrder
const REORDERABLE_TABS: { id: Tab; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'ceremony', label: 'Ceremony' },
  { id: 'celebration', label: 'Celebration' },
];

// Keep TABS alias so existing code (buildSectionOrder, parseTabOrder) works unchanged
const TABS = REORDERABLE_TABS;

const TAB_SECTION_CODES: Record<Tab, string[]> = {
  welcome: ['welcome'],
  ceremony: ['walimah', 'rsvp', 'itinerary'],
  celebration: ['wishes', 'photobooth'],
  music: [],
};

const TAB_SCROLL_FRACTION: Record<Tab, number> = {
  welcome: 0,
  ceremony: 0.35,
  celebration: 0.7,
  music: 0,
};

function buildSectionOrder(order: Tab[]): string {
  return order.flatMap((t) => TAB_SECTION_CODES[t]).join(',');
}

function parseTabOrder(sectionOrder: string): Tab[] {
  const codes = sectionOrder.split(',');
  const result: Tab[] = [];
  const seen = new Set<Tab>();
  for (const code of codes) {
    const entry = (Object.entries(TAB_SECTION_CODES) as [Tab, string[]][]).find(([, v]) => v.includes(code));
    if (entry && !seen.has(entry[0])) { result.push(entry[0]); seen.add(entry[0]); }
  }
  for (const { id } of TABS) { if (!seen.has(id)) result.push(id); }
  return result;
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <p className="text-sm font-medium text-gray-700">{children}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function TextField({ value, onChange, maxLength, placeholder }: {
  value: string; onChange: (v: string) => void; maxLength: number; placeholder?: string;
}) {
  return (
    <div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength} placeholder={placeholder}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
      <p className={`text-right text-xs mt-0.5 ${value.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
        {value.length} / {maxLength}
      </p>
    </div>
  );
}

function SelectField({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none bg-white">
      {options.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
    </select>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-rose-500' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
        className="h-9 w-14 cursor-pointer rounded border-2 border-gray-200 p-0.5" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Hex color or leave empty for default"
        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none font-mono" />
      {value && (
        <button type="button" onClick={() => onChange('')}
          className="text-xs text-gray-400 hover:text-gray-600 shrink-0">Clear</button>
      )}
    </div>
  );
}

// ── Rich text editor ──────────────────────────────────────────────────────────

function RichTextEditor({ value, onChange, maxLength }: {
  value: string; onChange: (html: string) => void; maxLength: number;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, horizontalRule: false }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  const count = editor?.storage.characterCount.characters() ?? 0;
  return (
    <div className="border-2 border-gray-200 rounded-lg focus-within:border-rose-400 transition-colors">
      <div className="flex gap-1 p-2 border-b border-gray-100">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded font-bold ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded italic ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>I</button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[80px] [&_.ProseMirror]:outline-none" />
      <div className={`text-right text-xs px-3 py-1 border-t border-gray-100 ${count >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
        {count} / {maxLength}
      </div>
    </div>
  );
}

// ── Itinerary editor ──────────────────────────────────────────────────────────

function ItineraryEditor({ weddingId, onItemsChange }: { weddingId: number; onItemsChange?: (items: ItineraryItem[]) => void }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ label: '', detail: '' });
  const [newRow, setNewRow] = useState({ label: '', detail: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    itineraryService.getByWeddingId(weddingId).then((data) => { setItems(data); setLoading(false); });
  }, [weddingId]);

  // Notify parent whenever items change so preview stays in sync
  useEffect(() => { onItemsChange?.(items); }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;

  const handleAdd = async () => {
    if (!newRow.label.trim()) return;
    const created = await itineraryService.create(weddingId, { ...newRow, label: newRow.label.trim(), detail: newRow.detail.trim(), sortOrder: nextSort });
    setItems((p) => [...p, created]);
    setNewRow({ label: '', detail: '' });
    setAdding(false);
  };

  const handleSaveEdit = async (item: ItineraryItem) => {
    if (!editDraft.label.trim()) return;
    const updated = await itineraryService.update(item.itineraryItemId, { label: editDraft.label.trim(), detail: editDraft.detail.trim(), sortOrder: item.sortOrder });
    setItems((p) => p.map((i) => i.itineraryItemId === updated.itineraryItemId ? updated : i));
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await itineraryService.delete(id);
    setItems((p) => p.filter((i) => i.itineraryItemId !== id));
  };

  const handleMove = async (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    setItems(reordered);
    await itineraryService.reorder(weddingId, { items: reordered.map((i) => ({ itineraryItemId: i.itineraryItemId, sortOrder: i.sortOrder })) });
  };

  if (loading) return <p className="text-sm text-gray-400 py-2">Loading…</p>;

  return (
    <div className="space-y-2">
      {items.length === 0 && !adding && (
        <p className="text-sm text-gray-400 text-center py-3">No items yet. Add your first schedule entry below.</p>
      )}

      {items.map((item, index) => (
        <div key={item.itineraryItemId} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          {editingId === item.itineraryItemId ? (
            <div className="space-y-2">
              <input autoFocus type="text" value={editDraft.label}
                onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Label (e.g. Akad Nikah)"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
              <input type="text" value={editDraft.detail}
                onChange={(e) => setEditDraft((d) => ({ ...d, detail: e.target.value }))}
                placeholder="Detail (e.g. 10:00 AM · Grand Mosque)"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={() => handleSaveEdit(item)}
                  className="px-3 py-1 bg-rose-500 text-white text-xs rounded-md hover:bg-rose-600">Save</button>
                <button onClick={() => setEditingId(null)}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0 pt-0.5">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-tight px-0.5">▲</button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1}
                  className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-tight px-0.5">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug">{item.label}</p>
                {item.detail && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.detail}</p>}
              </div>
              <div className="flex gap-1 shrink-0 mt-0.5">
                <button onClick={() => { setEditingId(item.itineraryItemId); setEditDraft({ label: item.label, detail: item.detail }); }}
                  className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-white transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.itineraryItemId)}
                  className="px-2 py-1 text-xs text-red-400 border border-red-100 rounded hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="border border-rose-200 rounded-lg p-3 bg-rose-50/50 space-y-2">
          <input autoFocus type="text" value={newRow.label}
            onChange={(e) => setNewRow((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label (e.g. Akad Nikah)"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
          <input type="text" value={newRow.detail}
            onChange={(e) => setNewRow((d) => ({ ...d, detail: e.target.value }))}
            placeholder="Detail (e.g. 10:00 AM · Grand Mosque)"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-3 py-1 bg-rose-500 text-white text-xs rounded-md hover:bg-rose-600">Add</button>
            <button onClick={() => { setAdding(false); setNewRow({ label: '', detail: '' }); }}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors">
          + Add schedule item
        </button>
      )}
    </div>
  );
}

// ── Music Tab ─────────────────────────────────────────────────────────────────

function MusicTab({ url, loop, weddingId, onUrlChange, onLoopChange }: {
  url: string; loop: boolean; weddingId: number;
  onUrlChange: (v: string) => void; onLoopChange: (v: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const audioUrl = await audioService.upload(weddingId, file);
      onUrlChange(audioUrl);
    } catch {
      alert('Upload failed. Make sure the file is a valid audio format (mp3, wav, ogg, aac, m4a, flac) under 20 MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upload Audio</h3>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f?.type.startsWith('audio/')) handleFile(f);
          }}
          className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${dragOver ? 'border-rose-400 bg-rose-50' : 'border-gray-300 hover:border-rose-300 bg-gray-50'}`}
        >
          {uploading ? (
            <p className="text-sm text-gray-400">Uploading…</p>
          ) : (
            <>
              <span className="text-3xl">🎵</span>
              <p className="text-sm font-medium text-gray-600">Drop audio file here or click to browse</p>
              <p className="text-xs text-gray-400">MP3, WAV, OGG, AAC, M4A, FLAC · max 20 MB</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Or Paste a URL</h3>
        <TextField value={url} onChange={onUrlChange} maxLength={500} />
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          Must be a <strong>direct link</strong> to an audio file (ending in .mp3, .wav, etc.).
          YouTube, Spotify, and SoundCloud links won&apos;t work — they don&apos;t expose raw audio streams.
          Use file hosting like Dropbox (direct download link) or upload above instead.
        </p>
      </section>

      {url && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview</h3>
          <audio
            key={url}
            controls
            src={url.startsWith('/') ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '') + url : url}
            className="w-full rounded-lg"
          />
          <button type="button" onClick={() => onUrlChange('')}
            className="text-xs text-red-500 hover:text-red-700 font-medium">
            Remove music
          </button>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</h3>
        <div className="flex items-center justify-between gap-3">
          <FieldLabel hint="Music will restart from the beginning when it ends">Loop Music</FieldLabel>
          <ToggleSwitch value={loop} onChange={onLoopChange} />
        </div>
      </section>
    </div>
  );
}

// ── Background image upload ───────────────────────────────────────────────────

const BG_SLOT: Record<string, number> = {
  'section.welcome.bg': TemplateSlots.WELCOME_BG,
  'section.ceremony.bg': TemplateSlots.CEREMONY_BG,
  'section.celebration.bg': TemplateSlots.CELEBRATION_BG,
  'template.bg': TemplateSlots.TEMPLATE5_GLOBAL_BG,
};

function BgImageField({ configKey, label, value, weddingId, onChange }: {
  configKey: string; label: string; value: string; weddingId: number; onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const photo = await photoService.upload(weddingId, '', `${label} background`, file, 'COUPLE', BG_SLOT[configKey]);
      onChange(photo.photoUrl);
    } catch {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      {value ? (
        <div className="relative rounded-lg overflow-hidden aspect-video shadow-sm group">
          <img src={`${API_BASE}${value}`} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" onClick={() => onChange('')}
              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Remove</button>
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()}
          className="aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-rose-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
          {uploading
            ? <p className="text-sm text-gray-400">Uploading…</p>
            : <><span className="text-2xl mb-1">🖼️</span><p className="text-xs text-gray-500">Click to upload background image</p></>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Portrait photo slot (for T3 / T4) ────────────────────────────────────────

function PhotoDropZone({ slot, label, photo, uploading, onDrop, onRemove }: {
  slot: number; label: string; photo: Photo | undefined; uploading: boolean;
  onDrop: (slot: number, file: File) => void; onRemove: (photo: Photo) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {photo ? (
        <div className="relative rounded-xl overflow-hidden aspect-[3/4] shadow-sm group">
          <img src={`${API_BASE}${photo.photoUrl}`} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" onClick={() => onRemove(photo)}
              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Remove</button>
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onDrop(slot, f); }}
          className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${dragOver ? 'border-rose-400 bg-rose-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
          {uploading
            ? <div className="text-gray-400 text-sm">Uploading…</div>
            : <><div className="text-3xl mb-2">📷</div><p className="text-xs text-gray-500 text-center px-2">Drop image here<br />or click to browse</p></>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onDrop(slot, f); e.target.value = ''; }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizePage() {
  const router = useRouter();
  const user = getUser();
  const weddingId = user?.weddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [coupleMedia, setCoupleMedia] = useState<Photo[]>([]);

  // Template config
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});
  const [savedConfig, setSavedConfig] = useState<Record<string, string>>({});

  // Wedding model fields (names, date, venue)
  const emptyWed = { brideName: '', groomName: '', weddingDate: '', venue: '', venueAddress: '' };
  const [weddingDraft, setWeddingDraft] = useState(emptyWed);
  const [weddingSaved, setWeddingSaved] = useState(emptyWed);

  const [activeTab, setActiveTab] = useState<Tab>('welcome');
  const [tabOrder, setTabOrder] = useState<Tab[]>(TABS.map((t) => t.id));
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [panelW, setPanelW] = useState(800);
  const [panelH, setPanelH] = useState(600);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const payloadRef = useRef<unknown>(null);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  // Always-current view state for use inside imperative event handlers
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 });

  const configDirty = JSON.stringify(draftConfig) !== JSON.stringify(savedConfig);
  const weddingDirty = JSON.stringify(weddingDraft) !== JSON.stringify(weddingSaved);
  const isDirty = configDirty || weddingDirty;

  useEffect(() => {
    if (!weddingId) { router.push('/login'); return; }
    load();
  }, [weddingId]);

  // Track preview panel dimensions for iframe scaling
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setPanelW(Math.floor(entry.contentRect.width));
      setPanelH(Math.floor(entry.contentRect.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Push draft state to iframe whenever anything changes
  useEffect(() => {
    if (!wedding) return;
    const payload = {
      wedding: { ...wedding, ...weddingDraft },
      coupleMedia,
      wishes: SAMPLE_WISHES,
      photoBoothEnabled,
      customConfig: draftConfig,
      itinerary,
    };
    payloadRef.current = payload;
    try { localStorage.setItem('preview_draft', JSON.stringify(payload)); } catch {}
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'PREVIEW_UPDATE', payload },
      window.location.origin,
    );
  }, [draftConfig, weddingDraft, coupleMedia, photoBoothEnabled, itinerary, wedding]);

  // When iframe signals it's ready, replay the latest state (handles load-order race)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'PREVIEW_READY' && payloadRef.current) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'PREVIEW_UPDATE', payload: payloadRef.current },
          window.location.origin,
        );
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Wheel-to-zoom — must be non-passive so we can preventDefault
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      const { zoom: z, panX: px, panY: py } = viewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(4, Math.max(0.1, z * factor));
      const ratio = newZoom / z;
      const next = { zoom: newZoom, panX: mx - ratio * (mx - px), panY: my - ratio * (my - py) };
      viewRef.current = next;
      setZoom(next.zoom);
      setPanX(next.panX);
      setPanY(next.panY);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Document-level mouse tracking while panning (captures events over the iframe too)
  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      setPanX(panStartRef.current.panX + (e.clientX - panStartRef.current.x));
      setPanY(panStartRef.current.panY + (e.clientY - panStartRef.current.y));
    };
    const onUp = () => setIsPanning(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isPanning]);

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

      const wd = {
        brideName: w.brideName,
        groomName: w.groomName,
        weddingDate: w.weddingDate.slice(0, 16),
        venue: w.venue,
        venueAddress: w.venueAddress,
      };
      setWeddingDraft(wd);
      setWeddingSaved(wd);

      const merged = { ...buildDefaultConfig(w.templateId), ...config };
      setDraftConfig(merged);
      setSavedConfig(merged);

      if (merged['section.order']) setTabOrder(parseTabOrder(merged['section.order']));
    } finally {
      setLoading(false);
    }
  };

  const setConfig = useCallback((key: string, value: string) => {
    setDraftConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!weddingId || !wedding) return;
    setSaving(true);
    try {
      const configToSave = { ...draftConfig, 'section.order': buildSectionOrder(tabOrder) };
      const tasks: Promise<unknown>[] = [templateConfigService.save(weddingId, configToSave)];
      if (weddingDirty) {
        tasks.push(weddingService.update(weddingId, {
          brideName: weddingDraft.brideName,
          groomName: weddingDraft.groomName,
          weddingDate: weddingDraft.weddingDate,
          venue: weddingDraft.venue,
          venueAddress: weddingDraft.venueAddress,
        }));
      }
      await Promise.all(tasks);
      setSavedConfig(configToSave);
      setDraftConfig(configToSave);
      setWeddingSaved({ ...weddingDraft });
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveTab = (tab: Tab, dir: 'up' | 'down') => {
    const idx = tabOrder.indexOf(tab);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= tabOrder.length) return;
    const next = [...tabOrder];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setTabOrder(next);
    setConfig('section.order', buildSectionOrder(next));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).tagName === 'IFRAME') return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'PREVIEW_SCROLL', fraction: TAB_SCROLL_FRACTION[tab] },
      window.location.origin,
    );
  };

  const handlePhotoDrop = async (slot: number, file: File) => {
    if (!weddingId) return;
    setUploadingSlot(slot);
    try {
      const uploaded = await photoService.upload(weddingId, '', '', file, 'COUPLE', slot);
      setCoupleMedia((prev) => [...prev.filter((p) => p.templateSlot !== slot), uploaded]);
    } catch { alert('Upload failed.'); }
    finally { setUploadingSlot(null); }
  };

  const handlePhotoRemove = async (photo: Photo) => {
    try {
      await photoService.delete(photo.photoId);
      setCoupleMedia((prev) => prev.filter((p) => p.photoId !== photo.photoId));
    } catch { alert('Could not remove photo.'); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading editor…</p></div>;
  }
  if (!wedding) return null;

  const showPortraitSlots = [3, 4].includes(wedding.templateId);
  const portraitSlots = wedding.templateId === 4 ? PORTRAIT_SLOTS_T4 : PORTRAIT_SLOTS_T3;

  // Keep viewRef in sync so the imperative wheel handler always has fresh values
  viewRef.current = { zoom, panX, panY };

  // Iframe sizing — scale uniformly so the full simulated viewport always fits the panel
  const effectiveW = previewWidth ?? panelW;
  const effectiveH = previewHeight ?? panelH;
  const scale = Math.min(
    effectiveW > panelW ? panelW / effectiveW : 1,
    effectiveH > panelH ? panelH / effectiveH : 1,
  );
  const displayW = Math.round(effectiveW * scale);
  const displayH = Math.round(effectiveH * scale);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/couple-admin')} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back
            </button>
            <h1 className="font-semibold text-gray-800">Customize Template</h1>
            {isDirty && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unsaved changes</span>
            )}
          </div>
          <button onClick={handleSave} disabled={saving || !isDirty}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${saving || !isDirty ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'}`}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* LEFT: 3-tab editor */}
        <div className="w-[420px] shrink-0 overflow-y-auto h-[calc(100vh-56px)] sticky top-14 border-r border-gray-200 bg-white">

          {/* Tab headers — reorderable tabs + fixed Music tab */}
          <div className="flex border-b border-gray-200">
            {tabOrder.map((tab, idx) => (
              <div key={tab} className="flex-1 relative">
                <button onClick={() => handleTabChange(tab)}
                  className={`w-full py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700'}`}>
                  {TABS.find((t) => t.id === tab)?.label}
                </button>
                <div className="absolute right-1 top-1 flex flex-col opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  style={{ opacity: undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '')}>
                  <button onClick={() => handleMoveTab(tab, 'up')} disabled={idx === 0}
                    title="Move section up"
                    className="text-[9px] text-gray-400 hover:text-rose-500 disabled:opacity-20 leading-tight p-0.5">▲</button>
                  <button onClick={() => handleMoveTab(tab, 'down')} disabled={idx === tabOrder.length - 1}
                    title="Move section down"
                    className="text-[9px] text-gray-400 hover:text-rose-500 disabled:opacity-20 leading-tight p-0.5">▼</button>
                </div>
              </div>
            ))}
            {/* Music — fixed, non-reorderable */}
            <div className="flex-1 relative">
              <button onClick={() => handleTabChange('music')}
                className={`w-full py-3 text-sm font-medium transition-colors ${activeTab === 'music' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700'}`}>
                Music
              </button>
            </div>
          </div>

          <div className="p-5 space-y-7">

            {/* ═══════════════ WELCOME TAB ═══════════════ */}
            {activeTab === 'welcome' && <>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invitation Layout</h3>
                <div>
                  <FieldLabel>Layout Style</FieldLabel>
                  <SelectField value={draftConfig['invite.layout'] ?? 'classic'} options={['classic', 'minimal', 'ornate']} onChange={(v) => setConfig('invite.layout', v)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wedding Details</h3>
                <div>
                  <FieldLabel>Bride&apos;s Name</FieldLabel>
                  <TextField value={weddingDraft.brideName} onChange={(v) => setWeddingDraft((d) => ({ ...d, brideName: v }))} maxLength={100} />
                  {wedding?.templateId === 5 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <FieldLabel>Name Color</FieldLabel>
                        <ColorField value={draftConfig['names.bride.color'] ?? ''} onChange={(v) => setConfig('names.bride.color', v)} />
                      </div>
                      <div>
                        <FieldLabel>Shadow</FieldLabel>
                        <SelectField value={draftConfig['names.bride.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('names.bride.shadow', v)} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Groom&apos;s Name</FieldLabel>
                  <TextField value={weddingDraft.groomName} onChange={(v) => setWeddingDraft((d) => ({ ...d, groomName: v }))} maxLength={100} />
                  {wedding?.templateId === 5 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <FieldLabel>Name Color</FieldLabel>
                        <ColorField value={draftConfig['names.groom.color'] ?? ''} onChange={(v) => setConfig('names.groom.color', v)} />
                      </div>
                      <div>
                        <FieldLabel>Shadow</FieldLabel>
                        <SelectField value={draftConfig['names.groom.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('names.groom.shadow', v)} />
                      </div>
                    </div>
                  )}
                </div>
                {wedding?.templateId === 5 && (
                  <div>
                    <FieldLabel>Ampersand (&amp;) Color</FieldLabel>
                    <ColorField value={draftConfig['names.ampersand.color'] ?? ''} onChange={(v) => setConfig('names.ampersand.color', v)} />
                  </div>
                )}
                <div>
                  <FieldLabel>Wedding Date &amp; Time</FieldLabel>
                  <input type="datetime-local" value={weddingDraft.weddingDate}
                    onChange={(e) => setWeddingDraft((d) => ({ ...d, weddingDate: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none" />
                  {wedding?.templateId === 5 && (
                    <div className="mt-2">
                      <FieldLabel>Date Color</FieldLabel>
                      <ColorField value={draftConfig['date.color'] ?? ''} onChange={(v) => setConfig('date.color', v)} />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Add to Calendar button</FieldLabel>
                  <ToggleSwitch
                    value={draftConfig['general.showAddToCalendar'] === 'true'}
                    onChange={(v) => setConfig('general.showAddToCalendar', v ? 'true' : 'false')}
                  />
                </div>
                <div>
                  <FieldLabel>Venue</FieldLabel>
                  <TextField value={weddingDraft.venue} onChange={(v) => setWeddingDraft((d) => ({ ...d, venue: v }))} maxLength={200} />
                  {wedding?.templateId === 5 && (
                    <div className="mt-2">
                      <FieldLabel>Venue Color</FieldLabel>
                      <ColorField value={draftConfig['venue.color'] ?? ''} onChange={(v) => setConfig('venue.color', v)} />
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Venue Address</FieldLabel>
                  <TextField value={weddingDraft.venueAddress} onChange={(v) => setWeddingDraft((d) => ({ ...d, venueAddress: v }))} maxLength={500} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Show venue map</FieldLabel>
                  <ToggleSwitch
                    value={draftConfig['general.showVenueMap'] === 'true'}
                    onChange={(v) => setConfig('general.showVenueMap', v ? 'true' : 'false')}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Name Order</h3>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel hint="Toggle to put groom's name first">Bride&apos;s name first</FieldLabel>
                  <ToggleSwitch
                    value={draftConfig['general.brideFirst'] !== 'false'}
                    onChange={(v) => setConfig('general.brideFirst', v ? 'true' : 'false')}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Date Display</h3>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel hint="Auto-calculated from wedding date">Show Islamic (Hijri) Date</FieldLabel>
                  <ToggleSwitch
                    value={draftConfig['general.showIslamicDate'] === 'true'}
                    onChange={(v) => setConfig('general.showIslamicDate', v ? 'true' : 'false')}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Heading</h3>
                <div>
                  <FieldLabel>Heading Text</FieldLabel>
                  <TextField value={draftConfig['invite.heading'] ?? ''} onChange={(v) => setConfig('invite.heading', v)} maxLength={50} />
                </div>
                <div>
                  <FieldLabel>Alignment</FieldLabel>
                  <SelectField value={draftConfig['invite.heading.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => setConfig('invite.heading.align', v)} />
                </div>
                <div>
                  <FieldLabel>Animation</FieldLabel>
                  <SelectField value={draftConfig['invite.heading.animation'] ?? 'none'} options={['none', 'fade', 'slide', 'typewriter']} onChange={(v) => setConfig('invite.heading.animation', v)} />
                </div>
                <div>
                  <FieldLabel hint="Leave empty to use the template default">Color</FieldLabel>
                  <ColorField value={draftConfig['invite.heading.color'] ?? ''} onChange={(v) => setConfig('invite.heading.color', v)} />
                </div>
                <div>
                  <FieldLabel>Text Shadow</FieldLabel>
                  <SelectField value={draftConfig['invite.heading.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('invite.heading.shadow', v)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invitation Message</h3>
                <RichTextEditor value={draftConfig['invite.body'] ?? ''} onChange={(html) => setConfig('invite.body', html)} maxLength={200} />
                <div>
                  <FieldLabel>Message Alignment</FieldLabel>
                  <SelectField value={draftConfig['invite.body.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => setConfig('invite.body.align', v)} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Section Background</h3>
                <BgImageField configKey="section.welcome.bg" label="Welcome" value={draftConfig['section.welcome.bg'] ?? ''} weddingId={weddingId!} onChange={(url) => setConfig('section.welcome.bg', url)} />
              </section>

              {wedding?.templateId === 5 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Page Background</h3>
                  <BgImageField
                    configKey="template.bg"
                    label="Page Background"
                    value={draftConfig['template.bg'] ?? ''}
                    weddingId={weddingId!}
                    onChange={(url) => setConfig('template.bg', url)}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Background Size</FieldLabel>
                      <select
                        value={draftConfig['template.bgSize'] ?? 'cover'}
                        onChange={(e) => setConfig('template.bgSize', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none mt-1"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="auto">Natural</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Background Position</FieldLabel>
                      <select
                        value={draftConfig['template.bgPosition'] ?? 'center'}
                        onChange={(e) => setConfig('template.bgPosition', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-rose-400 focus:outline-none mt-1"
                      >
                        <option value="center">Center</option>
                        <option value="top center">Top</option>
                        <option value="bottom center">Bottom</option>
                        <option value="left center">Left</option>
                        <option value="right center">Right</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}


              {wedding?.templateId === 5 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Countdown</h3>
                  <div>
                    <FieldLabel>Countdown Label</FieldLabel>
                    <TextField value={draftConfig['invite.countdown_prefix'] ?? ''} onChange={(v) => setConfig('invite.countdown_prefix', v)} maxLength={60} placeholder="Counting down to our special day" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Label Color</FieldLabel>
                      <ColorField value={draftConfig['countdown.label.color'] ?? ''} onChange={(v) => setConfig('countdown.label.color', v)} />
                    </div>
                    <div>
                      <FieldLabel>Number Color</FieldLabel>
                      <ColorField value={draftConfig['countdown.number.color'] ?? ''} onChange={(v) => setConfig('countdown.number.color', v)} />
                    </div>
                  </div>
                </section>
              )}

            </>}

            {/* ═══════════════ CEREMONY TAB ═══════════════ */}
            {activeTab === 'ceremony' && <>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ceremony / Walimah</h3>
                <div>
                  <FieldLabel>Section Title</FieldLabel>
                  <TextField value={draftConfig['walimah.title'] ?? ''} onChange={(v) => setConfig('walimah.title', v)} maxLength={40} placeholder="Walimatul Urus" />
                  {wedding?.templateId === 5 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <FieldLabel>Title Color</FieldLabel>
                        <ColorField value={draftConfig['ceremony.title.color'] ?? ''} onChange={(v) => setConfig('ceremony.title.color', v)} />
                      </div>
                      <div>
                        <FieldLabel>Shadow</FieldLabel>
                        <SelectField value={draftConfig['ceremony.title.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('ceremony.title.shadow', v)} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel hint="Supports bold and italic formatting">Ceremony Details</FieldLabel>
                  <RichTextEditor value={draftConfig['walimah.body'] ?? ''} onChange={(html) => setConfig('walimah.body', html)} maxLength={500} />
                </div>
                <div>
                  <FieldLabel>Text Alignment</FieldLabel>
                  <SelectField value={draftConfig['walimah.body.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => setConfig('walimah.body.align', v)} />
                </div>
                {wedding?.templateId === 5 && (
                  <div>
                    <FieldLabel hint="Leave empty for template default">Body Text Color</FieldLabel>
                    <ColorField value={draftConfig['walimah.body.color'] ?? ''} onChange={(v) => setConfig('walimah.body.color', v)} />
                  </div>
                )}
              </section>

              {wedding?.templateId === 5 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Couple Names in Card</h3>
                  <p className="text-xs text-gray-400">Names displayed inside the ceremony card</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Color</FieldLabel>
                      <ColorField value={draftConfig['ceremony.names.color'] ?? ''} onChange={(v) => setConfig('ceremony.names.color', v)} />
                    </div>
                    <div>
                      <FieldLabel>Shadow</FieldLabel>
                      <SelectField value={draftConfig['ceremony.names.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('ceremony.names.shadow', v)} />
                    </div>
                  </div>
                </section>
              )}


              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">RSVP</h3>
                <FieldLabel>RSVP Subtitle</FieldLabel>
                <TextField value={draftConfig['rsvp.subtitle'] ?? ''} onChange={(v) => setConfig('rsvp.subtitle', v)} maxLength={80} />
                {wedding?.templateId === 5 && (
                  <div className="mt-2">
                    <FieldLabel>Subtitle Color</FieldLabel>
                    <ColorField value={draftConfig['rsvp.subtitle.color'] ?? ''} onChange={(v) => setConfig('rsvp.subtitle.color', v)} />
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule / Itinerary</h3>
                <div>
                  <FieldLabel>Schedule Section Title</FieldLabel>
                  <TextField value={draftConfig['itinerary.title'] ?? ''} onChange={(v) => setConfig('itinerary.title', v)} maxLength={40} placeholder="Aturcara Majlis" />
                  {wedding?.templateId === 5 && (
                    <div className="mt-2">
                      <FieldLabel>Title Color</FieldLabel>
                      <ColorField value={draftConfig['itinerary.title.color'] ?? ''} onChange={(v) => setConfig('itinerary.title.color', v)} />
                    </div>
                  )}
                </div>
                {wedding?.templateId === 5 && (
                  <div>
                    <FieldLabel>Item Text Color</FieldLabel>
                    <ColorField value={draftConfig['itinerary.item.color'] ?? ''} onChange={(v) => setConfig('itinerary.item.color', v)} />
                  </div>
                )}
                <ItineraryEditor weddingId={weddingId!} onItemsChange={setItinerary} />
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Section Background</h3>
                <BgImageField configKey="section.ceremony.bg" label="Ceremony" value={draftConfig['section.ceremony.bg'] ?? ''} weddingId={weddingId!} onChange={(url) => setConfig('section.ceremony.bg', url)} />
              </section>

            </>}

            {/* ═══════════════ CELEBRATION TAB ═══════════════ */}
            {activeTab === 'celebration' && <>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wishes &amp; Guestbook</h3>
                <div>
                  <FieldLabel>Section Title</FieldLabel>
                  <TextField value={draftConfig['wish.title'] ?? ''} onChange={(v) => setConfig('wish.title', v)} maxLength={40} placeholder="Wishes &amp; Blessings" />
                </div>
                <div>
                  <FieldLabel>Wish Prompt</FieldLabel>
                  <TextField value={draftConfig['wish.prompt'] ?? ''} onChange={(v) => setConfig('wish.prompt', v)} maxLength={80} />
                  {wedding?.templateId === 5 && (
                    <div className="mt-2">
                      <FieldLabel>Prompt Color</FieldLabel>
                      <ColorField value={draftConfig['wish.prompt.color'] ?? ''} onChange={(v) => setConfig('wish.prompt.color', v)} />
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Photo Booth</h3>
                <div>
                  <FieldLabel>Section Title</FieldLabel>
                  <TextField value={draftConfig['photobooth.title'] ?? ''} onChange={(v) => setConfig('photobooth.title', v)} maxLength={40} placeholder="Photo Booth" />
                </div>
                <div>
                  <FieldLabel>Navigation Label</FieldLabel>
                  <TextField value={draftConfig['nav.photos'] ?? 'Photos'} onChange={(v) => setConfig('nav.photos', v)} maxLength={20} />
                </div>
              </section>

              {showPortraitSlots && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Portrait &amp; Gallery Slots</h3>
                  {wedding.templateId === 4 && (
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      <strong>Hero Background</strong> appears full-screen behind the couple&apos;s names.
                      The three <strong>Photo Booth</strong> cards are the first images guests see in the swipe stack.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {portraitSlots.map(({ slot, label }) => (
                      <PhotoDropZone key={slot} slot={slot} label={label}
                        photo={coupleMedia.find((m) => m.templateSlot === slot)}
                        uploading={uploadingSlot === slot}
                        onDrop={handlePhotoDrop} onRemove={handlePhotoRemove} />
                    ))}
                  </div>
                </section>
              )}

              {wedding?.templateId === 5 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section Headings</h3>
                  <p className="text-xs text-gray-400">Applies to Wishes &amp; Photo Booth headings</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Color</FieldLabel>
                      <ColorField value={draftConfig['section.heading.color'] ?? ''} onChange={(v) => setConfig('section.heading.color', v)} />
                    </div>
                    <div>
                      <FieldLabel>Shadow</FieldLabel>
                      <SelectField value={draftConfig['section.heading.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={(v) => setConfig('section.heading.shadow', v)} />
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Footer</h3>
                <div>
                  <FieldLabel>Footer Tagline</FieldLabel>
                  <TextField value={draftConfig['footer.tagline'] ?? ''} onChange={(v) => setConfig('footer.tagline', v)} maxLength={80} placeholder="Made with love for our special day" />
                </div>
                {wedding?.templateId === 5 && (
                  <div>
                    <FieldLabel>Color</FieldLabel>
                    <ColorField value={draftConfig['footer.tagline.color'] ?? ''} onChange={(v) => setConfig('footer.tagline.color', v)} />
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Section Background</h3>
                <BgImageField configKey="section.celebration.bg" label="Celebration" value={draftConfig['section.celebration.bg'] ?? ''} weddingId={weddingId!} onChange={(url) => setConfig('section.celebration.bg', url)} />
              </section>

            </>}

            {/* ═══════════════ MUSIC TAB ═══════════════ */}
            {activeTab === 'music' && (
              <MusicTab
                url={draftConfig['music.url'] ?? ''}
                loop={draftConfig['music.loop'] !== 'false'}
                weddingId={weddingId!}
                onUrlChange={(v) => setConfig('music.url', v)}
                onLoopChange={(v) => setConfig('music.loop', v ? 'true' : 'false')}
              />
            )}

          </div>
        </div>

        {/* RIGHT: Live preview — iframe with its own viewport */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-100">
          {/* Toolbar */}
          <div className="px-4 pt-2 pb-2 bg-gray-200 border-b border-gray-300 shrink-0 space-y-1.5">
            {/* Row 1: label + presets + reset */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium tracking-wide select-none">PREVIEW</span>
              <div className="flex items-center gap-1.5">
                {([
                  { label: 'Mobile',  w: 390,  h: 844  },
                  { label: 'Tablet',  w: 768,  h: 1024 },
                  { label: 'Desktop', w: 1440, h: 900  },
                ] as const).map(({ label, w, h }) => (
                  <button key={label}
                    onClick={() => { setPreviewWidth(w); setPreviewHeight(h); }}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${previewWidth === w && previewHeight === h ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
                {(previewWidth !== null || previewHeight !== null || zoom !== 1 || panX !== 0 || panY !== 0) && (
                  <button onClick={() => {
                    setPreviewWidth(null); setPreviewHeight(null);
                    setZoom(1); setPanX(0); setPanY(0);
                    viewRef.current = { zoom: 1, panX: 0, panY: 0 };
                  }} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5 bg-white shrink-0 ml-1">
                    Reset
                  </button>
                )}
              </div>
            </div>
            {/* Row 2: W + H sliders + zoom controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-medium text-gray-400 shrink-0">W</span>
                <input type="range" min={320} max={1440} value={effectiveW}
                  onChange={(e) => setPreviewWidth(Number(e.target.value))}
                  className="flex-1 min-w-0 accent-rose-500 cursor-pointer" />
                <input type="number" min={320} max={1440} value={effectiveW}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= 320 && v <= 1440) setPreviewWidth(v); }}
                  onBlur={(e) => { const v = Math.min(1440, Math.max(320, Number(e.target.value))); setPreviewWidth(v); }}
                  className="w-14 shrink-0 px-1.5 py-0.5 text-xs font-mono text-gray-700 bg-white border border-gray-300 rounded text-right focus:outline-none focus:border-rose-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-medium text-gray-400 shrink-0">H</span>
                <input type="range" min={480} max={1200} value={effectiveH}
                  onChange={(e) => setPreviewHeight(Number(e.target.value))}
                  className="flex-1 min-w-0 accent-rose-500 cursor-pointer" />
                <input type="number" min={480} max={1200} value={effectiveH}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= 480 && v <= 1200) setPreviewHeight(v); }}
                  onBlur={(e) => { const v = Math.min(1200, Math.max(480, Number(e.target.value))); setPreviewHeight(v); }}
                  className="w-14 shrink-0 px-1.5 py-0.5 text-xs font-mono text-gray-700 bg-white border border-gray-300 rounded text-right focus:outline-none focus:border-rose-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              {/* Zoom controls */}
              <div className="flex items-center gap-1 shrink-0 border-l border-gray-300 pl-2">
                <button
                  onClick={() => { const z = Math.max(0.1, Math.round((zoom - 0.25) * 100) / 100); setZoom(z); viewRef.current.zoom = z; }}
                  className="w-6 h-6 rounded text-gray-600 hover:bg-gray-300 flex items-center justify-center text-base leading-none">−</button>
                <span className="text-xs font-mono text-gray-600 tabular-nums w-10 text-center select-none">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => { const z = Math.min(4, Math.round((zoom + 0.25) * 100) / 100); setZoom(z); viewRef.current.zoom = z; }}
                  className="w-6 h-6 rounded text-gray-600 hover:bg-gray-300 flex items-center justify-center text-base leading-none">+</button>
              </div>
            </div>
          </div>

          {/* Canvas — zoom with scroll wheel, drag gray area to pan */}
          <div
            ref={panelRef}
            className={`flex-1 overflow-hidden bg-[#d1d5db] relative select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Content anchored to panel center, then panned + zoomed */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
              transformOrigin: 'center center',
            }}>
              {/* Device clip wrapper — sized to post-device-scale visual dimensions */}
              <div style={{
                width: displayW,
                height: displayH,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                borderRadius: 6,
              }}>
                <iframe
                  ref={iframeRef}
                  src="/couple-admin/preview"
                  title="Invitation Preview"
                  style={{
                    width: effectiveW,
                    height: effectiveH,
                    border: 'none',
                    display: 'block',
                    transform: scale !== 1 ? `scale(${scale})` : undefined,
                    transformOrigin: 'top left',
                    pointerEvents: isPanning ? 'none' : 'auto',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
