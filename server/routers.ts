import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { clearPersonalSession, isPersonalAuthConfigured } from "./_core/personalAuth";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeGemini } from "./_core/gemini";
import { invokeLLM } from "./_core/llm";
import { storageGetSignedUrl, storagePut } from "./storage";
import { getDb, getProject, getProjectWorkspace, listProjects } from "./db";
import { agentRuns, projectEvents, projectVersions, projects } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Jimp } from "jimp";
import { countMatrix, generateBeadMatrix, generateDeterministicDraftMatrix, nextVersion, validateProduction, recalculateMatrixOutput } from "../shared/pixumi";
import { buildProjectPdf } from "./pdf";
import { analyzeReferenceImage, applyVisualAnalysisToOutput, constrainMatrixToPalette } from "./visualAnalysis";
import { getBeadPalette } from "../shared/palettes";
import { composeProductMatrix, getProductPreset } from "../shared/productCatalog";

export const stageNames = ["Análise da Referência", "Criação da Matriz", "Direção do Projeto", "Pixel Art Final", "Validação da Pixel Art", "Engenharia de Produção", "Validação de Produção", "Mockup e Documentação", "Controle do Projeto"] as const;
export const HUMAN_APPROVAL_STAGES = [2, 9] as const;
export function statusAfterAgent(stage: number) { return HUMAN_APPROVAL_STAGES.includes(stage as 2 | 9) ? "NEEDS_REVIEW" as const : "COMPLETED" as const; }
export function continuousStages(startStage: number) { return startStage <= 1 ? [1, 2] : [3, 4, 5, 6, 7, 8, 9].filter(stage => stage >= startStage && stage <= 9); }
export function canProceedAfterMatrix(stage: number, matrixStatus: string | undefined, matrixOutput: unknown) { return stage < 3 || (matrixStatus === "APPROVED" && Boolean(generateBeadMatrix(matrixOutput))); }
export function injectMatrixSource(output: Record<string, unknown>, matrix: string[][]) { return { ...output, matrix, matrixSourceStage: 2 }; }
export function buildStage2VisualFallback(output: Record<string, unknown>, analysis: Awaited<ReturnType<typeof analyzeReferenceImage>> | null, desiredSize?: string | null) {
  return analysis
    ? applyVisualAnalysisToOutput(output, analysis)
    : { ...output, matrix: generateDeterministicDraftMatrix(output, desiredSize), matrixDraft: true, decision: "REVISÃO NECESSÁRIA", details: `${output.details || ""} A referência não pôde ser analisada; foi criada uma matriz preliminar determinística para revisão humana.` };
}
const stagePrompts = [
  "Você é o Agente 01, especialista em análise de referências visuais. Não crie pixel art. Identifique identidade, silhueta, composição, paleta, elementos essenciais, adaptáveis e dificuldades de produção.",
  "Você é o Agente 02, especialista em criação de matriz para Hama Beads. Use imediatamente a Análise da Referência e crie a primeira matriz producível do projeto. Retorne obrigatoriamente JSON válido com `matrix` como array 2D retangular de strings de cor, `width`, `height`, `palette`, `materials` e `summary`. A matriz é o segundo artefato do fluxo e a fonte de verdade de todas as etapas seguintes.",
  "Você é o Agente 03, diretor de projeto. Receba a Análise da Referência e a Matriz já criada. Transforme-as em um plano executável, sem substituir ou apagar a matriz, definindo formato, escala, prioridades, simplificação, paleta, economia e critérios de aprovação.",
  "Você é o Agente 04, especialista em Pixel Art Final. Use a matriz aprovada como fonte de verdade e descreva/renderize a pixel art final preservando cada célula. Retorne JSON válido com `matrix` igual à matriz recebida, `summary`, `palette` e `pixelArtFinal: true`. Não substitua a matriz por descrição textual.",
  "Você é o Agente 05, crítico técnico da pixel art. Valide reconhecimento, silhueta, contraste, cores, complexidade, escala e correspondência entre referência, matriz e pixel art final. Classifique problemas como CRÍTICO, IMPORTANTE ou ACEITÁVEL e decida APROVADO ou REVISÃO NECESSÁRIA.",
  "Você é o Agente 06, engenheiro de produção. Receba a matriz canônica criada no Agente 02 e preserve cada célula ao converter em produção. Retorne JSON válido com `matrix` 2D retangular, legenda, contagem por cor, total, dimensões em beads, dimensões físicas usando 2,6 mm, materiais e montagem.",
  "Você é o Agente 07, validador de produção. Compare pixel art, matriz, lista de materiais e dimensões. Procure células inválidas, inconsistências, erros de contagem, desconexões e detalhes impossíveis. Decida APROVADO ou REVISÃO NECESSÁRIA.",
  "Você é o Agente 08, responsável por mockup e documentação. Descreva uma apresentação visual fiel e consolide a ficha de produção sem inventar características.",
  "Você é o Agente 09, controlador final. Faça a revisão integral de referência, direção, pixel art final, matriz, quantidades, dimensões e documentação. Decida APROVADO, APROVADO COM OBSERVAÇÕES ou REPROVADO, indicando retorno quando necessário.",
];

