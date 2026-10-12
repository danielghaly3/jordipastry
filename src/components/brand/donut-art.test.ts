import { describe, expect, it } from "vitest";
import { donutImage } from "./donut-art";

describe("donutImage", () => {
  it.each([
    ["Boston Cream", "/images/donuts/boston-cream.webp"],
    ["Strawberry Sprinkle", "/images/donuts/strawberry.webp"],
    ["Lotus Caramel", "/images/donuts/caramel.webp"],
    ["Classic Pistachio Roll", "/images/menu/cinnamon-roll.webp"],
    ["Large Cookie Tart", "/images/menu/cookie-tart.webp"],
    ["Red Velvet Cookie", "/images/menu/cookies.webp"],
    ["White Chocolate Donut", "/images/donuts/vanilla.webp"],
    ["Dark Chocolate Donut", "/images/donuts/chocolate.webp"],
    ["Blueberry Donut", "/images/donuts/lavender.webp"],
    ["Pistachio Donut", "/images/donuts/pistachio.webp"],
  ])("maps %s to its matching image", (name, expected) => {
    expect(donutImage(name)).toBe(expected);
  });

  it("chooses a stable vanilla image for an unknown name", () => {
    const first = donutImage("Mystery Cloud");
    expect(first).toMatch(/^\/images\/donuts\/vanilla(?:-sprinkles)?\.webp$/);
    expect(donutImage("Mystery Cloud")).toBe(first);
  });
});
