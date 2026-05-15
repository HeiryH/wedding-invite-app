export const getImageUrl = (photoUrl: string): string => {
  // photoUrl comes like: /uploads/photos/abc.jpg
  // We need: http://localhost:5000/uploads/photos/abc.jpg
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  return `${baseUrl}${photoUrl}`;
};