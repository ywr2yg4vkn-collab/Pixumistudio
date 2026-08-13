import { describe, expect, it } from "vitest";
import { buildProjectPdf } from "./pdf";

describe("buildProjectPdf", () => {
  it("creates a readable PDF with consolidated project sections", () => {
    const pdf = buildProjectPdf({
      name: "Projeto Aurora",
      productType: "Quadro",
      desiredSize: "20 x 20",
      notes: "Preservar a silhueta",
      economyPreference: "Equilibrar custo e fidelidade",
      instructions: "Fundo claro",
      referenceUrl: "https://example.com/reference.png",
      status: "FINALIZED",
      version: "02.0",
      currentStage: 9,
      productPreset: "miniature-medium",
    }, [{ stage: 2, agentName: "Criação da Matriz", status: "APPROVED", completedAt: new Date("2026-01-01T11:00:00Z"), output: JSON.stringify({ width: 2, height: 2, matrix: [["#000000", "#FFFFFF"], ["#FFFFFF", "#000000"]], total: 4, physicalWidthMm: 5.2, physicalHeightMm: 5.2, palette: ["#000000", "#FFFFFF"] }) }, { stage: 4, agentName: "Pixel Art Final", status: "APPROVED", completedAt: new Date("2026-01-01T11:30:00Z"), output: JSON.stringify({ width: 2, height: 2, matrix: [["#000000", "#FFFFFF"], ["#FFFFFF", "#000000"]], pixelArtFinal: true }) }, { stage: 6, agentName: "Engenharia de Produção", status: "APPROVED", completedAt: new Date("2026-01-01T12:00:00Z"), output: JSON.stringify({ width: 2, height: 2, total: 4, physicalWidthMm: 5.2, physicalHeightMm: 5.2, byColor: { "#000000": 2, "#FFFFFF": 2 }, materials: [{ color: "#000000", quantity: 2 }] }) }], [{ type: "APPROVED", message: "Matriz aprovada", createdAt: new Date("2026-01-01T11:00:00Z") }, { type: "APPROVED", message: "Engenharia aprovada", createdAt: new Date("2026-01-01T12:00:00Z") }]);
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("PIXUMI STUDIO");
    expect(text).toContain("MOLDE DE PRODUCAO");
    expect(text).toContain("MATRIZ GERADA DIRETAMENTE DA REFERENCIA");
    expect(text).toContain("1 CIRCULO = 1 BEAD DE 2,6 MM");
    expect(text).toContain("PALETA E QUANTIDADES");
    expect(text).toContain("TOTAL: 4 BEADS");
    expect(text).toContain("Quantidades exatas por cor");
    expect(text).toContain("total conferido: 4 beads");
    expect(text).toContain("#000000");
    expect(text).toContain("#FFFFFF");
    expect(text).toContain("/Count 4");
    expect(text).toContain("Manual de montagem");
    expect(text).toContain("base");
    expect((text.match(/#000000/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it("embeds the reference panel in the landscape technical sheet", () => {
    const pdf = buildProjectPdf({ name: "Molde", productType: "Quadro", desiredSize: "2 x 2", notes: null, economyPreference: null, instructions: null, referenceUrl: "https://example.com/ref.jpg", status: "FINALIZED", version: "01.0", currentStage: 9, productPreset: "frame-small", referenceImage: { base64: Buffer.from("jpeg-fixture").toString("base64"), width: 10, height: 8 } }, [{ stage: 2, agentName: "Matriz", status: "APPROVED", completedAt: new Date(), output: JSON.stringify({ matrix: [["#000000"]], width: 1, height: 1 }) }], []);
    const text = pdf.toString("latin1");
    expect(text).toContain("842 595");
    expect(text).toContain("/Subtype /Image");
    expect(text).toContain("/Im1 Do");
  });
});
