import { describe, expect, it } from "vitest";
import { paintMatrixCell } from "../shared/pixumi";
import { CHROMATIC_48_PALETTE } from "../shared/palettes";

describe("matrix color painting", () => {
  it("paints only the selected cell with a palette color", () => {
    const matrix = [["#000000", "#FFFFFF"], ["#FFFFFF", "#000000"]];
    const color = CHROMATIC_48_PALETTE.colors[10];
    const result = paintMatrixCell(matrix, 1, 0, color);
    expect(result[1][0]).toBe(color);
    expect(result[0]).toEqual(matrix[0]);
    expect(result[1][1]).toBe("#000000");
    expect(matrix[1][0]).toBe("#FFFFFF");
  });
});
