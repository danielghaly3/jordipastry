export default function Loading() {
  return (
    <div className="mx-auto max-w-[1240px] animate-pulse px-5 pt-10 md:px-8 md:pt-14" aria-busy="true" aria-label="Loading">
      <div className="h-14 w-72 rounded-full bg-pink-tint" />
      <div className="mt-4 h-5 w-96 max-w-full rounded-full bg-pink-tint" />
      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-[28px] bg-white p-3 shadow-cloud">
            <div className="aspect-square rounded-[22px] bg-pink-tint" />
            <div className="mt-3 h-5 w-2/3 rounded-full bg-pink-tint" />
            <div className="mt-2 h-4 w-full rounded-full bg-cream" />
            <div className="mt-5 h-10 w-full rounded-full bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}
