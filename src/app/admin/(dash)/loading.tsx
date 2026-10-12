export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-56 rounded-full bg-line" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 rounded-[20px] bg-white ring-1 ring-line" />)}
      </div>
      <div className="h-64 rounded-[20px] bg-white ring-1 ring-line" />
    </div>
  );
}
