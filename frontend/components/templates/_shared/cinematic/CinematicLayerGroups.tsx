'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { EditorActions } from './EditorActions';
import type { Breakpoint } from '../types';
import type { CinematicLayerGroup, CinematicSceneSet } from './sceneSets';
import { nextSceneSetId, type SceneSetAction } from './sceneSetEditing';
import type { CinematicWorldLayer } from './world';
import styles from './CinematicAdjustPanel.module.css';

export default function CinematicLayerGroups({ set, breakpoint, layers, onAction, selectedId, onSelect, renderRows, seekForMembers, renderHeader, expanded, onExpand }: {
  set: CinematicSceneSet;
  breakpoint: Breakpoint;
  layers: CinematicWorldLayer[];
  onAction: (action: SceneSetAction) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  renderRows: (ids: string[], nested: boolean, checkbox?: (id: string, label: string) => ReactNode) => ReactNode;
  renderHeader: (actions?: ReactNode) => ReactNode;
  expanded: boolean;
  onExpand: () => void;
  seekForMembers: (ids: string[]) => (() => void) | undefined;
}) {
  const [draft, setDraft] = useState<CinematicLayerGroup>();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const groups = set.layerGroups?.[breakpoint] ?? [];
  const eligible = layers.filter((layer) => !layer.parentId && layer.space === set.space);
  const available = eligible.filter((layer) => !groups.some((group) =>
    group.id !== draft?.id && group.memberIds.includes(layer.id)));
  const selected = available.filter((layer) => draft?.memberIds.includes(layer.id)).map((layer) => layer.id);
  const checkbox = draft && !set.locked ? (id: string, label: string) => available.some((layer) => layer.id === id) && (
    <input type="checkbox" className={styles.layerCheck} checked={selected.includes(id)}
      aria-label={`Include ${label} in group`} onChange={(event) => setDraft({
        ...draft,
        memberIds: event.target.checked ? [...selected, id] : selected.filter((memberId) => memberId !== id),
      })} />
  ) : undefined;

  return (
    <>
      {renderHeader(available.length >= 2 && !set.locked && <EditorActions label={`Actions for ${set.label}`}>
        <button type="button" disabled={Boolean(draft)} onClick={(event) => {
          setDraft({ id: '', label: '', memberIds: [] });
          onExpand();
          const menu = event.currentTarget.closest('details');
          if (menu) menu.open = false;
        }}>New group</button>
      </EditorActions>)}
      {expanded && <>
        {draft && !set.locked && (
          <form className={styles.sceneSetForm} onSubmit={(event) => {
            event.preventDefault();
            if (!draft.label.trim() || selected.length < 2) return;
            const id = draft.id || nextSceneSetId(draft.label, groups.map((group) => group.id));
            onAction({ type: 'save-layer-group', id: set.id, breakpoint, group: {
              ...draft, id, memberIds: selected,
            } });
            setDraft(undefined);
            onSelect(id);
          }}>
            <label>Group name<input className={styles.field} value={draft.label} required maxLength={64}
              onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></label>
            <p className={styles.note}>Select at least two layers below. {selected.length} selected.</p>
            <div className={styles.sceneSetActions}>
              <button type="submit" disabled={!draft.label.trim() || selected.length < 2}>
                {draft.id ? 'Save group' : 'Group selected'}
              </button>
              <button type="button" onClick={() => setDraft(undefined)}>Cancel</button>
            </div>
          </form>
        )}
        {groups.map((group) => {
          const onSeek = seekForMembers(group.memberIds);
          const count = eligible.filter((layer) => group.memberIds.includes(layer.id)).length;
          const expanded = draft?.id === group.id || !collapsed.includes(group.id);
          return (
            <div key={group.id}>
              <div className={`${styles.layerRow} ${selectedId === group.id ? styles.layerRowActive : ''}`}>
                <button type="button" className={`${styles.iconButton} ${styles.layerDisclosure}`}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.label}`} aria-expanded={expanded} disabled={draft?.id === group.id}
                  onClick={() => setCollapsed((current) => expanded ? [...current, group.id] : current.filter((id) => id !== group.id))}>
                  <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={18} />
                </button>
                <button type="button" className={styles.layerName} aria-pressed={selectedId === group.id}
                  onClick={() => onSelect(group.id)}>
                  {group.label}
                  <small>Group · {count} {count === 1 ? 'layer' : 'layers'}</small>
                </button>
                {onSeek && <button type="button" className={styles.iconButton}
                  aria-label={`Seek to ${group.label}`} title="Go to appearance" onClick={onSeek}>
                  <Icon name="crosshair" size={15} />
                </button>}
                <button type="button" className={styles.iconButton} disabled={set.locked}
                  aria-label={`${group.hidden ? 'Show' : 'Hide'} ${group.label}`}
                  onClick={() => onAction({ type: 'patch-layer-group', id: set.id, breakpoint, groupId: group.id,
                    patch: { hidden: !group.hidden } })}>
                  {group.hidden ? '○' : '●'}
                </button>
                {!set.locked && <EditorActions label={`Actions for ${group.label}`}>
                  <button type="button" onClick={(event) => {
                    setDraft(group);
                    const menu = event.currentTarget.closest('details');
                    if (menu) menu.open = false;
                  }}>Edit group</button>
                  <button type="button" onClick={() => {
                    onAction({ type: 'remove-layer-group', id: set.id, breakpoint, groupId: group.id });
                    setCollapsed((current) => current.filter((id) => id !== group.id));
                    if (draft?.id === group.id) setDraft(undefined);
                  }}>Ungroup</button>
                </EditorActions>}
              </div>
              {expanded && renderRows(group.memberIds, true, checkbox)}
            </div>
          );
        })}
        {renderRows(groups.flatMap((group) => group.memberIds), false, checkbox)}

      </>}
    </>
  );
}
