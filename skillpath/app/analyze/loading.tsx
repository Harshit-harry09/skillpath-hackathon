export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-72 bg-surface-soft rounded-lg mx-auto" />
      <div className="h-64 bg-surface-soft border border-hairline rounded-2xl" />
    </div>
  );
}
