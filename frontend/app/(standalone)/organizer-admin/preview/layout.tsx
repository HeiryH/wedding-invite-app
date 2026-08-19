export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body { overflow-x: clip; max-width: 100%; }
      `}</style>
      {children}
    </>
  );
}
