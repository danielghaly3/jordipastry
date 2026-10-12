"use client";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useCartBarShown } from "@/components/store/mobile-cart-bar";
import { SprinkleBurst } from "@/components/order/celebrate";

// "Back to top" as a little angel donut (the brand's winged, haloed mark). It hovers in the corner,
// its glaze fills as you scroll, and tapping it flies it off the top of the screen as the page follows.

const SPRINKLES: [number, string][] = [
  [20, "#F7D154"], [65, "#A9D8F2"], [110, "#FFFFFF"], [155, "#B7E4A1"],
  [200, "#F7D154"], [245, "#D9B6E8"], [290, "#FFFFFF"], [335, "#A9D8F2"],
];
// Angel wing (left side; the right is mirrored): a smooth upswept leading edge, then rounded,
// layered feather tips stepping back to the root, plus two inner feather lines.
const WING = "M34 45 C 27 33, 15 24, 2 19 Q -1 27, 6 31 Q 0 35, 7 39 Q 3 44, 12 45 Q 10 51, 19 50 Q 20 55, 27 52 Q 31 54, 34 49 Z";
const FEATHERS = ["M31 45 C 24 38, 15 33, 7 30", "M31 48 C 25 45, 18 43, 11 41"];

const flap = {
  idle: { rotate: [0, -22, 0], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const } },
  hover: { rotate: [0, -32, 0], transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" as const } },
  fly: { rotate: [0, -38, 0], transition: { duration: 0.18, repeat: Infinity, ease: "easeInOut" as const } },
  still: { rotate: 0 },
};
const body = {
  idle: { y: [0, -6, 0], scale: 1, transition: { y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const } } },
  hover: { y: -4, scale: 1.06 },
  fly: () => ({ y: -(window.innerHeight + 240), transition: { duration: 0.9, ease: [0.5, 0, 0.75, 0] as const } }),
  still: { y: 0, scale: 1 },
};

function Wing({ side }: { side: "left" | "right" }) {
  return (
    <g transform={side === "right" ? "translate(100 0) scale(-1 1)" : undefined}>
      <motion.g variants={flap} style={{ transformOrigin: "33px 47px", transformBox: "view-box" }}>
        <path d={WING} fill="white" stroke="var(--pink-soft)" strokeWidth="1.5" strokeLinejoin="round" />
        {FEATHERS.map((d) => <path key={d} d={d} fill="none" stroke="var(--pink-soft)" strokeWidth="1.2" strokeLinecap="round" />)}
      </motion.g>
    </g>
  );
}

function AngelDonut({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const lifted = useCartBarShown();
  const [flying, setFlying] = useState(false);
  const { scrollY } = useScroll();
  // If the visitor scrolls back down mid-flight, bring the donut back instead of leaving it off-screen.
  useMotionValueEvent(scrollY, "change", (y) => { if (flying && y > (scrollY.getPrevious() ?? 0)) setFlying(false); });

  const goUp = () => {
    if (!reduce) setFlying(true);
    window.scrollTo({ top: 0 }); // follows the page's CSS scroll-behavior (instant for reduced motion)
  };

  return (
    <motion.div
      className={`fixed right-3 z-30 transition-[bottom] duration-300 md:bottom-6 md:right-6 ${lifted ? "bottom-[88px]" : "bottom-4"}`}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={flying ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, y: 60 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {flying && <span className="pointer-events-none absolute left-1/2 top-1/2"><SprinkleBurst count={12} distance={56} /></span>}
      <motion.button
        type="button"
        onClick={goUp}
        aria-label="Back to top"
        className="group relative block h-[76px] w-[96px] focus-visible:outline-none"
        initial={false}
        animate={reduce ? "still" : flying ? "fly" : "idle"}
        whileHover={reduce || flying ? undefined : "hover"}
        whileTap={reduce || flying ? undefined : { scale: 0.94 }}
        variants={body}
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-1 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-pink-ink opacity-0 shadow-cloud ring-1 ring-line transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:block" aria-hidden="true">
          Fly me up!
        </span>
        <svg viewBox="0 0 100 80" className="h-full w-full overflow-visible drop-shadow-[0_8px_12px_rgba(168,82,78,0.35)]" aria-hidden="true">
          <Wing side="left" />
          <Wing side="right" />
          {/* halo */}
          <motion.ellipse cx="50" cy="9" rx="15" ry="4.2" fill="none" stroke="#E2A86F" strokeWidth="3" variants={{ idle: { y: [0, -3, 0], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }, hover: { y: -3 }, fly: { y: -6 }, still: { y: 0 } }} />
          {/* dough, then glaze that fills with scroll progress */}
          <circle cx="50" cy="46" r="21" fill="none" stroke="#E9B98A" strokeWidth="15" />
          <motion.circle cx="50" cy="46" r="21" fill="none" stroke="var(--pink)" strokeWidth="11" strokeLinecap="round" transform="rotate(-90 50 46)" style={{ pathLength: progress }} />
          {SPRINKLES.map(([deg, color]) => (
            <rect key={deg} x="48.5" y="22" width="3" height="6.5" rx="1.5" fill={color} transform={`rotate(${deg} 50 46)`} />
          ))}
          <circle cx="50" cy="46" r="13" fill="white" />
        </svg>
        <ArrowUp className="absolute left-1/2 top-[57.5%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-pink-ink" strokeWidth={2.75} aria-hidden="true" />
        <span className="pointer-events-none absolute inset-2 rounded-full ring-pink-ink group-focus-visible:ring-2" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}

export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 600));
  // Each appearance mounts a fresh donut, so a finished flight never replays.
  return <AnimatePresence>{show && <AngelDonut progress={scrollYProgress} />}</AnimatePresence>;
}
