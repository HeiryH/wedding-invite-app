'use client';
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './CinematicAdjustPanel.module.css';

export default function CinematicRichText({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useEditor({ extensions: [StarterKit], content: value, immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    editorProps: { attributes: { 'aria-label': 'Narrative body', role: 'textbox', 'aria-multiline': 'true' } },
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(editor.isEmpty && !value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  return <div className={styles.narrativeEditor}>
    <div className={styles.sceneSetActions}>
      <button type="button" aria-label="Bold narrative text" aria-pressed={editor?.isActive('bold') ?? false} onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
      <button type="button" aria-label="Italic narrative text" aria-pressed={editor?.isActive('italic') ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
      <button type="button" aria-label="Narrative bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()}>List</button>
    </div><EditorContent editor={editor} />
  </div>;
}
