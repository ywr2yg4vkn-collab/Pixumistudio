import { describe, expect, it } from "vitest";
import { Jimp } from "jimp";
import { analyzeReferenceImage, applyVisualAnalysisToOutput } from "./visualAnalysis";

describe("visual reference analysis", () => {
  it("extracts dimensions, proportion, palette and a target grid", async () => {
    const image = new Jimp({ width: 4, height: 2, color: 0xff0000ff });
    image.setPixelColor(0x00ff00ff, 0, 0);
    image.setPixelColor(0x00ff00ff, 1, 0);
    const buffer = await image.getBuffer("image/png");
    const result = await analyzeReferenceImage(buffer, "8 x 4 beads");
    expect(result.sourceWidth).toBe(4);
    expect(result.sourceHeight).toBe(2);
    expect(result.aspectRatio).toBe(2);
    expect(result.targetWidth).toBeGreaterThanOrEqual(8);
    expect(result.targetHeight).toBeGreaterThanOrEqual(4);
    expect(result.targetWidth / result.targetHeight).toBe(2);
    expect(result.minimumRecommendedLongSide).toBeGreaterThanOrEqual(24);
    expect(result.matrix).toHaveLength(result.targetHeight);
    expect(result.matrix[0]).toHaveLength(result.targetWidth);
    expect(result.dominantPalette.length).toBeGreaterThan(0);
    expect(new Set(result.matrix.flat()).size).toBeGreaterThan(1);
    const output = applyVisualAnalysisToOutput({ summary: "Matriz preliminar" }, result);
    expect(output.matrix).toEqual(result.matrix);
    expect(output.visualAnalysis).toMatchObject({ sourceWidth: 4, sourceHeight: 2, method: "content-aware-pixel-resampling" });
    expect(output.matrixDraft).toBe(true);
  });

  it("raises the minimum grid for visually complex references", async () => {
    const flat = new Jimp({ width: 48, height: 48, color: 0xffffffff });
    const detailed = new Jimp({ width: 48, height: 48, color: 0xffffffff });
    for (let y = 0; y < 48; y += 2) for (let x = 0; x < 48; x += 2) detailed.setPixelColor((x + y) % 4 === 0 ? 0x111111ff : 0xe31b3bff, x, y);
    const flatResult = await analyzeReferenceImage(await flat.getBuffer("image/png"));
    const detailedResult = await analyzeReferenceImage(await detailed.getBuffer("image/png"));
    expect(detailedResult.minimumRecommendedLongSide).toBeGreaterThanOrEqual(flatResult.minimumRecommendedLongSide);
    expect(detailedResult.complexityScore).toBeGreaterThan(0);
  });

  it("uses product-family minimums in addition to visual complexity", async () => {
    const image = new Jimp({ width: 64, height: 48, color: 0xff9eabff });
    const buffer = await image.getBuffer("image/png");
    const keychain = await analyzeReferenceImage(buffer, undefined, undefined, "keychain-single");
    const miniature = await analyzeReferenceImage(buffer, undefined, undefined, "miniature-medium");
    const figure = await analyzeReferenceImage(buffer, undefined, undefined, "figure-large");
    expect(miniature.minimumRecommendedLongSide).toBeGreaterThanOrEqual(keychain.minimumRecommendedLongSide);
    expect(figure.minimumRecommendedLongSide).toBeGreaterThanOrEqual(miniature.minimumRecommendedLongSide);
  });

  it("crops a small foreground form instead of letting a large background erase it", async () => {
    const image = new Jimp({ width: 20, height: 20, color: 0xffffffff });
    for (let y = 7; y < 13; y++) for (let x = 8; x < 12; x++) image.setPixelColor(0x222222ff, x, y);
    const buffer = await image.getBuffer("image/png");
    const result = await analyzeReferenceImage(buffer, "12 x 12 beads");
    expect(result.contentBounds).toBeDefined();
    expect(new Set(result.matrix.flat()).size).toBeGreaterThan(1);
    expect(result.matrix.flat().filter(color => color === "#202020").length).toBeGreaterThan(0);
  });
});
