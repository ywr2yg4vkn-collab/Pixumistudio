import type { Express } from "express";
import { ENV } from "./env";
import { r2SignedUrl } from "../r2Storage";

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) return res.status(400).send("Missing storage key");
    try {
      const url = await r2SignedUrl(key);
      res.set("Cache-Control", "private, max-age=300");
      return res.redirect(307, url);
    } catch (err) {
      console.error("[R2StorageProxy] failed:", err);
      return res.status(502).send("R2 storage error");
    }
  });

  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) return res.status(400).send("Missing storage key");
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) return res.status(500).send("Legacy storage is not configured");
    try {
      const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
      if (!forgeResp.ok) return res.status(502).send("Legacy storage backend error");
      const { url } = await forgeResp.json() as { url: string };
      if (!url) return res.status(502).send("Empty signed URL from legacy storage");
      res.set("Cache-Control", "no-store");
      return res.redirect(307, url);
    } catch (err) {
      console.error("[LegacyStorageProxy] failed:", err);
      return res.status(502).send("Legacy storage proxy error");
    }
  });
}
