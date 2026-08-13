import { describe, expect, it } from "vitest";
import { buildStage2VisualFallback } from "./routers";
import type { VisualAnalysis } from "./visualAnalysis";

describe("stage 02 visual fallback integration", () => {
  it("persists the visual matrix and analysis metadata in the final agent output", () => {
    const analysis: VisualAnalysis = {
      sourceWidth: 120,
      sourceHeight: 80,
      aspectRatio: 1.5,
      targetWidth: 12,
      targetHeight: 8,
      dominantPalette: ["#111111", "#EEEEEE"],
      matrix: Array.from({ length: 8 }, () => Array.from({ length: 12 }, (_, column) => column % 2 ? "#EEEEEE" : "#111111")),
    };
    const output = buildStage2VisualFallback({ summary: "Matriz visual" }, analysis, "12 x 8 beads");
    expect(output.matrix).toEqual(analysis.matrix);
    expect(output.matrixDraft).toBe(true);
    expect(output.decision).toBe("REVISÃO NECESSÁRIA");
    expect(output.visualAnalysis).toMatchObject({ sourceWidth: 120, sourceHeight: 80, aspectRatio: 1.5, method: "content-aware-pixel-resampling" });
    expect(output.width).toBe(12);
    expect(output.height).toBe(8);
  });
});
