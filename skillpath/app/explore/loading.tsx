export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-8">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <div className="h-4 w-40 bg-surface-soft rounded animate-pulse" />
    </div>
  );
}
