import { describe, expect, it } from "vitest";
import { parseOutput } from "./routers";

describe("parseOutput", () => {
  it("parses JSON wrapped in a markdown code fence", () => {
    expect(parseOutput('```json\n{"summary":"ok","status":"CONCLUÍDO"}\n```')).toEqual({ summary: "ok", status: "CONCLUÍDO" });
  });
});
