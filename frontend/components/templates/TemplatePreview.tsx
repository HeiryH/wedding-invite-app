export function TemplatePreview({
  templateCode,
  thumbnailUrl,
  aspect,
  fit = 'cover',
}: {
  templateCode: string;
  thumbnailUrl?: string;
  /** CSS aspect-ratio, e.g. "390 / 700". When set, the box height is fixed and the
   *  image is cropped/fit to it instead of following the uploaded file's own ratio —
   *  keeps a row of cards the same height regardless of what a super-admin uploaded. */
  aspect?: string;
  fit?: 'cover' | 'contain';
}) {
  // Prefers a super-admin-set thumbnailUrl (persisted server-side, e.g. captured via the
  // screenshot tool) over the static build-time PNG in public/template-previews/.
  const src = thumbnailUrl && thumbnailUrl.trim() ? thumbnailUrl : `/template-previews/${templateCode}.png`;
  return (
    <div style={{ width: '100%', height: aspect ? '100%' : undefined, aspectRatio: aspect, lineHeight: 0, background: '#f3f4f6', overflow: 'hidden' }}>
      <img
        src={src}
        alt={templateCode}
        style={aspect
          ? { width: '100%', height: '100%', objectFit: fit, display: 'block' }
          : { width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
