/** Resolve uploaded media without corrupting external/CDN, blob or static-asset URLs. */
export const getImageUrl = (photoUrl: string, baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || ''): string => {
  if (/^(https?:|data:|blob:|\/\/)/i.test(photoUrl)) return photoUrl;
  return photoUrl.startsWith('/uploads/') ? `${baseUrl.replace(/\/$/, '')}${photoUrl}` : photoUrl;
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
