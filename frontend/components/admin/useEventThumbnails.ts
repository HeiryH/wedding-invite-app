import { useEffect, useState } from 'react';
import { templateService } from '@/lib/api';

export function useEventThumbnails() {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    // Include inactive templates because existing events can still use them.
    templateService.getAll().then((templates) => {
      if (!active) return;
      setThumbnails(Object.fromEntries(templates.map((template) => [template.templateId, template.thumbnailUrl])));
    }).catch(() => {
      // The cards can still use their bundled thumbnails if the catalog is unavailable.
    });
    return () => { active = false; };
  }, []);

  return thumbnails;
}
