import React from 'react';

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
}

export function DefaultPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LoadingSkeleton className="h-32 w-full rounded-xl" />
        <LoadingSkeleton className="h-32 w-full rounded-xl" />
        <LoadingSkeleton className="h-32 w-full rounded-xl" />
      </div>
      <LoadingSkeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
