import { describe, expect, it } from "vitest";
import { composeProductMatrix, getProductPreset, PRODUCT_PRESETS } from "../shared/productCatalog";

describe("product catalog", () => {
  it("exposes the requested clickable product presets", () => {
    expect(PRODUCT_PRESETS.map(preset => preset.id)).toEqual(expect.arrayContaining([
      "keychain-single", "keychain-pair", "frame-small", "frame-a4", "frame-a3", "miniature-small", "miniature-medium", "miniature-large", "figure-medium", "figure-large",
    ]));
  });

  it("adds a base to the same matrix for miniature and figure presets", () => {
    const matrix = [["#000000", "#FFFFFF"], ["#FFFFFF", "#000000"]];
    const composed = composeProductMatrix(matrix, "miniature-medium");
    expect(composed.length).toBeGreaterThan(matrix.length);
    expect(composed.slice(matrix.length).flat()).toContain("#E6D2B5");
    expect(composeProductMatrix(matrix, "keychain-single")).toEqual(matrix);
    expect(getProductPreset("unknown").id).toBe("keychain-single");
  });
});
