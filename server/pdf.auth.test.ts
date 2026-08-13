import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("projects.exportPdf", () => {
  it("rejects unauthenticated export requests", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.projects.exportPdf({ projectId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
