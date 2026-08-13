import { CHROMATIC_48_PALETTE } from "../shared/palettes";
import { countMatrix } from "../shared/pixumi";
import { getProductPreset } from "../shared/productCatalog";

type PdfProject = {
  name: string;
  productType: string;
  productPreset?: string | null;
  productSpec?: string | null;
  desiredSize: string | null;
  notes: string | null;
  economyPreference: string | null;
  paletteBox?: string | null;
  instructions: string | null;
  referenceUrl: string | null;
  status: string;
  version: string;
  currentStage: number;
  referenceImage?: { base64: string; width: number; height: number };
};

type PdfRun = { stage: number; agentName: string; status: string; output: string | null; completedAt: Date | null };
type PdfEvent = { createdAt: Date; message: string; type: string };

function escapePdf(value: string) {
  const ascii = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/·/g, "-").replace(/×/g, "x").replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, "");
  return ascii.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[\r\n]+/g, " ");
}

function pdfRgb(color: string) {
  const hex = color.replace("#", "").padEnd(6, "0").slice(0, 6);
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;
  return `${red.toFixed(4)} ${green.toFixed(4)} ${blue.toFixed(4)}`;
}

function lines(value: unknown, fallback = "Não informado") {
  const text = value === null || value === undefined || value === "" ? fallback : String(value);
  return text.match(/.{1,92}(?:\s|$)/g)?.map(part => part.trim()).filter(Boolean) || [text.slice(0, 92)];
}

function technicalSheetCommands(project: PdfProject, productLabel: string, matrix: string[][], byColor: Record<string, number>, total: number, physicalWidthMm: number | string, physicalHeightMm: number | string) {
  const columns = matrix[0]?.length || 0; const rows = matrix.length || 0; const gridWidth = 520; const gridHeight = 330; const cell = Math.min(gridWidth / Math.max(1, columns), gridHeight / Math.max(1, rows)); const originX = 36; const originY = 184; const commands = ["BT", "/F1 18 Tf", "36 558 Td", `(${escapePdf("PIXUMI STUDIO - MOLDE DE PRODUCAO")}) Tj`, "/F1 9 Tf", "0 -18 Td", `(${escapePdf(`${project.name} - ${productLabel}`)}) Tj`, "ET"];
  commands.push("BT", "/F1 10 Tf", "36 154 Td", `(${escapePdf(`${columns} BEADS (LARGURA) - ${rows} BEADS (ALTURA)`)}) Tj`, "ET");
  matrix.forEach((line, rowIndex) => line.forEach((color, columnIndex) => { const cx = originX + columnIndex * cell + cell / 2; const cy = originY + (rows - rowIndex - 1) * cell + cell / 2; const radius = Math.max(1.2, cell * 0.39); const k = radius * 0.5522848; commands.push(`${pdfRgb(String(color))} rg`, `${cx + radius} ${cy} m`, `${cx + radius} ${cy + k} ${cx + k} ${cy + radius} ${cx} ${cy + radius} c`, `${cx - k} ${cy + radius} ${cx - radius} ${cy + k} ${cx - radius} ${cy} c`, `${cx - radius} ${cy - k} ${cx - k} ${cy - radius} ${cx} ${cy - radius} c`, `${cx + k} ${cy - radius} ${cx + radius} ${cy - k} ${cx + radius} ${cy} c`, "f"); }));
  commands.push("BT", "/F1 9 Tf", "590 500 Td", `(${escapePdf("INFORMAÇÕES")}) Tj`, "0 -18 Td", `(${escapePdf(`Tamanho: ${columns} × ${rows} beads`)}) Tj`, "0 -15 Td", `(${escapePdf(`Final: ${physicalWidthMm} × ${physicalHeightMm} mm`)}) Tj`, "0 -15 Td", `(${escapePdf("1 CIRCULO = 1 BEAD DE 2,6 MM")}) Tj`, "0 -15 Td", `(${escapePdf("MATRIZ GERADA DIRETAMENTE DA REFERENCIA")}) Tj`, "0 -15 Td", `(${escapePdf("FONTE: MATRIZ CANONICA APROVADA - AGENTE 02")}) Tj`, "ET");
  commands.push("BT", "/F1 10 Tf", "590 405 Td", `(${escapePdf("PALETA E QUANTIDADES")}) Tj`, "ET");
  Object.entries(byColor).sort(([a], [b]) => a.localeCompare(b)).slice(0, 18).forEach(([color, quantity], index) => { const column = index % 2; const row = Math.floor(index / 2); const x = 590 + column * 110; const y = 382 - row * 15; commands.push(`${pdfRgb(color)} rg`, `${x} ${y - 3} 9 9 re`, "f", "0 0 0 rg", "BT", "/F1 7 Tf", `${x + 13} ${y} Td`, `(${escapePdf(`${color} · ${quantity}`)}) Tj`, "ET"); });
  const paletteRows = Math.ceil(Math.min(18, Object.keys(byColor).length) / 2); commands.push("BT", "/F1 10 Tf", `590 ${350 - paletteRows * 15} Td`, `(${escapePdf(`TOTAL: ${total} BEADS`)}) Tj`, "0 -18 Td", `(${escapePdf("Use esta página como molde de montagem.")}) Tj`, "ET");
  commands.push("BT", "/F1 8 Tf", "590 150 Td", `(${escapePdf(project.referenceUrl ? "REFERENCIA ORIGINAL" : "REFERENCIA ORIGINAL: NAO ENVIADA")}) Tj`, "0 -14 Td", `(${escapePdf("MOLDE ACIMA = FONTE DE VERDADE")}) Tj`, "ET");
  if (project.referenceImage) { const maxWidth = 160; const maxHeight = 92; const scale = Math.min(maxWidth / project.referenceImage.width, maxHeight / project.referenceImage.height); const imageWidth = project.referenceImage.width * scale; const imageHeight = project.referenceImage.height * scale; commands.push("q", `${imageWidth.toFixed(2)} 0 0 ${imageHeight.toFixed(2)} 590 36 cm`, "/Im1 Do", "Q"); }
  return commands;
}

