export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-surface-soft rounded-lg mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <div className="h-64 bg-surface-soft border border-hairline rounded-2xl" />
        <div className="h-64 bg-surface-soft border border-hairline rounded-2xl" />
      </div>
    </div>
  );
}
