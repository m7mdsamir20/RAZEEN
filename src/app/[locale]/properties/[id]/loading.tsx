export default function PropertyDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        <div>
          {/* Gallery */}
          <div className="aspect-[16/10] bg-gray-200 rounded-2xl" />
          <div className="flex gap-2 mt-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-5">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
          </div>

          {/* Title */}
          <div className="h-8 w-3/4 bg-gray-200 rounded mt-3" />
          <div className="h-4 w-1/2 bg-gray-200 rounded mt-3" />

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>

          {/* Description */}
          <div className="mt-6 space-y-2">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="h-56 bg-gray-100 border border-gray-200 rounded-2xl" />
          <div className="h-36 bg-gray-100 border border-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
