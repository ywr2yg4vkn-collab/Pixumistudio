import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerPersonalAuthRoutes } from "./personalAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Creates the production API application without opening a TCP listener.
 * Vercel imports this factory through api/index.ts; local development uses
 * the same factory from server/_core/index.ts.
 */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");

  // Reference uploads and AI responses can be larger than the Express default.
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPersonalAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "pixumi-studio-api" });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[API] Unhandled request error", error);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
