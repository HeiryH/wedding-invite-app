export default function PhotoSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}