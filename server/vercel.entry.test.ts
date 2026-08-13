import { describe, expect, it } from "vitest";
import { createApp } from "./_core/app";

describe("Vercel serverless entrypoint", () => {
  it("creates the Express application without starting a listener", () => {
    const app = createApp();
    expect(typeof app).toBe("function");
    expect(app).toHaveProperty("_router");
  });
});
