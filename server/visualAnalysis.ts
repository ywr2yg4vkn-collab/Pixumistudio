import { Jimp, intToRGBA } from "jimp";
import { getProductPreset } from "../shared/productCatalog";

export type VisualAnalysis = {
  sourceWidth: number;
  sourceHeight: number;
  aspectRatio: number;
  targetWidth: number;
  targetHeight: number;
  minimumRecommendedLongSide: number;
  complexityScore: number;
  dominantPalette: string[];
  matrix: string[][];
  contentBounds?: { x: number; y: number; width: number; height: number };
};

function parseTargetSize(desiredSize: string | null | undefined, sourceWidth: number, sourceHeight: number, complexityScore: number, productPresetId?: string | null) {
  const requested = String(desiredSize || "").match(/(\d{1,3})\s*[x×]\s*(\d{1,3})/i);
  const familyMinimums: Record<string, number> = { keychain: 24, frame: 40, miniature: 48, figure: 56 };
  const productMinimum = familyMinimums[getProductPreset(productPresetId).family] || 24;
  const minimumLongSide = Math.min(96, Math.max(productMinimum, Math.round(24 + complexityScore * 40)));
  if (requested) {
    let width = Math.min(96, Math.max(4, Number(requested[1])));
    let height = Math.min(96, Math.max(4, Number(requested[2])));
    const longSide = Math.max(width, height);
    if (longSide < minimumLongSide) { const scale = minimumLongSide / longSide; width = Math.min(96, Math.max(4, Math.round(width * scale))); height = Math.min(96, Math.max(4, Math.round(height * scale))); }
    return { width, height, minimumRecommendedLongSide: minimumLongSide };
  }
  const longSide = minimumLongSide;
  if (sourceWidth >= sourceHeight) return { width: longSide, height: Math.max(4, Math.round(longSide * sourceHeight / sourceWidth)), minimumRecommendedLongSide: minimumLongSide };
  return { width: Math.max(4, Math.round(longSide * sourceWidth / sourceHeight)), height: longSide, minimumRecommendedLongSide: minimumLongSide };
}

function colorHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function distance(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function hsl(rgb: [number, number, number]) {
  const values = rgb.map(channel => channel / 255);
  const max = Math.max(...values); const min = Math.min(...values); const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === values[0]) hue = 60 * (((values[1] - values[2]) / delta) % 6);
    else if (max === values[1]) hue = 60 * ((values[2] - values[0]) / delta + 2);
    else hue = 60 * ((values[0] - values[1]) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { hue, saturation, lightness };
}

/** CIE-like perceptual weighting in HSL: hue wraps at 360 degrees. */
function paletteDistance(a: [number, number, number], b: [number, number, number]) {
  const first = hsl(a); const second = hsl(b);
  const hueDelta = Math.min(Math.abs(first.hue - second.hue), 360 - Math.abs(first.hue - second.hue)) / 180;
  const saturationDelta = first.saturation - second.saturation;
  const lightnessDelta = first.lightness - second.lightness;
  const neutralWeight = Math.max(first.saturation, second.saturation) < 0.12 ? 1.7 : 1;
  return Math.sqrt((hueDelta * Math.max(first.saturation, second.saturation) * 1.4) ** 2 + (saturationDelta * 0.8) ** 2 + (lightnessDelta * 1.6) ** 2) * neutralWeight;
}

type ImageLike = { bitmap: { width: number; height: number }; getPixelColor: (x: number, y: number) => number };

function pixelRgb(image: ImageLike, x: number, y: number): [number, number, number, number] {
  const color = intToRGBA(image.getPixelColor(x, y));
  return [color.r, color.g, color.b, color.a];
}

function detectContentBounds(image: ImageLike) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const corners = [[0, 0], [Math.max(0, width - 1), 0], [0, Math.max(0, height - 1)], [Math.max(0, width - 1), Math.max(0, height - 1)]];
  const cornerRgb: [number, number, number][] = corners.map(([x, y]) => pixelRgb(image, x, y).slice(0, 3) as [number, number, number]);
  const background: [number, number, number] = [
    cornerRgb.reduce((sum, color) => sum + color[0], 0) / cornerRgb.length,
    cornerRgb.reduce((sum, color) => sum + color[1], 0) / cornerRgb.length,
    cornerRgb.reduce((sum, color) => sum + color[2], 0) / cornerRgb.length,
  ];
  const threshold = 38;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelRgb(image, x, y);
      const foreground = a >= 32 && distance([r, g, b], background) > threshold;
      if (foreground) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const contentArea = contentWidth * contentHeight;
  if (contentArea < width * height * 0.015 || contentArea > width * height * 0.96) return null;
  const margin = Math.max(1, Math.round(Math.max(contentWidth, contentHeight) * 0.06));
  minX = Math.max(0, minX - margin); minY = Math.max(0, minY - margin); maxX = Math.min(width - 1, maxX + margin); maxY = Math.min(height - 1, maxY + margin);
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function estimateComplexity(image: ImageLike) {
  const width = image.bitmap.width; const height = image.bitmap.height; const step = Math.max(1, Math.floor(Math.max(width, height) / 64));
  const colors = new Set<string>(); let samples = 0; let edges = 0;
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const current = pixelRgb(image, x, y).slice(0, 3) as [number, number, number]; colors.add(current.map(channel => Math.round(channel / 32)).join(",")); samples++;
    if (x + step < width && y + step < height) { const right = pixelRgb(image, x + step, y).slice(0, 3) as [number, number, number]; const down = pixelRgb(image, x, y + step).slice(0, 3) as [number, number, number]; if (distance(current, right) > 42 || distance(current, down) > 42) edges++; }
  }
  const edgeDensity = samples ? edges / samples : 0; const colorDiversity = Math.min(1, colors.size / 32); return Math.min(1, edgeDensity * 1.7 + colorDiversity * 0.55);
}