export function buildProjectPdf(project: PdfProject, runs: PdfRun[], events: PdfEvent[]) {
  const sections: string[] = [];
  const productPreset = getProductPreset(project.productPreset);
  const add = (text: string, size = 10, gap = 16) => {
    for (const line of lines(text)) sections.push(`${size} ${gap} ${escapePdf(line)}`);
  };
  add("PIXUMI STUDIO", 20, 26); add("Documento final consolidado", 13, 20); sections.push("0 0 0 12");
  add(`Projeto: ${project.name}`, 12); add(`Produto: ${productPreset.label}`); add(`Família: ${productPreset.family} | Escala: ${productPreset.sizeLabel}`); add(`Status: ${project.status} | Versão: ${project.version} | Etapa: ${project.currentStage}/9`); add(`Tamanho desejado: ${project.desiredSize}`); add(`Referência: ${project.referenceUrl ? project.referenceUrl : "Não enviada"}`); add(`Preferência de economia: ${project.economyPreference}`); add(`Paleta cromática fixa: ${CHROMATIC_48_PALETTE.name}`); add(`Cores disponíveis: ${CHROMATIC_48_PALETTE.beadCountLabel}`); add("Legenda: cada célula da matriz usa a cor cromaticamente mais próxima dentro destas 48 cores fixas."); add(`Observações: ${project.notes}`); add(`Instruções: ${project.instructions}`); sections.push("0 0 0 18");
  add("ARTE, MATRIZ E PRODUÇÃO", 13, 20);
  const outputs = runs.map(run => { try { return { run, output: run.output ? JSON.parse(run.output) : {} }; } catch { return { run, output: {} }; } });
  const matrixRun = outputs.find(item => item.run.stage === 2 && item.run.status === "APPROVED");
  const matrixSource = matrixRun?.output || {};
  const engineering = outputs.find(item => item.run.stage === 6)?.output || matrixSource;
  const pixel = outputs.find(item => item.run.stage === 4)?.output || matrixSource;
  const canonicalMatrix = Array.isArray(matrixSource.matrix) ? matrixSource.matrix : (Array.isArray(engineering.matrix) ? engineering.matrix : []);
  add(`Fonte canônica da matriz: Agente 02 · ${matrixSource.width || canonicalMatrix[0]?.length || "—"} × ${matrixSource.height || canonicalMatrix.length || "—"} beads`);
  add(`Pixel art final: ${pixel.width || canonicalMatrix[0]?.length || "—"} × ${pixel.height || canonicalMatrix.length || "—"} beads`); if (Array.isArray(pixel.matrix)) { add("Representação da Pixel Art Final:"); pixel.matrix.slice(0, 24).forEach((row: string[]) => add(row.map(cell => String(cell).slice(0, 7)).join(" "), 8, 11)); }
  add(`Matriz de beads (Agente 02): ${canonicalMatrix[0]?.length || "—"} × ${canonicalMatrix.length || "—"} beads`); if (canonicalMatrix.length) { canonicalMatrix.slice(0, 24).forEach((row: string[]) => add(row.map(cell => String(cell).slice(0, 7)).join(" "), 8, 11)); }
  const matrixMetrics = canonicalMatrix.length ? countMatrix(canonicalMatrix) : null;
  const byColor = matrixMetrics?.byColor || engineering.byColor || matrixSource.byColor || {};
  const quantityTotal = Object.values(byColor as Record<string, unknown>).reduce<number>((sum, quantity) => sum + Number(quantity || 0), 0);
  add(`Total de beads: ${quantityTotal || engineering.total || matrixSource.total || "—"}`); add(`Dimensão física: ${engineering.physicalWidthMm || matrixSource.physicalWidthMm || "—"} × ${engineering.physicalHeightMm || matrixSource.physicalHeightMm || "—"} mm`); add(`Paleta: ${engineering.byColor ? Object.entries(engineering.byColor).map(([color, quantity]) => `${color} (${quantity})`).join(", ") : matrixSource.palette ? JSON.stringify(matrixSource.palette) : "—"}`); add(`Materiais: ${engineering.materials ? JSON.stringify(engineering.materials) : matrixSource.materials ? JSON.stringify(matrixSource.materials) : "—"}`); sections.push("0 0 0 18");
  add("ETAPAS E HISTÓRICO", 13, 20); for (const run of runs) add(`${String(run.stage).padStart(2, "0")} · ${run.agentName} · ${run.status}${run.completedAt ? ` · ${run.completedAt.toLocaleString("pt-BR")}` : ""}`); sections.push("0 0 0 18"); for (const event of events.slice(0, 12)) add(`${event.createdAt.toLocaleString("pt-BR")} · ${event.message}`);
  const content: string[] = ["BT", "/F1 20 Tf", "50 790 Td", `(${escapePdf("PIXUMI STUDIO")}) Tj`, "/F1 10 Tf", "0 -24 Td"];
  let used = 0;
  for (const section of sections) { if (section === "0 0 0 12" || section === "0 0 0 18") { content.push(`0 -${section.endsWith("12") ? 12 : 18} Td`); continue; } const firstSpace = section.indexOf(" "); const secondSpace = section.indexOf(" ", firstSpace + 1); const size = section.slice(0, firstSpace); const gap = section.slice(firstSpace + 1, secondSpace); const text = section.slice(secondSpace + 1); content.push(`/F1 ${size} Tf`, `0 -${gap} Td`, `(${text}) Tj`); used += Number(gap); if (used > 690) break; }
  content.push("ET");
  const legacyStream = content.join("\n");
  const visualMatrix: string[][] = canonicalMatrix.slice(0, 38).map((row: unknown[]) => row.slice(0, 38).map(cell => String(cell)));
  const technicalStream = technicalSheetCommands(project, productPreset.label, canonicalMatrix, byColor as Record<string, number>, quantityTotal || Number(engineering.total || matrixSource.total || 0), engineering.physicalWidthMm || matrixSource.physicalWidthMm || "—", engineering.physicalHeightMm || matrixSource.physicalHeightMm || "—").join("\n");
  const visualCell = Math.min(13, Math.floor(500 / Math.max(1, visualMatrix[0]?.length || 1)));
  const visualCommands = ["BT", "/F1 16 Tf", "50 790 Td", `(${escapePdf("Matriz visual de beads")}) Tj`, "/F1 9 Tf", "0 -22 Td", `(${escapePdf(`${visualMatrix[0]?.length || 0} × ${visualMatrix.length || 0} células · fonte canônica: Agente 02 · paleta fixa: 48 cores`)}) Tj`, "ET"];
  visualMatrix.forEach((row, rowIndex) => row.forEach((color, columnIndex) => { const x = 50 + columnIndex * visualCell; const y = 735 - (rowIndex + 1) * visualCell; visualCommands.push(`${pdfRgb(String(color))} rg`, `${x} ${y} ${Math.max(1, visualCell - 0.35)} ${Math.max(1, visualCell - 0.35)} re`, "f"); }));
  const visualStream = visualCommands.join("\n");
  const quantityRows = Object.entries(byColor).sort(([first], [second]) => first.localeCompare(second));
  const quantityCommands = ["BT", "/F1 18 Tf", "50 790 Td", `(${escapePdf("Quantidades exatas por cor")}) Tj`, "/F1 10 Tf", "0 -24 Td", `(${escapePdf("Matriz canônica aprovada · total conferido: " + quantityTotal + " beads")}) Tj`, "/F1 9 Tf", "0 -24 Td", `(${escapePdf("COR / CÓDIGO")}) Tj`, "250 0 Td", `(${escapePdf("QUANTIDADE")}) Tj`, "ET"];
  quantityRows.forEach(([color, quantity], index) => { const y = 712 - index * 14; quantityCommands.push(`${pdfRgb(color)} rg`, `50 ${y - 3} 12 12 re`, "f", "0 0 0 rg", "BT", "/F1 9 Tf", `70 ${y} Td`, `(${escapePdf(color)}) Tj`, "250 0 Td", `(${escapePdf(String(quantity))}) Tj`, "ET"); });
  const quantityStream = quantityCommands.join("\n");
  const manualCommands = ["BT", "/F1 18 Tf", "50 790 Td", `(${escapePdf("Manual de montagem")}) Tj`, "/F1 11 Tf", "0 -26 Td", `(${escapePdf(productPreset.label)}) Tj`, "/F1 9 Tf", "0 -20 Td", `(${escapePdf(productPreset.description)}) Tj`, "0 -22 Td", `(${escapePdf("Grade sugerida: " + productPreset.suggestedGrid)}) Tj`, "0 -18 Td", `(${escapePdf("Módulos: " + productPreset.modules.join(", "))}) Tj`, "/F1 10 Tf", "0 -28 Td", `(${escapePdf("ORDEM DE MONTAGEM")}) Tj`];
  productPreset.assemblySteps.forEach((step, index) => manualCommands.push("/F1 10 Tf", "0 -20 Td", `(${escapePdf(`${index + 1}. ${step}`)}) Tj`));
  manualCommands.push("/F1 10 Tf", "0 -30 Td", `(${escapePdf("CONTROLE DE PRODUÇÃO")}) Tj`, "/F1 9 Tf", "0 -20 Td", `(${escapePdf("Use a matriz visual e a tabela de quantidades como fonte de verdade. Confirme cada módulo antes de unir as peças.")}) Tj`, "0 -18 Td", `(${escapePdf("Para peças com base, a base deve ser montada e conferida antes do encaixe do boneco ou personagem.")}) Tj`, "ET");
  const manualStream = manualCommands.join("\n");
  const imageObject = project.referenceImage ? `<< /Type /XObject /Subtype /Image /Width ${project.referenceImage.width} /Height ${project.referenceImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${Buffer.byteLength(Buffer.from(project.referenceImage.base64, "base64"))} >>\nstream\n${Buffer.from(project.referenceImage.base64, "base64").toString("latin1")}\nendstream` : null;
  const pageResources = project.referenceImage ? "<</Font << /F1 4 0 R >> /XObject << /Im1 12 0 R >> >>" : "<</Font << /F1 4 0 R >> >>";
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 6 0 R 8 0 R 10 0 R] /Count 4 >>", `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources ${pageResources} /Contents 5 0 R >>`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(technicalStream, "latin1")} >>\nstream\n${technicalStream}\nendstream`, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>", `<< /Length ${Buffer.byteLength(visualStream, "latin1")} >>\nstream\n${visualStream}\nendstream`, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 9 0 R >>", `<< /Length ${Buffer.byteLength(quantityStream, "latin1")} >>\nstream\n${quantityStream}\nendstream`, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 11 0 R >>", `<< /Length ${Buffer.byteLength(manualStream, "latin1")} >>\nstream\n${manualStream}\nendstream`];
  if (imageObject) objects.push(imageObject);
  let pdf = "%PDF-1.4\n"; const offsets = [0]; for (let i = 0; i < objects.length; i++) { offsets.push(Buffer.byteLength(pdf, "latin1")); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; } const xref = Buffer.byteLength(pdf, "latin1"); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
