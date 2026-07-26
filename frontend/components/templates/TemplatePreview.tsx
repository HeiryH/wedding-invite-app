export function TemplatePreview({ templateCode, thumbnailUrl }: { templateCode: string; thumbnailUrl?: string }) {
  // Prefers a super-admin-uploaded thumbnailUrl (persisted server-side) over the static
  // build-time PNG in public/template-previews/.
  const src = thumbnailUrl && thumbnailUrl.trim() ? thumbnailUrl : `/template-previews/${templateCode}.png`;
  return (
    <div style={{ width: '100%', lineHeight: 0, background: '#f3f4f6' }}>
      <img
        src={src}
        alt={templateCode}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
