"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type Transition } from "motion/react";
import { Check } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";

// Vertical illustrated timeline (idea from an order-tracking reference, drawn in the Jordi menu-board style):
// cocoa line-art, rose + blush fills, rose-gold accents. The step at the middle of the screen is "active" and keeps
// looping its little story; passed steps rest on their finished picture; upcoming steps wait.

const INK = "var(--cocoa)";
const ROSE = "var(--pink)";
const BLUSH = "var(--pink-soft)";
const GOLD = "var(--accent)";
const line = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ease = [0.16, 1, 0.3, 1] as const;

type StepState = "idle" | "active" | "done";
type ArtProps = { s: StepState };

/** Looping transition while a step is active; a short settle otherwise. */
const loop = (s: StepState, duration: number, delay = 0, repeatDelay = 0.5): Transition =>
  s === "active" ? { duration, delay, repeat: Infinity, repeatDelay, ease: "easeInOut" } : { duration: 0.45, ease };
/** Pick keyframes for the active loop, the finished pose, or the waiting pose. */
const pose = <T,>(s: StepState, active: T, done: T, idle: T) => (s === "active" ? active : s === "done" ? done : idle);

function ReceiptArt({ s }: ArtProps) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <motion.g animate={pose(s, { y: [46, 0, 0] }, { y: 0 }, { y: 46 })} transition={loop(s, 2, 0, 0.4)}>
        <path d="M56 22h48v58l-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4z" fill="white" {...line} />
        {[34, 44, 54].map((y, i) => <path key={y} d={`M64 ${y}h${[32, 24, 28][i]}`} stroke={BLUSH} strokeWidth="4" strokeLinecap="round" />)}
        <path d="M64 66h14" stroke={ROSE} strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <rect x="40" y="76" width="80" height="26" rx="8" fill={BLUSH} {...line} />
      <path d="M50 84h60" {...line} />
      <motion.path
        d="M118 18c-4-6-14-3-12 4 1 5 12 11 12 11s11-6 12-11c2-7-8-10-12-4z"
        fill={ROSE}
        style={{ transformOrigin: "118px 24px" }}
        animate={pose(s, { scale: [0, 1.25, 1, 1.15, 1], opacity: 1 }, { scale: 1, opacity: 1 }, { scale: 0, opacity: 0 })}
        transition={loop(s, 1.4, 0.3, 0.9)}
      />
    </svg>
  );
}

function PhoneArt({ s }: ArtProps) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <rect x="58" y="10" width="46" height="96" rx="10" fill="white" {...line} />
      <path d="M74 18h14" {...line} />
      <motion.circle cx="81" cy="58" r="16" fill={BLUSH} style={{ transformOrigin: "81px 58px" }}
        animate={pose(s, { scale: [0.7, 1.12, 1] }, { scale: 1 }, { scale: 0.7 })} transition={loop(s, 0.8, 1, 1.4)} />
      <motion.path d="M73 58l6 6 11-12" fill="none" stroke={ROSE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        animate={pose(s, { pathLength: [0, 1, 1] }, { pathLength: 1 }, { pathLength: 0 })} transition={loop(s, 1.4, 0.8, 0.8)} />
      <path d="M68 88h26" stroke={BLUSH} strokeWidth="4" strokeLinecap="round" />
      {/* the coin keeps dropping in while this step is active */}
      <motion.g animate={pose(s, { x: [16, 0, -24], y: [-34, 0, 10], opacity: [0, 1, 0] }, { x: 0, y: 0, opacity: 0 }, { x: 0, y: 0, opacity: 0 })} transition={loop(s, 1.2, 0, 1)}>
        <circle cx="112" cy="46" r="11" fill={GOLD} {...line} strokeWidth={2.5} />
        <text x="112" y="50" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">E£</text>
      </motion.g>
    </svg>
  );
}

function BoxArt({ s }: ArtProps) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      <motion.ellipse cx="80" cy="16" rx="18" ry="5" fill="none" stroke={GOLD} strokeWidth="3.5"
        animate={pose(s, { y: [0, -6, 0], opacity: 1 }, { y: 0, opacity: 1 }, { y: -24, opacity: 0 })} transition={loop(s, 1.6, 0, 0)} />
      <rect x="38" y="52" width="84" height="54" rx="6" fill={ROSE} {...line} />
      <rect x="32" y="40" width="96" height="16" rx="5" fill={BLUSH} {...line} />
      <path d="M74 40v66M86 40v66" stroke="white" strokeWidth="5" />
      <path d="M74 40v66M86 40v66" {...line} strokeWidth={2} />
      <text x="80" y="88" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill="white" fontFamily="var(--font-cormorant), Georgia, serif">JORDI</text>
      {/* the bow keeps tying itself */}
      {["M80 40c-6-12-24-14-24-4 0 8 16 6 24 4z", "M80 40c6-12 24-14 24-4 0 8-16 6-24 4z"].map((d, i) => (
        <motion.path key={d} d={d} fill="white" {...line}
          animate={pose(s, { pathLength: [0, 1, 1], fillOpacity: [0, 1, 1] }, { pathLength: 1, fillOpacity: 1 }, { pathLength: 0, fillOpacity: 0 })}
          transition={loop(s, 1.6, i * 0.3, 0.6)} />
      ))}
      <motion.circle cx="80" cy="40" r="4" fill={ROSE} {...line} strokeWidth={2} style={{ transformOrigin: "80px 40px" }}
        animate={pose(s, { scale: [0, 0, 1.3, 1] }, { scale: 1 }, { scale: 0 })} transition={loop(s, 1.6, 0.3, 0.6)} />
    </svg>
  );
}

