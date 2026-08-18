import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";

export default function PropertiesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-72 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filters */}
        <div className="h-14 lg:h-[520px] bg-gray-100 rounded-2xl animate-pulse" />

        {/* Results */}
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
