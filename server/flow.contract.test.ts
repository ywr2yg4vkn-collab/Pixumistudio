import { describe, expect, it } from "vitest";
import { HUMAN_APPROVAL_STAGES, canProceedAfterMatrix, continuousStages, injectMatrixSource, stageNames, statusAfterAgent } from "./routers";
import { nextVersion } from "../shared/pixumi";

describe("Pixumi visual production flow", () => {
  it("keeps Direction → Matrix → Pixel Art Final → Production in the intended order", () => {
    expect(stageNames.slice(0, 7)).toEqual([
      "Análise da Referência",
      "Criação da Matriz",
      "Direção do Projeto",
      "Pixel Art Final",
      "Validação da Pixel Art",
      "Engenharia de Produção",
      "Validação de Produção",
    ]);
  });

  it("pauses only at the editable matrix and final control", () => {
    expect(HUMAN_APPROVAL_STAGES).toEqual([2, 9]);
    expect(statusAfterAgent(2)).toBe("NEEDS_REVIEW");
    expect(statusAfterAgent(9)).toBe("NEEDS_REVIEW");
    expect([1, 3, 4, 5, 6, 7, 8].every(stage => statusAfterAgent(stage) === "COMPLETED")).toBe(true);
  });

  it("computes continuous pipeline batches for initial run and matrix resumption", () => {
    expect(continuousStages(1)).toEqual([1, 2]);
    expect(continuousStages(3)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(continuousStages(6)).toEqual([6, 7, 8, 9]);
  });

  it("blocks Direction until the stage 02 matrix is valid and approved", () => {
    const matrix = { matrix: [["#111111", "#ffffff"], ["#ffffff", "#111111"]] };
    expect(canProceedAfterMatrix(3, undefined, matrix)).toBe(false);
    expect(canProceedAfterMatrix(3, "NEEDS_REVIEW", matrix)).toBe(false);
    expect(canProceedAfterMatrix(3, "APPROVED", matrix)).toBe(true);
    expect(canProceedAfterMatrix(2, undefined, null)).toBe(true);
  });

  it("injects the approved stage 02 matrix into downstream agent outputs", () => {
    const matrix = [["#111111", "#ffffff"], ["#ffffff", "#111111"]];
    for (const stage of [3, 4, 6]) {
      const output = injectMatrixSource({ summary: `stage-${stage}` }, matrix);
      expect(output.matrixSourceStage).toBe(2);
      expect(output.matrix).toEqual(matrix);
    }
  });

  it("increments versions without overwriting prior snapshots", () => {
    expect(nextVersion("01.0")).toBe("01.1");
    expect(nextVersion("01.1")).toBe("01.2");
    expect(nextVersion("01.2", true)).toBe("02.0");
  });
});
