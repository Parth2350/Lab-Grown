export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 h-9 w-56 bg-sand/70" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 border border-line bg-white" />
        ))}
      </div>
      <div className="h-[420px] border border-line bg-white" />
    </div>
  );
}
