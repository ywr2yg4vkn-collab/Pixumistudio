import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeReferenceImage } from "./visualAnalysis";
import { resolveReferenceAssetUrl } from "./routers";

describe("real reference reconstruction", () => {
  it("preserves recognizable non-background structure from a real uploaded reference", async () => {
    const fixturePath = path.resolve(process.cwd(), "server/fixtures/reference-real.jpg");
    const buffer = await fs.readFile(fixturePath);
    const result = await analyzeReferenceImage(buffer, "32 x 40 beads");
    expect(result.sourceWidth).toBe(991);
    expect(result.sourceHeight).toBe(1200);
    expect(new Set(result.matrix.flat()).size).toBeGreaterThanOrEqual(3);
    expect(result.matrix.flat().filter(color => color !== result.dominantPalette[0]).length).toBeGreaterThan(20);
  });

  it("does not pass a relative storage path to fetch or vision APIs", async () => {
    await expect(resolveReferenceAssetUrl({ referenceUrl: "/manus-storage/projects/example.jpg" })).resolves.toBeNull();
    await expect(resolveReferenceAssetUrl({ referenceUrl: "https://example.com/reference.jpg" })).resolves.toBe("https://example.com/reference.jpg");
  });
});