/** Step 4: the JORDI box gets angel wings and glides along the route to a heart pin at the customer's home. */
function FlyingBoxArt({ s }: ArtProps) {
  const route = "M14 104C40 104 46 80 70 78S110 84 128 60";
  const flap = (dir: 1 | -1, origin: string) => ({
    style: { transformOrigin: origin },
    animate: pose(s, { rotate: [0, -28 * dir, 0] }, { rotate: -8 * dir }, { rotate: 0 }),
    transition: s === "active" ? { duration: 0.36, repeat: Infinity, ease: "easeInOut" as const } : { duration: 0.4 },
  });
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      {/* drifting clouds */}
      {[[18, 28, 0], [104, 18, 1.2]].map(([x, y, d]) => (
        <motion.path key={x} d={`M${x} ${y}a7 7 0 0 1 12-5 9 9 0 0 1 16 3 6 6 0 0 1 0 12H${x + 2}a6 6 0 0 1-2-10z`} fill="white" stroke={INK} strokeWidth="2"
          animate={pose(s, { x: [0, -10, 0] }, { x: 0 }, { x: 0 })} transition={loop(s, 4, d, 0)} />
      ))}
      {/* the route: dashes march forward while this step is active */}
      <motion.path d={route} fill="none" stroke={ROSE} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7"
        animate={s === "active" ? { strokeDashoffset: [0, -18], opacity: 1 } : { strokeDashoffset: 0, opacity: s === "done" ? 1 : 0.35 }}
        transition={s === "active" ? { duration: 0.6, repeat: Infinity, ease: "linear" } : { duration: 0.4 }} />
      {/* home + heart pin */}
      <path d="M118 104v-14l12-10 12 10v14z" fill="white" {...line} strokeWidth={2.5} />
      <path d="M127 104v-7h6v7" {...line} strokeWidth={2.5} />
      <motion.circle cx="130" cy="56" r="9" fill={ROSE} style={{ transformOrigin: "130px 56px" }}
        animate={pose(s, { scale: [1, 2.2], opacity: [0.35, 0] }, { scale: 1, opacity: 0 }, { scale: 1, opacity: 0 })}
        transition={loop(s, 1.2, 1.2, 1.2)} />
      <path d="M130 66c-6-6-12-10-12-16a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 6-6 10-12 16z" fill={ROSE} {...line} strokeWidth={2.5} />
      {/* the winged box flies the route (fades at the ends so the loop is seamless) */}
      <motion.g
        animate={pose(s,
          { x: [-50, -6, 38], y: [40, 18, -6], rotate: [-8, 4, -2], opacity: [0, 1, 1, 0] },
          { x: 14, y: 30, rotate: 0, opacity: 1 },
          { x: -50, y: 40, rotate: 0, opacity: 0.4 })}
        transition={s === "active" ? { duration: 2.4, repeat: Infinity, repeatDelay: 0.2, ease: "easeInOut" } : { duration: 0.6, ease }}
      >
        {/* sprinkle trail */}
        <motion.g animate={pose(s, { opacity: [0, 1, 0], x: [0, -6] }, { opacity: 0, x: 0 }, { opacity: 0, x: 0 })} transition={loop(s, 0.8, 0, 0)}>
          <rect x="44" y="52" width="7" height="2.5" rx="1.25" fill={GOLD} transform="rotate(-20 47 53)" />
          <rect x="40" y="60" width="7" height="2.5" rx="1.25" fill={BLUSH} transform="rotate(25 43 61)" />
        </motion.g>
        {/* wings */}
        <motion.path d="M58 52c-10-2-16-8-16-15 5 4 11 5 16 5M58 57c-8 0-13-4-15-9 5 3 10 3 15 3" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" {...flap(1, "58px 54px")} />
        <motion.path d="M90 52c10-2 16-8 16-15-5 4-11 5-16 5M90 57c8 0 13-4 15-9-5 3-10 3-15 3" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" {...flap(-1, "90px 54px")} />
        {/* box */}
        <rect x="58" y="46" width="32" height="22" rx="4" fill={ROSE} {...line} strokeWidth={2.5} />
        <rect x="55" y="41" width="38" height="8" rx="3" fill={BLUSH} {...line} strokeWidth={2.5} />
        <path d="M74 41v27" stroke="white" strokeWidth="3.5" />
        <ellipse cx="74" cy="34" rx="9" ry="2.6" fill="none" stroke={GOLD} strokeWidth="2.5" />
      </motion.g>
    </svg>
  );
}

