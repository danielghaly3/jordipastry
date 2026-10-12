import Image from "next/image";

export type MascotPose = "hello" | "empty-box" | "searching" | "celebrate" | "sleeping";

export function Mascot({ pose, className }: { pose: MascotPose; className?: string }) {
  return (
    <span className={`relative block animate-float-slow ${className ?? ""}`}>
      <Image
        src={`/images/mascot/${pose}.webp`}
        alt=""
        fill
        sizes="200px"
        loading="eager"
        className="object-contain drop-shadow-[0_14px_18px_rgba(75,41,37,0.22)]"
      />
    </span>
  );
}