const createSchema = z.object({ name: z.string().min(2), productType: z.string().min(2).optional(), productPreset: z.string().optional(), desiredSize: z.string().optional(), notes: z.string().optional(), economyPreference: z.string().optional(), paletteBox: z.string().optional(), instructions: z.string().optional(), referenceDataUrl: z.string().optional(), referenceMimeType: z.string().optional() });
const stageSchema = z.object({ projectId: z.number().int().positive(), stage: z.number().int().min(1).max(9), reviewInstruction: z.string().optional() });

export function parseOutput(content: unknown) {
  if (typeof content !== "string") return { summary: "O agente não retornou texto estruturado.", details: "", status: "CONCLUÍDO" };
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(normalized); } catch { return { summary: normalized, details: "", status: "CONCLUÍDO" }; }
}

async function invokeWithRetry(messages: Parameters<typeof invokeLLM>[0]["messages"]) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return process.env.GEMINI_API_KEY ? await invokeGemini({ messages }) : await invokeLLM({ messages });
    } catch (error) { lastError = error; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1))); }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha transitória ao chamar o agente.");
}

async function requireProject(ctxUserId: number, projectId: number) {
  const project = await getProject(ctxUserId, projectId);
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado." });
  return project;
}

export async function resolveReferenceAssetUrl(project: { referenceKey?: string | null; referenceUrl?: string | null }) {
  if (project.referenceKey) {
    try { return await storageGetSignedUrl(project.referenceKey); } catch (error) { console.warn("[Pixumi] Signed reference URL unavailable:", error); }
  }
  return project.referenceUrl?.startsWith("http") ? project.referenceUrl : null;
}

