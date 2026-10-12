import Image from "next/image";

// photo: a full-frame brand photo (rolls, cookies, tart) rather than a transparent donut cutout.
type Look = { image: string; glaze: string; photo?: boolean };

// Order matters: first match wins. Non-donut menu items come first so "Pistachio Roll" is a roll, not a donut.
const LOOKS: [RegExp, Look][] = [
  [/\broll\b|cinnabon|cinnamon roll/i, { image: "/images/menu/cinnamon-roll.webp", glaze: "#e8d2b0", photo: true }],
  [/tart/i, { image: "/images/menu/cookie-tart.webp", glaze: "#6b3b2a", photo: true }],
  [/cookie/i, { image: "/images/menu/cookies.webp", glaze: "#c9935b", photo: true }],
  [/boston|custard|cream filled/i, { image: "/images/donuts/boston-cream.webp", glaze: "#5a2e22" }],
  [/jam|jelly|filled/i, { image: "/images/donuts/jam-filled.webp", glaze: "#fbe9de" }],
  [/red velvet/i, { image: "/images/donuts/red-velvet.webp", glaze: "#b3263e" }],
  [/white choc|coconut|vanilla|glazed/i, { image: "/images/donuts/vanilla.webp", glaze: "#fbe3c4" }],
  [/raffaello/i, { image: "/images/donuts/vanilla-sprinkles.webp", glaze: "#fbe3c4" }],
  [/choc|cocoa|fudge|brownie|nutella|ferrero|kinder|oreo/i, { image: "/images/donuts/chocolate.webp", glaze: "#5a2e22" }],
  [/strawberr|raspberr|cherry|pink/i, { image: "/images/donuts/strawberry.webp", glaze: "#f48cb8" }],
  [/pistach|matcha|mint/i, { image: "/images/donuts/pistachio.webp", glaze: "#a8c97f" }],
  [/caramel|lotus|biscoff|cinnamon|honey|toffee/i, { image: "/images/donuts/caramel.webp", glaze: "#d99a4e" }],
  [/blue|lavender|ube|taro/i, { image: "/images/donuts/lavender.webp", glaze: "#a9b1f2" }],
  [/lemon|mango|banana/i, { image: "/images/donuts/lemon.webp", glaze: "#f7d154" }],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function donutLook(key: string): Look {
  return LOOKS.find(([re]) => re.test(key))?.[1]
    ?? { image: `/images/donuts/${hash(key) % 2 === 0 ? "vanilla-sprinkles" : "vanilla"}.webp`, glaze: "#fbe3c4" };
}

export function donutImage(name: string, flavor?: string | null) {
  return donutLook(`${flavor ?? ""} ${name}`).image;
}

/** True when the fallback is a full-frame photo (fill the frame) instead of a cutout (float it). */
export function isPhotoLook(name: string, flavor?: string | null) {
  return Boolean(donutLook(`${flavor ?? ""} ${name}`).photo);
}

export function glazeTint(name: string, flavor?: string | null, opacity = 0.14) {
  const hex = donutLook(`${flavor ?? ""} ${name}`).glaze;
  const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function DonutArt({ name, flavor, className, title, preload }: {
  name: string;
  flavor?: string | null;
  className?: string;
  title?: string;
  preload?: boolean;
}) {
  const photo = isPhotoLook(name, flavor);
  return (
    // Photos are shown as round "plates" so they sit naturally where donut cutouts float.
    <span className={`${className?.includes("absolute") ? "" : "relative"} block ${photo ? "overflow-hidden rounded-full shadow-cloud" : ""} ${className ?? ""}`}>
      <Image
        src={donutImage(name, flavor)}
        alt={title === "" ? "" : name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        preload={preload}
        className={photo ? "object-cover" : "object-contain drop-shadow-[0_14px_18px_rgba(75,41,37,0.22)]"}
      />
    </span>
  );
}
