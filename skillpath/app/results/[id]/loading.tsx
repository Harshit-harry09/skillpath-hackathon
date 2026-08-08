export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-surface-soft rounded-md" />
        <div className="h-10 w-96 bg-surface-soft rounded-lg" />
        <div className="h-4 w-64 bg-surface-soft rounded-md" />
      </div>

      {/* Metric Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-soft border border-hairline rounded-xl p-4 space-y-2">
            <div className="h-4 w-20 bg-surface-card rounded" />
            <div className="h-8 w-16 bg-surface-card rounded" />
          </div>
        ))}
      </div>

      {/* Main card list skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 bg-surface-soft border border-hairline rounded-xl p-6" />
        ))}
      </div>
    </div>
  );
}
