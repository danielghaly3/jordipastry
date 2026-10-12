import { Logo } from "@/components/brand/logo";
import { getPublicSettings } from "@/lib/data";

export async function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { branding } = await getPublicSettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-pink-tint px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[32px] bg-white p-7 shadow-lift md:p-9">
        <div className="flex justify-center">
          <Logo branding={branding} full />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
