import { describe, expect, it } from "vitest";
import { Jimp } from "jimp";
import { analyzeReferenceImage, constrainMatrixToPalette } from "./visualAnalysis";
import { CHROMATIC_48_COLORS, CHROMATIC_48_PALETTE, DEFAULT_BEAD_PALETTE_ID, getBeadPalette } from "../shared/palettes";

describe("fixed chromatic bead palette", () => {
  it("exposes exactly 48 unique colors in the fixed palette", () => {
    expect(CHROMATIC_48_COLORS).toHaveLength(48);
    expect(new Set(CHROMATIC_48_COLORS).size).toBe(48);
    expect(CHROMATIC_48_PALETTE.colors).toEqual([...CHROMATIC_48_COLORS]);
    expect(getBeadPalette(DEFAULT_BEAD_PALETTE_ID).id).toBe("chromatic-48");
    expect(getBeadPalette("legacy-96").colors).toHaveLength(48);
  });

  it("maps generated cells only to the fixed chromatic colors", async () => {
    const image = new Jimp({ width: 8, height: 8, color: 0xff0000ff });
    image.setPixelColor(0x00ff00ff, 4, 4);
    const buffer = await image.getBuffer("image/png");
    const selected = ["#000000", "#FFFFFF"];
    const result = await analyzeReferenceImage(buffer, "8 x 8 beads", selected);
    expect(new Set(result.matrix.flat()).size).toBeGreaterThan(0);
    expect(result.matrix.flat().every(color => selected.includes(color))).toBe(true);
    expect(constrainMatrixToPalette([["#FF0000", "#00FF00"]], selected).flat().every(color => selected.includes(color))).toBe(true);
  });
});
