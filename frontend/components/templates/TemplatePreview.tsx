export function TemplatePreview({ templateCode }: { templateCode: string }) {
  return (
    <div style={{ width: '100%', lineHeight: 0, background: '#f3f4f6' }}>
      <img
        src={`/template-previews/${templateCode}.png`}
        alt={templateCode}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