function OpenBoxArt({ s }: ArtProps) {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden="true">
      {/* hearts keep floating up from the open box */}
      {[[62, 0], [84, 0.5], [104, 1]].map(([x, d]) => (
        <motion.path
          key={x}
          d={`M${x} 36c-3-4-10-2-8 3 1 3 8 7 8 7s7-4 8-7c2-5-5-7-8-3z`}
          fill={x === 84 ? ROSE : BLUSH}
          stroke={INK}
          strokeWidth="1.5"
          animate={pose(s, { y: [20, -14], opacity: [0, 1, 0] }, { y: 4, opacity: x === 84 ? 1 : 0 }, { y: 20, opacity: 0 })}
          transition={s === "active" ? { duration: 2.2, delay: d, repeat: Infinity, repeatDelay: 0.3 } : { duration: 0.4 }}
        />
      ))}
      <motion.g animate={pose(s, { y: [2, -4, 2] }, { y: 0 }, { y: 18 })} transition={loop(s, 1.4, 0, 0)}>
        <circle cx="80" cy="58" r="18" fill="#e9b47a" {...line} />
        <path d="M64 54c4-8 12-12 20-11 6 0 12 4 14 10-6 4-10 2-16 6-6 2-12 0-18-5z" fill={BLUSH} />
        <circle cx="80" cy="58" r="6" fill="white" {...line} strokeWidth={2.5} />
      </motion.g>
      <rect x="38" y="62" width="84" height="44" rx="6" fill={ROSE} {...line} />
      <path d="M80 62v44" stroke="white" strokeWidth="5" />
      <motion.path d="M38 62l-14-22 30-2z" fill={BLUSH} {...line} style={{ transformOrigin: "38px 62px" }}
        animate={pose(s, { rotate: [0, -8, 0] }, { rotate: 0 }, { rotate: 40 })} transition={loop(s, 1.4, 0, 0)} />
      <motion.path d="M122 62l14-22-30-2z" fill={BLUSH} {...line} style={{ transformOrigin: "122px 62px" }}
        animate={pose(s, { rotate: [0, 8, 0] }, { rotate: 0 }, { rotate: -40 })} transition={loop(s, 1.4, 0.2, 0)} />
    </svg>
  );
}

type Step = { title: string; text: string; Art: (p: ArtProps) => React.ReactElement };

