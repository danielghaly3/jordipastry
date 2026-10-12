export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-pink-ink px-4 py-2 text-center text-sm font-semibold text-white" role="region" aria-label="Announcement">
      {text}
    </div>
  );
}
