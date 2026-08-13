import type { InvokeParams, InvokeResult, MessageContent } from "./llm";

const apiBase = "https://generativelanguage.googleapis.com/v1beta/models";

function key() {
  const value = process.env.GEMINI_API_KEY?.trim();
  if (!value) throw new Error("GEMINI_API_KEY não configurada.");
  return value;
}

async function imagePart(url: string) {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível baixar a referência visual (${response.status}).`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { inlineData: { mimeType: contentType.split(";")[0], data } };
}

async function contentParts(content: MessageContent | MessageContent[]) {
  const list = Array.isArray(content) ? content : [content];
  const result: Array<Record<string, unknown>> = [];
  for (const item of list) {
    if (typeof item === "string") result.push({ text: item });
    else if (item.type === "text") result.push({ text: item.text });
    else if (item.type === "image_url") result.push(await imagePart(item.image_url.url));
    else if (item.type === "file_url") result.push({ text: `Arquivo de referência: ${item.file_url.url}` });
  }
  return result;
}

export async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const model = params.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const contents = [] as Array<{ role: string; parts: Array<Record<string, unknown>> }>;
  const systemTexts: string[] = [];
  for (const message of params.messages) {
    const parts = await contentParts(message.content);
    if (message.role === "system") {
      systemTexts.push(parts.map(part => typeof part.text === "string" ? part.text : "").join("\n"));
      continue;
    }
    contents.push({ role: message.role === "assistant" ? "model" : "user", parts });
  }
  const schema = params.outputSchema || params.output_schema;
  const responseFormat = params.responseFormat || params.response_format;
  const generationConfig: Record<string, unknown> = {};
  const maxTokens = params.maxTokens ?? params.max_tokens;
  if (maxTokens) generationConfig.maxOutputTokens = maxTokens;
  if (schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = schema.schema;
  } else if (responseFormat?.type === "json_object" || responseFormat?.type === "json_schema") {
    generationConfig.responseMimeType = "application/json";
    if (responseFormat.type === "json_schema") generationConfig.responseSchema = responseFormat.json_schema.schema;
  }
  const url = `${apiBase}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key())}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...(systemTexts.length ? { systemInstruction: { parts: [{ text: systemTexts.join("\n\n") }] } } : {}),
      contents,
      generationConfig,
    }),
  });
  if (!response.ok) throw new Error(`Gemini invoke failed: ${response.status} ${response.statusText} – ${await response.text()}`);
  const payload = await response.json() as any;
  const text = payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || "";
  return {
    id: payload.responseId || `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: payload.candidates?.[0]?.finishReason || null }],
  };
}