function TimelineStep({ step, index, last, state, refCb }: { step: Step; index: number; last: boolean; state: StepState; refCb: (el: HTMLLIElement | null) => void }) {
  const flip = index % 2 === 1;
  const reached = state !== "idle";
  return (
    <li ref={refCb} className={`relative grid grid-cols-[56px_1fr] gap-x-4 md:grid-cols-[1fr_72px_1fr] md:gap-x-6 ${last ? "" : "pb-14 md:pb-16"}`} aria-current={state === "active" ? "step" : undefined}>
      {/* number -> check; the active step gets a pulsing ring */}
      <span className="relative z-10 col-start-1 row-span-2 flex justify-center md:col-start-2 md:row-span-1 md:row-start-1 md:items-center">
        <span className="relative block h-12 w-12 md:h-14 md:w-14">
          {state === "active" && (
            <motion.span
              className="absolute inset-0 rounded-full bg-pink"
              initial={false}
              animate={{ scale: [1, 1.7, 1], opacity: 0.5 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}
          <motion.span
            className="relative grid h-12 w-12 place-items-center rounded-full font-display text-lg font-bold md:h-14 md:w-14"
            animate={reached ? { backgroundColor: "var(--pink)", color: "#ffffff" } : { backgroundColor: "#ffffff", color: "var(--cocoa-muted)" }}
            transition={{ duration: 0.4 }}
            style={{ boxShadow: "0 0 0 2px var(--pink-soft)" }}
          >
            {reached ? (
              <Check className="h-6 w-6" strokeWidth={3} />
            ) : index + 1}
          </motion.span>
        </span>
      </span>
      {/* illustration tile */}
      <motion.div
        animate={{ opacity: reached ? 1 : 0.55, y: reached ? 0 : 16, rotate: flip ? 2 : -2, scale: state === "active" ? 1.04 : 1 }}
        transition={{ duration: 0.5, ease }}
        className={`col-start-2 row-start-1 aspect-[4/3] w-full max-w-[260px] rounded-[28px] p-3 transition-[background-color,box-shadow] duration-500 ${state === "active" ? "bg-white shadow-lift ring-2 ring-pink-soft" : "bg-pink-tint ring-1 ring-line"} ${flip ? "md:col-start-3 md:justify-self-start" : "md:col-start-1 md:justify-self-end"}`}
      >
        <step.Art s={state} />
      </motion.div>
      {/* words */}
      <motion.div
        animate={{ opacity: reached ? 1 : 0.85, x: 0 }} // upcoming steps stay readable (contrast)
        transition={{ duration: 0.5, ease }}
        className={`col-start-2 row-start-2 mt-4 md:row-start-1 md:mt-0 md:self-center ${flip ? "md:col-start-1 md:text-right" : "md:col-start-3"}`}
      >
        <h3 className={`font-display text-2xl font-bold transition-colors duration-300 md:text-3xl ${state === "active" ? "text-pink-ink" : ""}`}>{step.title}</h3>
        <p className={`mt-2 max-w-xs text-cocoa-muted ${flip ? "md:ml-auto" : ""}`}>{step.text}</p>
      </motion.div>
    </li>
  );
}

export function OrderTimeline({ instapay, delivery, pickup }: { instapay: boolean; delivery: boolean; pickup: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  const stepEls = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReducedMotion();
  const visible = useInView(ref, { amount: 0.05 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const donutTop = useTransform(progress, (v) => `calc(24px + (100% - 48px) * ${v.toFixed(4)})`);

  // Active step = the last step whose top has passed the middle of the screen.
  const [active, setActive] = useState(-1);
  const update = () => {
    const mid = window.innerHeight * 0.55;
    let a = -1;
    stepEls.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top < mid) a = i; });
    setActive(a);
  };
  useMotionValueEvent(scrollYProgress, "change", update);
  useEffect(() => {
    const id = requestAnimationFrame(update); // initial position (e.g. reload mid-page)
    return () => cancelAnimationFrame(id);
  }, []);

  const steps: Step[] = [
    { title: "Order placed", text: "Your order lands with us the moment you tap Place order. No account needed.", Art: ReceiptArt },
    instapay
      ? { title: "Payment confirmed", text: "Send with InstaPay, tap “I've Sent the Payment”, and we confirm it.", Art: PhoneArt }
      : { title: "Pay on arrival", text: "Pay in cash when your order arrives.", Art: PhoneArt },
    { title: "Baked & boxed", text: "Freshly made and boxed up just for you.", Art: BoxArt },
    ...(delivery ? [{ title: "On the way", text: pickup ? "Out for delivery to your door, or ready for you to pick up." : "Out for delivery to your door.", Art: FlyingBoxArt }] : []),
    { title: "Enjoy!", text: "Open the box and enjoy every bite. Follow each step on your private order page.", Art: OpenBoxArt },
  ];

  // Off-screen or reduced motion: nothing loops (the active step shows its finished picture).
  const stateOf = (i: number): StepState => (i < active ? "done" : i === active ? (visible && !reduce ? "active" : "done") : "idle");

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-24" aria-labelledby="how-title">
      <div className="mx-auto max-w-[1000px] px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-title" className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.015em]">How Ordering Works</h2>
          <p className="mt-3 font-[family-name:var(--font-script)] text-3xl text-pink-ink">From our oven to your hands</p>
        </div>
        <ol ref={ref} className="relative mt-14">
          {/* the path: dashed blush line, filled in rose as you scroll */}
          <span className="absolute bottom-6 left-[27px] top-6 w-0 border-l-[3px] border-dashed border-pink-soft md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
          <motion.span className="absolute bottom-6 left-[26px] top-6 w-[5px] origin-top rounded-full bg-pink md:left-1/2 md:-translate-x-1/2 motion-reduce:hidden" style={{ scaleY: progress }} aria-hidden="true" />
          {/* the traveling donut */}
          <motion.span
            className="pointer-events-none absolute left-[28px] z-20 -translate-x-1/2 -translate-y-1/2 md:left-1/2 motion-reduce:hidden"
            style={{ top: donutTop }}
            aria-hidden="true"
          >
            <span className="absolute -top-3 left-1/2 h-2 w-7 -translate-x-1/2 rounded-[50%] border-2 border-accent" />
            <DonutArt name="Strawberry Donut" flavor="strawberry" title="" className="h-11 w-11" />
          </motion.span>
          {steps.map((s, i) => (
            <TimelineStep key={s.title} step={s} index={i} last={i === steps.length - 1} state={stateOf(i)} refCb={(el) => { stepEls.current[i] = el; }} />
          ))}
        </ol>
      </div>
    </section>
  );
}