let appRouterRef: any;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); if (isPersonalAuthConfigured()) clearPersonalSession(ctx.req, ctx.res); return { success: true } as const; }),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    workspace: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => getProjectWorkspace(ctx.user.id, input.projectId)),
    exportPdf: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const project = await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const runs = await db.select().from(agentRuns).where(eq(agentRuns.projectId, input.projectId)).orderBy(agentRuns.stage);
      const events = await db.select().from(projectEvents).where(eq(projectEvents.projectId, input.projectId)).orderBy(desc(projectEvents.createdAt));
      let referenceImage: { base64: string; width: number; height: number } | undefined;
      const referenceAssetUrl = await resolveReferenceAssetUrl(project);
      if (referenceAssetUrl) { try { const response = await fetch(referenceAssetUrl); if (response.ok) { const image = await Jimp.read(Buffer.from(await response.arrayBuffer())); const jpeg = await image.getBuffer("image/jpeg"); referenceImage = { base64: jpeg.toString("base64"), width: image.bitmap.width, height: image.bitmap.height }; } } catch (error) { console.warn("[Pixumi] PDF reference panel unavailable:", error); } }
      const pdf = buildProjectPdf({ ...project, referenceImage }, runs, events);
      const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "projeto";
      return { filename: `pixumi-${safeName}.pdf`, base64: pdf.toString("base64"), contentType: "application/pdf" as const };
    }),
    create: protectedProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      let referenceUrl: string | null = null; let referenceKey: string | null = null;
      if (input.referenceDataUrl) {
        const match = input.referenceDataUrl.match(/^data:([^;]+);base64,(.+)$/); if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo de referência inválido." });
        const buffer = Buffer.from(match[2], "base64"); if (buffer.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "A referência deve ter até 8 MB." });
        const stored = await storagePut(`projects/${ctx.user.id}/${Date.now()}-reference`, buffer, input.referenceMimeType || match[1]); referenceUrl = stored.url; referenceKey = stored.key;
      }
      const productPreset = getProductPreset(input.productPreset); const productSpec = JSON.stringify(productPreset);
      const inserted = await db.insert(projects).values({ ownerId: ctx.user.id, name: input.name, productType: productPreset.label, productPreset: productPreset.id, productSpec, desiredSize: input.desiredSize || productPreset.sizeLabel, notes: input.notes || null, economyPreference: input.economyPreference || null, paletteBox: getBeadPalette(input.paletteBox).id, instructions: input.instructions || null, referenceUrl, referenceKey });
      const projectId = Number(inserted[0].insertId);
      await db.insert(projectEvents).values({ projectId, type: "CREATED", message: "Projeto criado" });
      await db.insert(projectVersions).values({ projectId, version: "01.0", snapshot: JSON.stringify({ stage: 1, status: "DRAFT" }), reason: "Versão inicial" });
      return { id: projectId };
    }),
    runAgent: protectedProcedure.input(stageSchema).mutation(async ({ ctx, input }) => {
      const project = await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const workspace = await getProjectWorkspace(ctx.user.id, input.projectId); const previous = workspace?.runs.filter(run => run.stage < input.stage).slice(-4).map(run => ({ stage: run.stage, output: parseOutput(run.output) })) || [];
      const matrixRun = workspace?.runs.find(run => run.stage === 2); const matrixOutput = matrixRun ? parseOutput(matrixRun.output) : null; const canonicalMatrix = generateBeadMatrix(matrixOutput);
      if (!canProceedAfterMatrix(input.stage, matrixRun?.status, matrixOutput)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A Matriz precisa ser criada e aprovada antes de continuar para a Direção ou qualquer etapa posterior." });
      const matrixContext = input.stage >= 3 && canonicalMatrix ? `\nMatriz canônica aprovada pelo Agente 02: ${JSON.stringify(canonicalMatrix)}` : "";
      const palette = getBeadPalette(project.paletteBox); const productPreset = getProductPreset(project.productPreset);
      const prompt = `${stagePrompts[input.stage - 1]}\n\nProjeto: ${project.name}\nTipo: ${productPreset.label}\nFamília: ${productPreset.family}\nEscala: ${productPreset.sizeLabel}\nMódulos obrigatórios: ${productPreset.modules.join(", ")}\nGrade sugerida: ${productPreset.suggestedGrid}\nSequência de montagem: ${productPreset.assemblySteps.join(" → ")}\nTamanho: ${project.desiredSize || "não definido"}\nPaleta cromática fixa: ${palette.name} (${palette.beadCountLabel})\nCores permitidas: ${palette.colors.join(", ")}\nObservações: ${project.notes || "nenhuma"}\nEconomia: ${project.economyPreference || "não definida"}\nInstruções: ${project.instructions || "nenhuma"}\nResultados anteriores: ${JSON.stringify(previous)}${matrixContext}\n${input.reviewInstruction ? `Instrução de revisão: ${input.reviewInstruction}` : ""}\nRetorne JSON com summary, details, status, issues, width, height, palette, matrix, materials, observations e recommendation. Não invente processamento de imagem que não tenha ocorrido. Na matriz, use somente cores da paleta cromática fixa de 48 cores.`;
      const runInsert = await db.insert(agentRuns).values({ projectId: input.projectId, stage: input.stage, agentName: stageNames[input.stage - 1], status: "RUNNING", prompt });
      const runId = Number(runInsert[0].insertId);
      try {
        const referenceAssetUrl = input.stage === 2 ? await resolveReferenceAssetUrl(project) : null;
        const visualContent = input.stage === 2 && referenceAssetUrl ? [{ type: "text" as const, text: `${prompt}\n\nANÁLISE VISUAL AVANÇADA: observe a referência anexada. Preserve a silhueta, proporções, áreas de maior contraste e a hierarquia visual. Converta a composição em uma grade retangular de beads adequada ao tamanho solicitado. A matriz deve representar a imagem observada, não um padrão genérico.` }, { type: "image_url" as const, image_url: { url: referenceAssetUrl, detail: "high" as const } }] : prompt;
        const response = await invokeWithRetry([{ role: "system", content: stagePrompts[input.stage - 1] }, { role: "user", content: visualContent }]);
        const content = response.choices?.[0]?.message?.content;         let output = parseOutput(content);         if (input.stage === 2 && generateBeadMatrix(output)) output = { ...output, matrix: constrainMatrixToPalette(generateBeadMatrix(output)!, palette.colors), palette: palette.colors, paletteBox: palette.id };         if (input.stage >= 3 && canonicalMatrix) output = injectMatrixSource(output, canonicalMatrix);
        if ([5, 7].includes(input.stage)) {
          const rawIssues = Array.isArray(output.issues) ? output.issues : [];
          const issues = rawIssues.map((issue: unknown) => typeof issue === "string" ? { severity: "IMPORTANTE", message: issue } : issue);
          output = { ...output, issues, decision: output.decision || (issues.some((issue: any) => issue.severity === "CRÍTICO" || issue.severity === "IMPORTANTE") ? "REVISÃO NECESSÁRIA" : "APROVADO") };
        }
        if (input.stage === 2 && !generateBeadMatrix(output)) {
          const repairPrompt = `A resposta anterior não trouxe uma matriz válida. Corrija agora e retorne SOMENTE JSON válido, sem markdown, com uma chave matrix obrigatória: array 2D retangular de strings de cor. Use a Análise da Referência abaixo para criar uma matriz producível. Inclua width, height, palette, materials e summary. Análise: ${JSON.stringify(previous.find(item => item.stage === 1)?.output || {})}`;
          const repairContent = referenceAssetUrl ? [{ type: "text" as const, text: `${repairPrompt}\n\nObserve também a referência visual anexada e derive a grade pela composição real da imagem.` }, { type: "image_url" as const, image_url: { url: referenceAssetUrl, detail: "high" as const } }] : repairPrompt;
          const repairedResponse = await invokeWithRetry([{ role: "system", content: stagePrompts[1] }, { role: "user", content: repairContent }]);
          const repairedOutput = parseOutput(repairedResponse.choices?.[0]?.message?.content);
          if (generateBeadMatrix(repairedOutput)) output = { ...output, ...repairedOutput, matrix: constrainMatrixToPalette(generateBeadMatrix(repairedOutput)!, palette.colors), palette: palette.colors, paletteBox: palette.id, details: `${output.details || ""} Matriz criada em chamada de reparo estruturado.` };
        }
        if ([2, 4, 6].includes(input.stage) && !generateBeadMatrix(output)) {
          const source = previous.find(item => item.stage === 2)?.output || previous.find(item => item.stage === 4)?.output || previous.find(item => item.stage === 6)?.output;
          const generatedMatrix = generateBeadMatrix(source);
          if (generatedMatrix) output = { ...output, matrix: generatedMatrix, palette: output.palette || source?.palette, details: `${output.details || ""} Matriz preservada da etapa visual anterior.` };
          else if (input.stage === 2) {
            let visualDraft: Awaited<ReturnType<typeof analyzeReferenceImage>> | null = null;
            if (referenceAssetUrl) {
              try {
                const referenceResponse = await fetch(referenceAssetUrl);
                if (referenceResponse.ok) visualDraft = await analyzeReferenceImage(Buffer.from(await referenceResponse.arrayBuffer()), project.desiredSize, palette.colors, project.productPreset);
              } catch (visualError) {
                console.warn("[Pixumi] Visual fallback unavailable:", visualError);
              }
            }
            output = buildStage2VisualFallback(output, visualDraft, project.desiredSize); if (input.stage === 2 && generateBeadMatrix(output)) output = { ...output, matrix: constrainMatrixToPalette(generateBeadMatrix(output)!, palette.colors), palette: palette.colors, paletteBox: palette.id };
          }
          else throw new Error("A matriz do Agente 02 não está disponível para esta etapa.");
        }
        const normalizedMatrix = generateBeadMatrix(output);
        if (normalizedMatrix) { const productMatrix = input.stage === 2 ? composeProductMatrix(normalizedMatrix, project.productPreset) : normalizedMatrix; output = { ...output, matrix: input.stage === 2 ? constrainMatrixToPalette(productMatrix, palette.colors) : productMatrix, productPreset: productPreset.id, productModules: productPreset.modules, assemblySteps: productPreset.assemblySteps }; }
        if (Array.isArray(output.matrix) && output.matrix.length) {
          const matrix = output.matrix as string[][];
          const metrics = countMatrix(matrix);
          const validation = validateProduction(matrix, output.width, output.height);
          output = { ...output, width: metrics.width, height: metrics.height, total: metrics.total, byColor: metrics.byColor, physicalWidthMm: metrics.physicalWidthMm, physicalHeightMm: metrics.physicalHeightMm, productionValidation: validation, materials: output.materials || Object.entries(metrics.byColor).map(([color, quantity]) => ({ color, quantity })) };
        }
        await db.update(agentRuns).set({ status: statusAfterAgent(input.stage), output: JSON.stringify(output), completedAt: new Date() }).where(eq(agentRuns.id, runId));
        await db.update(projects).set({ currentStage: input.stage, status: input.stage === 9 ? "AWAITING_REVIEW" : "AWAITING_REVIEW" }).where(eq(projects.id, input.projectId));
        await db.insert(projectEvents).values({ projectId: input.projectId, stage: input.stage, type: "AGENT_COMPLETED", message: `${stageNames[input.stage - 1]} concluído` });
        return { runId, output };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha desconhecida na execução do agente.";
        await db.update(agentRuns).set({ status: "ERROR", errorMessage: message, completedAt: new Date() }).where(eq(agentRuns.id, runId));
        await db.update(projects).set({ status: "ERROR" }).where(eq(projects.id, input.projectId));
        await db.insert(projectEvents).values({ projectId: input.projectId, stage: input.stage, type: "AGENT_ERROR", message: `${stageNames[input.stage - 1]} falhou: ${message}` });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `O agente falhou. Tente novamente. ${message}` });
      }
    }),
    runContinuous: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), startStage: z.number().int().min(1).max(9) })).mutation(async ({ ctx, input }) => {
      if (!appRouterRef) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pipeline ainda não foi inicializado." });
      const caller = appRouterRef.createCaller(ctx);
      const stages = continuousStages(input.startStage);
      const results: unknown[] = [];
      for (const stage of stages) results.push(await caller.projects.runAgent({ projectId: input.projectId, stage }));
      return { success: true, completedStages: stages, results };
    }),
    editMatrix: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), matrix: z.array(z.array(z.string().min(1)).min(1)).min(1) })).mutation(async ({ ctx, input }) => {
      const project = await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const normalized = generateBeadMatrix({ matrix: input.matrix }); if (!normalized) throw new TRPCError({ code: "BAD_REQUEST", message: "A matriz precisa ser retangular e conter pelo menos uma célula." });
      const stageTwo = await db.select().from(agentRuns).where(and(eq(agentRuns.projectId, input.projectId), eq(agentRuns.stage, 2))).orderBy(desc(agentRuns.createdAt)).limit(1);
      if (!stageTwo.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Execute a etapa de criação da matriz antes de editá-la." });
      const currentOutput = parseOutput(stageTwo[0].output); const output = recalculateMatrixOutput(currentOutput, normalized); const metrics = countMatrix(normalized);
      await db.update(agentRuns).set({ status: "NEEDS_REVIEW", output: JSON.stringify(output), reviewInstruction: "Matriz editada manualmente antes da aprovação final." }).where(eq(agentRuns.id, stageTwo[0].id));
      const version = nextVersion(project.version, false); await db.update(projects).set({ currentStage: 2, status: "AWAITING_REVIEW", version }).where(eq(projects.id, input.projectId));
      await db.insert(projectEvents).values({ projectId: input.projectId, stage: 2, type: "MATRIX_EDITED", message: "Matriz editada manualmente e métricas recalculadas" });
      await db.insert(projectVersions).values({ projectId: input.projectId, version, snapshot: JSON.stringify({ stage: 2, matrix: normalized, total: metrics.total, byColor: metrics.byColor }), reason: "Edição manual da matriz" });
      return { success: true, version, output };
    }),
    approve: protectedProcedure.input(stageSchema).mutation(async ({ ctx, input }) => {
      const project = await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(agentRuns).set({ status: "APPROVED" }).where(and(eq(agentRuns.projectId, input.projectId), eq(agentRuns.stage, input.stage), eq(agentRuns.status, "NEEDS_REVIEW")));
      const newStage = Math.min(9, input.stage + 1); const newStatus = input.stage === 9 ? "FINALIZED" : "IN_DEVELOPMENT"; const version = nextVersion(project.version, false);
      await db.update(projects).set({ currentStage: newStage, status: newStatus, version }).where(eq(projects.id, input.projectId));
      await db.insert(projectEvents).values({ projectId: input.projectId, stage: input.stage, type: "APPROVED", message: `${stageNames[input.stage - 1]} aprovado pela usuária` });
      await db.insert(projectVersions).values({ projectId: input.projectId, version, snapshot: JSON.stringify({ stage: input.stage, status: newStatus }), reason: `Aprovação da etapa ${input.stage}` });
      return { success: true, currentStage: newStage };
    }),
    requestRevision: protectedProcedure.input(stageSchema.extend({ reviewInstruction: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(agentRuns).set({ status: "NEEDS_REVIEW", reviewInstruction: input.reviewInstruction }).where(and(eq(agentRuns.projectId, input.projectId), eq(agentRuns.stage, input.stage)));
      await db.update(projects).set({ status: "IN_REVISION" }).where(eq(projects.id, input.projectId));
      await db.insert(projectEvents).values({ projectId: input.projectId, stage: input.stage, type: "REVISION_REQUESTED", message: `Revisão solicitada: ${input.reviewInstruction}` });
      return { success: true };
    }),
    goBack: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), targetStage: z.number().int().min(1).max(9), reason: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      const project = await requireProject(ctx.user.id, input.projectId); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const version = nextVersion(project.version, true); await db.update(projects).set({ currentStage: input.targetStage, status: "IN_REVISION", version }).where(eq(projects.id, input.projectId));
      await db.insert(projectEvents).values({ projectId: input.projectId, stage: input.targetStage, type: "RETURNED", message: `Projeto retornado para a etapa ${input.targetStage}: ${input.reason}` });
      await db.insert(projectVersions).values({ projectId: input.projectId, version, snapshot: JSON.stringify({ returnedTo: input.targetStage, reason: input.reason }), reason: input.reason });
      return { success: true, version, currentStage: input.targetStage };
    }),
  }),
});

appRouterRef = appRouter;

export type AppRouter = typeof appRouter;
