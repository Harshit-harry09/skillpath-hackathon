export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-surface-soft rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-surface-soft border border-hairline rounded-xl" />
        <div className="h-64 bg-surface-soft border border-hairline rounded-xl" />
        <div className="h-64 bg-surface-soft border border-hairline rounded-xl" />
      </div>
    </div>
  );
}
