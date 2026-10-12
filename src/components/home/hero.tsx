"use client";
import Link from "next/link";
import Image from "next/image";
import { Fragment, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, Sparkle } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";
import { LogoMark } from "@/components/brand/logo";
import { Doodles } from "@/components/brand/ribbon";
import { Sprinkles } from "@/components/home/sprinkles";
import { btn } from "@/components/ui/button";

type Donut = { name: string; flavor: string | null; image: string | null };

function Floating({ donut, className, depth, x, y, sizes, preload }: {
  donut: Donut; className: string; depth: number; x: ReturnType<typeof useSpring>; y: ReturnType<typeof useSpring>; sizes: string; preload?: boolean;
}) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <motion.div style={{ x: tx, y: ty }} className={`absolute ${className}`}>
      <div className="h-full w-full animate-float [animation-delay:var(--d,0s)]">
        {donut.image ? (
          <span className="relative block h-full w-full overflow-hidden rounded-full shadow-lift">
            <Image src={donut.image} alt={donut.name} fill sizes={sizes} preload={preload} className="object-cover" />
          </span>
        ) : (
          <DonutArt name={donut.name} flavor={donut.flavor} className="h-full w-full" preload={preload} />
        )}
      </div>
    </motion.div>
  );
}

/** Slowly turning stamp with the brand tagline wrapped around the logo mark. */
function TaglineBadge({ text }: { text: string }) {
  const label = `${text.replace(/[.,!]+/g, "").toUpperCase()} • `;
  return (
    <div className="absolute -bottom-2 -left-1 z-10 grid h-[26%] w-[26%] min-w-[96px] max-w-[140px] place-items-center rounded-full bg-white shadow-lift md:bottom-[2%] md:left-[-2%]" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_22s_linear_infinite]">
        <defs><path id="tagline-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" /></defs>
        <text className="fill-pink-ink font-sans text-[8.4px] font-bold tracking-[0.18em]">
          <textPath href="#tagline-circle" textLength="228">{label}</textPath>
        </text>
      </svg>
      <LogoMark className="h-[42%] w-[42%]" />
    </div>
  );
}

export function Hero({ headline, description, ctaPrimary, ctaSecondary, heroImage, donuts, tagline }: {
  headline: string; description: string; ctaPrimary: string; ctaSecondary: string; heroImage: string; donuts: Donut[]; tagline: string;
}) {
  const reduce = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  // Scroll-linked: the pink sky slowly turns and drifts as the visitor scrolls past.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const skyRotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const artY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 120, damping: 20 });
  const y = useSpring(my, { stiffness: 120, damping: 20 });
  const main: Donut = heroImage ? { name: headline, flavor: null, image: heroImage } : donuts[0] ?? { name: "Classic", flavor: "strawberry", image: null };
  const others = donuts.slice(heroImage ? 0 : 1, (heroImage ? 0 : 1) + 3);
  while (others.length < 3) others.push({ name: ["Glazed", "Chocolate", "Pistachio"][others.length], flavor: ["vanilla", "chocolate", "pistachio"][others.length], image: null });

  // Highlight the last word of the headline in brand pink
  const words = headline.trim().split(" ");
  const last = words.pop();

  return (
    <section
      ref={section}
      className="relative overflow-hidden"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 30);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 30);
      }}
    >
      <Doodles />
      {/* soft swoosh behind the copy */}
      <div className="absolute -left-40 -top-24 h-[620px] w-[760px] rounded-full bg-pink-tint" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-6 px-5 pb-10 pt-10 md:px-8 lg:min-h-[calc(100dvh-180px)] lg:grid-cols-[1.05fr_1fr] lg:pb-16 lg:pt-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="font-display text-[clamp(2.1rem,5.4vw,4.1rem)] font-bold leading-[1.1] tracking-[-0.02em] text-cocoa">
            {[...words, last].map((w, i) => (
              <Fragment key={i}>
              <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
                <motion.span
                  className={`inline-block ${i === words.length ? "text-pink-ink" : ""}`}
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.75, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                >
                  {w}
                </motion.span>
              </span>
              {i < words.length && " "}
              </Fragment>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-md text-lg leading-relaxed text-cocoa-muted md:text-xl"
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/menu" className={btn("primary", "lg")}>
              {ctaPrimary} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/#flavors" className={btn("secondary", "lg")}>{ctaSecondary}</Link>
          </motion.div>
        </div>

        {/* The pink sky: decoration only, no text on it */}
        <motion.div style={{ y: artY }} className="relative mx-auto aspect-square w-full max-w-[560px] motion-reduce:transform-none!">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotate: skyRotate }}
            className="absolute inset-[6%] rounded-full bg-pink motion-reduce:transform-none!"
            aria-hidden="true"
          >
            <Sprinkles count={16} seed={11} className="overflow-hidden rounded-full" />
          </motion.div>
          <div className="absolute left-1/2 top-[13%] h-[7%] w-[44%] -translate-x-1/2 animate-float-slow" aria-hidden="true">
            <div className="h-full w-full rounded-[50%] border-[5px] border-accent md:border-[6px]" />
            {[["-left-[14%] -top-[60%] h-[70%]", "0s"], ["-right-[10%] -top-[90%] h-[95%]", "-1.1s"], ["right-[30%] -top-[160%] h-[55%]", "-2.3s"]].map(([pos, delay]) => (
              <Sparkle key={pos} className={`absolute aspect-square w-auto animate-twinkle fill-accent text-accent ${pos}`} style={{ animationDelay: delay }} strokeWidth={1} />
            ))}
          </div>
          <TaglineBadge text={tagline} />
          <Floating donut={main} depth={0.6} x={x} y={y} sizes="(max-width: 1024px) 60vw, 330px" preload className="left-[21%] top-[22%] h-[58%] w-[58%]" />
          <Floating donut={others[0]} depth={1.4} x={x} y={y} sizes="140px" className="left-0 top-[8%] h-[24%] w-[24%] [--d:-2s]" />
          <Floating donut={others[1]} depth={1.1} x={x} y={y} sizes="160px" className="bottom-[2%] right-[2%] h-[28%] w-[28%] [--d:-4s]" />
          <Floating donut={others[2]} depth={1.8} x={x} y={y} sizes="110px" className="bottom-[30%] left-[-2%] h-[16%] w-[16%] [--d:-1s]" />
        </motion.div>
      </div>
    </section>
  );
}
