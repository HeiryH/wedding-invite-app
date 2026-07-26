export const getImageUrl = (photoUrl: string): string => {
  // photoUrl comes like: /uploads/photos/abc.jpg
  // We need: http://localhost:5000/uploads/photos/abc.jpg
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  return `${baseUrl}${photoUrl}`;
};

// Triggers a browser save for a Blob fetched from the server (e.g. a generated export zip).
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}