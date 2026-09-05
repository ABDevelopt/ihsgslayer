"use client";

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="w-24 h-7 bg-slate-800 rounded-lg" />
          <div className="w-40 h-4 bg-slate-850 rounded" />
        </div>
        <div className="w-20 h-6 bg-slate-800 rounded-lg" />
      </div>

      <div className="space-y-2 p-3.5 bg-slate-900/60 rounded-xl">
        <div className="w-full h-3.5 bg-slate-800 rounded" />
        <div className="w-3/4 h-3.5 bg-slate-800 rounded" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="h-14 bg-slate-800/80 rounded-xl" />
        <div className="h-14 bg-slate-800/80 rounded-xl" />
        <div className="h-14 bg-slate-800/80 rounded-xl" />
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <div className="w-20 h-4 bg-slate-800 rounded" />
        <div className="w-28 h-8 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}
