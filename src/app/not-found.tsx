import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { btn } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-5 text-center text-cocoa">
      <div>
        <Mascot pose="searching" className="mx-auto h-40 w-40 md:h-[200px] md:w-[200px]" />
        <h1 className="mt-6 font-display text-5xl font-bold">Oops, this page rolled away</h1>
        <p className="mt-3 text-lg text-cocoa-muted">The page you were looking for doesn&apos;t exist, or the link is no longer valid.</p>
        <Link href="/" className={btn("primary", "lg", "mt-8")}>Back to the bakery</Link>
      </div>
    </main>
  );
}
