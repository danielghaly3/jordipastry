export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[72ch] px-5 pt-10 md:pt-14 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight">{title}</h1>
      <p className="text-sm text-cocoa-muted">Last updated {updated}</p>
      {children}
    </article>
  );
}
