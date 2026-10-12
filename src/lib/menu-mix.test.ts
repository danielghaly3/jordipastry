import { describe, expect, it } from "vitest";
import { spreadAcrossMenu } from "./menu-mix";

describe("spreadAcrossMenu", () => {
  it("alternates categories and keeps every item once, in order within each category", () => {
    const items = [
      { id: "d1", category_id: "donuts" }, { id: "d2", category_id: "donuts" }, { id: "d3", category_id: "donuts" },
      { id: "r1", category_id: "rolls" }, { id: "c1", category_id: "cookies" }, { id: "x1", category_id: null },
    ];
    expect(spreadAcrossMenu(items).map((i) => i.id)).toEqual(["d1", "r1", "c1", "x1", "d2", "d3"]);
  });
});
