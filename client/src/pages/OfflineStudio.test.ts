import { describe, expect, it } from "vitest";
import { CHROMATIC_48_COLORS } from "@shared/palettes";
import { countsFor, nearestColor, STAGES } from "./OfflineStudio";

describe("offline studio processing", () => {
  it("maps a pixel to the fixed 48-color palette", () => {
    expect(CHROMATIC_48_COLORS).toContain(nearestColor(230, 30, 55));
    expect(CHROMATIC_48_COLORS).toContain(nearestColor(12, 12, 12));
  });

  it("keeps the complete nine-stage production line", () => {
    expect(STAGES).toHaveLength(9);
    expect(STAGES[0]?.[1]).toBe("Análise");
    expect(STAGES[1]?.[1]).toBe("Matriz");
    expect(STAGES[8]?.[1]).toBe("Controle final");
  });

  it("counts every bead in the local matrix", () => {
    const counts = countsFor([["#000000", "#FFFFFF"], ["#000000", "#E31B3B"]]);
    expect(counts).toEqual([["#000000", 2], ["#FFFFFF", 1], ["#E31B3B", 1]]);
    expect(counts.reduce((total, [, count]) => total + count, 0)).toBe(4);
  });
});
