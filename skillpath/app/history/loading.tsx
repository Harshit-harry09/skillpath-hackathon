export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink pt-20 px-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-surface-soft rounded-lg" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-soft border border-hairline rounded-xl" />
        ))}
      </div>
    </div>
  );
}
