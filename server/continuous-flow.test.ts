import { describe, expect, it } from "vitest";
import { countMatrix, generateBeadMatrix, nextVersion, recalculateMatrixOutput } from "../shared/pixumi";

const productionStages = ["reference", "matrix", "direction", "pixel-art-final", "production", "mockups", "final-document"] as const;

describe("continuous production flow", () => {
  it("keeps the matrix as the second artifact and derives every later artifact from it", () => {
    expect(productionStages[0]).toBe("reference");
    expect(productionStages[1]).toBe("matrix");
    expect(productionStages.indexOf("matrix")).toBeLessThan(productionStages.indexOf("pixel-art-final"));
    expect(productionStages.indexOf("pixel-art-final")).toBeLessThan(productionStages.indexOf("production"));
    expect(productionStages.indexOf("production")).toBeLessThan(productionStages.indexOf("final-document"));
  });

  it("recalculates dimensions and quantities after a manual cell edit", () => {
    const before = [["#111111", "#111111"], ["#EEEEEE", "#111111"]];
    const edited = before.map(row => [...row]);
    edited[1][0] = "#111111";
    const matrix = generateBeadMatrix({ matrix: edited });
    expect(matrix).toEqual(edited);
    const recalculated = recalculateMatrixOutput({ summary: "manual" }, matrix!);
    expect(recalculated.matrixEdited).toBe(true);
    expect(recalculated.matrixSourceStage).toBe(2);
    const metrics = countMatrix(matrix!);
    expect(metrics.width).toBe(2);
    expect(metrics.height).toBe(2);
    expect(metrics.total).toBe(4);
    expect(metrics.byColor["#111111"]).toBe(4);
    expect(metrics.physicalWidthMm).toBe(5.2);
    expect(metrics.physicalHeightMm).toBe(5.2);
    expect(nextVersion("01.0", false)).toBe("01.1");
  });
});
