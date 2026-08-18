export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-gray-200" />

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="h-6 w-32 bg-gray-200 rounded mb-2" />

        {/* Title */}
        <div className="h-4 w-full bg-gray-200 rounded mb-2" />

        {/* Location */}
        <div className="h-4 w-40 bg-gray-200 rounded mb-3" />

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
