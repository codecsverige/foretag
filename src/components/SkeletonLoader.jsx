import React from "react";

export const RideCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </div>

    {/* Route skeleton */}
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
    </div>

    {/* Details skeleton */}
    <div className="flex items-center gap-6 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>

    {/* Action button skeleton */}
    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
  </div>
);

export const RideGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <RideCardSkeleton key={index} />
    ))}
  </div>
);

export const FiltersSkeleton = () => (
  <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b shadow-sm animate-pulse">
    <div className="max-w-7xl mx-auto flex flex-col gap-3 p-4">
      {/* Search bar skeleton */}
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      
      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-28"></div>
      </div>
    </div>
  </div>
);

export default {
  RideCardSkeleton,
  RideGridSkeleton,
  FiltersSkeleton
};