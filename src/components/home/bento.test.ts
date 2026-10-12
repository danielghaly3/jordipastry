import { describe, expect, it } from "vitest";
import { bentoSpan } from "./sections";

// Simulates CSS grid auto-placement (dense enough for our row-major layout) and checks there are no holes.
function cells(n: number, cols: number, prefix: "sm" | "lg") {
  const grid: boolean[][] = [];
  const at = (r: number, c: number) => (grid[r] ??= Array(cols).fill(false))[c];
  const set = (r: number, c: number) => ((grid[r] ??= Array(cols).fill(false))[c] = true);
  let cursorR = 0, cursorC = 0;
  for (let i = 0; i < n; i++) {
    const cls = bentoSpan(i, n).split(" ");
    const cs = Number(cls.find((c) => c.startsWith(`${prefix}:col-span-`))?.split("-").pop() ?? 1);
    const rs = Number(cls.find((c) => c.startsWith(`${prefix}:row-span-`))?.split("-").pop() ?? 1);
    for (;;) {
      if (cursorC + cs <= cols && [...Array(rs)].every((_, dr) => [...Array(cs)].every((_, dc) => !at(cursorR + dr, cursorC + dc)))) break;
      cursorC++;
      if (cursorC >= cols) { cursorC = 0; cursorR++; }
    }
    for (let dr = 0; dr < rs; dr++) for (let dc = 0; dc < cs; dc++) set(cursorR + dr, cursorC + dc);
  }
  return grid;
}

describe("bentoSpan", () => {
  for (let n = 1; n <= 12; n++) {
    it(`${n} tiles leave no empty cell`, () => {
      expect(cells(n, 4, "lg").flat().every(Boolean)).toBe(true);
      expect(cells(n, 2, "sm").flat().every(Boolean)).toBe(true);
    });
  }
});