function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)];
}

export async function analyzeReferenceImage(buffer: Buffer, desiredSize?: string | null, allowedPalette?: string[], productPresetId?: string | null): Promise<VisualAnalysis> {
  const image = await Jimp.read(buffer);
  const sourceWidth = image.bitmap.width;
  const sourceHeight = image.bitmap.height;
  const contentBounds = detectContentBounds(image);
  const workingImage = image.clone();
  if (contentBounds) workingImage.crop({ x: contentBounds.x, y: contentBounds.y, w: contentBounds.width, h: contentBounds.height });
  const complexityScore = estimateComplexity(workingImage);
  const target = parseTargetSize(desiredSize, workingImage.bitmap.width, workingImage.bitmap.height, complexityScore, productPresetId);
  const { width: targetWidth, height: targetHeight } = target;
  const buckets = new Map<string, { count: number; rgb: [number, number, number] }>();
  const sampleStep = Math.max(1, Math.floor(Math.max(workingImage.bitmap.width, workingImage.bitmap.height) / 96));
  for (let y = 0; y < workingImage.bitmap.height; y += sampleStep) {
    for (let x = 0; x < workingImage.bitmap.width; x += sampleStep) {
      const [r, g, b, a] = pixelRgb(workingImage, x, y);
      if (a < 32) continue;
      const rgb: [number, number, number] = [Math.round(r / 16) * 16, Math.round(g / 16) * 16, Math.round(b / 16) * 16];
      const key = rgb.join(",");
      const current = buckets.get(key);
      buckets.set(key, current ? { count: current.count + 1, rgb } : { count: 1, rgb });
    }
  }
  const requestedPalette = (allowedPalette || []).map(parseHexColor).filter((color): color is [number, number, number] => Boolean(color));
  const paletteRgb = requestedPalette.length ? requestedPalette : Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 12).map(item => item.rgb);
  const palette = paletteRgb.length ? (requestedPalette.length ? (allowedPalette || []).filter(value => parseHexColor(value)) : paletteRgb.map(rgb => colorHex(...rgb))) : ["#D9C5B2"];
  const resized = workingImage.resize({ w: targetWidth, h: targetHeight });
  const matrix = Array.from({ length: targetHeight }, (_, row) => Array.from({ length: targetWidth }, (_, column) => {
    const [r, g, b] = pixelRgb(resized, column, row);
    const rgb: [number, number, number] = [r, g, b];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    paletteRgb.forEach((candidate, index) => { const currentDistance = paletteDistance(rgb, candidate); if (currentDistance < bestDistance) { bestDistance = currentDistance; bestIndex = index; } });
    return palette[bestIndex] || palette[0];
  }));
  return { sourceWidth, sourceHeight, aspectRatio: Number((sourceWidth / sourceHeight).toFixed(4)), targetWidth, targetHeight, minimumRecommendedLongSide: target.minimumRecommendedLongSide, complexityScore: Number(complexityScore.toFixed(3)), dominantPalette: palette, matrix, contentBounds: contentBounds || undefined };
}

export function constrainMatrixToPalette(matrix: string[][], allowedPalette: string[]) {
  const candidates = allowedPalette.map(color => ({ color, rgb: parseHexColor(color) })).filter((candidate): candidate is { color: string; rgb: [number, number, number] } => Boolean(candidate.rgb));
  if (!candidates.length) return matrix;
  return matrix.map(row => row.map(cell => {
    const source = parseHexColor(cell);
    if (!source) return candidates[0].color;
    return candidates.reduce((best, candidate) => paletteDistance(source, candidate.rgb) < paletteDistance(source, best.rgb) ? candidate : best).color;
  }));
}

export function applyVisualAnalysisToOutput(output: Record<string, unknown>, analysis: VisualAnalysis) {
  return {
    ...output,
    matrix: analysis.matrix,
    palette: analysis.dominantPalette,
    width: analysis.targetWidth,
    height: analysis.targetHeight,
    matrixDraft: true,
    visualAnalysis: {
      sourceWidth: analysis.sourceWidth,
      sourceHeight: analysis.sourceHeight,
      aspectRatio: analysis.aspectRatio,
      minimumRecommendedLongSide: analysis.minimumRecommendedLongSide,
      complexityScore: analysis.complexityScore,
      contentBounds: analysis.contentBounds,
      method: "content-aware-pixel-resampling" as const,
    },
    decision: "REVISÃO NECESSÁRIA",
    details: `${output.details || ""} Matriz preliminar gerada por análise real da referência, com resolução mínima recomendada de ${analysis.minimumRecommendedLongSide} beads no maior lado, baseada em complexidade ${analysis.complexityScore}.`.trim(),
  };
}
