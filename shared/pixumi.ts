export type Matrix = string[][];

export function countMatrix(matrix: Matrix) {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of matrix) for (const color of row) {
    if (!color) continue;
    counts[color] = (counts[color] ?? 0) + 1;
    total += 1;
  }
  const height = matrix.length;
  const width = matrix.reduce((max, row) => Math.max(max, row.length), 0);
  return { total, byColor: counts, width, height, physicalWidthMm: Number((width * 2.6).toFixed(1)), physicalHeightMm: Number((height * 2.6).toFixed(1)) };
}

export function nextVersion(current: string, structural = false) {
  const [major, minor] = current.split(".").map(Number);
  if (structural) return `${String((major || 1) + 1).padStart(2, "0")}.0`;
  return `${String(major || 1).padStart(2, "0")}.${(minor || 0) + 1}`;
}

export function validateProduction(matrix: Matrix, expectedWidth?: number, expectedHeight?: number) {
  const issues: string[] = [];
  const width = matrix[0]?.length ?? 0;
  if (!matrix.length || !width) issues.push("A matriz está vazia.");
  if (matrix.some(row => row.length !== width)) issues.push("A matriz possui linhas com larguras diferentes.");
  if (expectedWidth !== undefined && width !== expectedWidth) issues.push(`Largura divergente: esperada ${expectedWidth}, encontrada ${width}.`);
  if (expectedHeight !== undefined && matrix.length !== expectedHeight) issues.push(`Altura divergente: esperada ${expectedHeight}, encontrada ${matrix.length}.`);
  if (matrix.some(row => row.some(color => typeof color !== "string" || color.trim() === ""))) issues.push("Existem células sem cor válida.");
  return { approved: issues.length === 0, issues, counts: countMatrix(matrix) };
}

/** Extracts a 2D color grid from the structured output of a pixel-art agent. */
export function extractMatrix(output: unknown): Matrix | null {
  if (!output || typeof output !== "object") return null;
  const candidate = output as Record<string, unknown>;
  for (const key of ["matrix", "grid", "pixels"]) {
    const value = candidate[key];
    if (Array.isArray(value) && value.length > 0 && value.every(row => Array.isArray(row))) {
      const rows = value.map(row => (row as unknown[]).map(cell => String(cell ?? "").trim()));
      const width = rows[0]?.length ?? 0;
      if (width > 0 && rows.every(row => row.length === width && row.every(Boolean))) return rows;
    }
  }
  return null;
}

/** Converts an approved pixel-art grid into the production bead grid. */
export function generateBeadMatrix(pixelOutput: unknown): Matrix | null {
  const matrix = extractMatrix(pixelOutput);
  if (!matrix) return null;
  return matrix.map(row => row.map(color => color.trim()));
}

/** Creates a clearly marked deterministic draft when an AI response lacks a usable grid. */
export function generateDeterministicDraftMatrix(output: unknown, desiredSize?: string | null): Matrix {
  const source = (output && typeof output === "object" ? output as Record<string, unknown> : {});
  const sizeText = `${source.width || ""}x${source.height || ""} ${desiredSize || ""}`;
  const match = sizeText.match(/(\d{1,3})\s*[x×]\s*(\d{1,3})/i);
  const width = Math.min(48, Math.max(4, Number(match?.[1] || 12)));
  const height = Math.min(48, Math.max(4, Number(match?.[2] || 12)));
  const paletteCandidate = Array.isArray(source.palette) ? source.palette : [];
  const palette = paletteCandidate.map(value => String(value).trim()).filter(Boolean).slice(0, 4);
  const colors = palette.length ? palette : ["#D9C5B2", "#F6F4F0"];
  return Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, column) => colors[(row + column) % colors.length]));
}

export function processingMessageForElapsed(elapsedSeconds: number) {
  if (elapsedSeconds < 8) return "Iniciando análise…";
  if (elapsedSeconds < 30) return "A solicitação continua ativa…";
  return "Ainda trabalhando; não feche esta tela.";
}

export function paintMatrixCell(matrix: Matrix, row: number, column: number, color: string): Matrix {
  if (!matrix[row] || column < 0 || column >= matrix[row].length || !color.trim()) return matrix;
  return matrix.map((line, currentRow) => currentRow === row ? line.map((cell, currentColumn) => currentColumn === column ? color : cell) : [...line]);
}

export function recalculateMatrixOutput(baseOutput: Record<string, unknown>, matrix: Matrix) {
  const metrics = countMatrix(matrix);
  const validation = validateProduction(matrix, metrics.width, metrics.height);
  return {
    ...baseOutput,
    matrix,
    width: metrics.width,
    height: metrics.height,
    total: metrics.total,
    byColor: metrics.byColor,
    physicalWidthMm: metrics.physicalWidthMm,
    physicalHeightMm: metrics.physicalHeightMm,
    productionValidation: validation,
    matrixEdited: true,
    matrixSourceStage: 2,
    decision: "REVISÃO NECESSÁRIA",
    details: `${baseOutput.details || ""} Matriz editada manualmente e métricas recalculadas.`.trim(),
  };
}
