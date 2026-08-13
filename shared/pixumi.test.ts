import { describe, expect, it } from "vitest";
import { countMatrix, nextVersion, validateProduction } from "./pixumi";

describe("Pixumi domain rules", () => {
  it("counts beads by color and converts dimensions using 2.6mm", () => {
    const result = countMatrix([["#000", "#fff"], ["#000", "#000"]]);
    expect(result.total).toBe(4);
    expect(result.byColor["#000"]).toBe(3);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.physicalWidthMm).toBe(5.2);
    expect(result.physicalHeightMm).toBe(5.2);
  });

  it("rejects malformed matrices", () => {
    const result = validateProduction([["#000"], ["#000", "#fff"]]);
    expect(result.approved).toBe(false);
    expect(result.issues[0]).toContain("larguras diferentes");
  });

  it("preserves the requested version format", () => {
    expect(nextVersion("01.0")).toBe("01.1");
    expect(nextVersion("01.1")).toBe("01.2");
    expect(nextVersion("01.1", true)).toBe("02.0");
  });
});
