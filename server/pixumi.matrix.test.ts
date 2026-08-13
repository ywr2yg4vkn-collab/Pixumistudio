import { describe, expect, it } from "vitest";
import { countMatrix, generateBeadMatrix, generateDeterministicDraftMatrix, validateProduction } from "../shared/pixumi";

describe("bead matrix generation", () => {
  it("converts an approved pixel grid into a production matrix", () => {
    const matrix = generateBeadMatrix({ grid: [["#111111", "#FFFFFF"], ["#FFFFFF", "#111111"]] });
    expect(matrix).toEqual([["#111111", "#FFFFFF"], ["#FFFFFF", "#111111"]]);
    expect(countMatrix(matrix!)).toMatchObject({ total: 4, width: 2, height: 2, physicalWidthMm: 5.2, physicalHeightMm: 5.2 });
    expect(validateProduction(matrix!, 2, 2).approved).toBe(true);
  });

  it("creates a deterministic draft matrix when an AI response has no grid", () => {
    const matrix = generateDeterministicDraftMatrix({ palette: ["#AA0000", "#00AA00"] }, "6 x 4 beads");
    expect(matrix).toHaveLength(4);
    expect(matrix[0]).toHaveLength(6);
    expect(validateProduction(matrix, 6, 4).approved).toBe(true);
    expect(new Set(matrix.flat())).toEqual(new Set(["#AA0000", "#00AA00"]));
  });

  it("rejects missing or ragged grids instead of inventing cells", () => {
    expect(generateBeadMatrix({ summary: "sem matriz" })).toBeNull();
    expect(generateBeadMatrix({ pixels: [["#111111"], ["#FFFFFF", "#111111"]] })).toBeNull();
  });
});
