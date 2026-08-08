export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-32 bg-surface-soft border border-hairline rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-surface-soft border border-hairline rounded-xl" />
        <div className="h-48 bg-surface-soft border border-hairline rounded-xl" />
      </div>
    </div>
  );
}
