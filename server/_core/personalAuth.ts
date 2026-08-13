import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import type { User } from "../../drizzle/schema";

export const PERSONAL_COOKIE_NAME = "pixumi_personal_session";
const PERSONAL_OPEN_ID = "personal-owner";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function configuredPassword() {
  return process.env.PERSONAL_PASSWORD?.trim() || "";
}

export function isPersonalAuthConfigured() {
  return configuredPassword().length >= 8;
}

function secretKey() {
  const secret = process.env.JWT_SECRET || process.env.PERSONAL_SESSION_SECRET || "";
  return new TextEncoder().encode(secret);
}

function passwordMatches(input: string) {
  const expected = configuredPassword();
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

async function issueSession() {
  return new SignJWT({ openId: PERSONAL_OPEN_ID, name: process.env.PERSONAL_USERNAME || "Diretora criativa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

function readCookie(req: Request) {
  const raw = req.headers.cookie || "";
  const item = raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${PERSONAL_COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(PERSONAL_COOKIE_NAME.length + 1)) : null;
}

export async function authenticatePersonalRequest(req: Request): Promise<User | null> {
  if (!isPersonalAuthConfigured() || !process.env.JWT_SECRET) return null;
  const token = readCookie(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.openId !== PERSONAL_OPEN_ID) return null;
    return (await getUserByOpenId(PERSONAL_OPEN_ID)) || null;
  } catch {
    return null;
  }
}

function page(message = "") {
  const safe = message.replace(/[<>&\"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&#39;" }[char] || char));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixumi Studio — acesso pessoal</title><style>body{font-family:Georgia,serif;background:#f6f4f0;color:#2d2926;min-height:100vh;display:grid;place-items:center;margin:0}.card{background:#fffaf5;border:1px solid #ded6cd;padding:36px;max-width:360px;width:calc(100% - 48px);box-shadow:0 18px 50px #2d29261a}h1{font-size:28px;margin:0 0 8px}p{font-family:Arial,sans-serif;color:#746b63;line-height:1.5}label{display:block;font:13px Arial,sans-serif;margin:22px 0 7px}input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #cfc4b9;background:#fff;font-size:16px}button{margin-top:24px;width:100%;padding:13px;border:0;background:#a66f5a;color:#fff;font-weight:700;font-size:15px;cursor:pointer}.error{color:#a33b32;font:13px Arial,sans-serif}</style></head><body><main class="card"><h1>Pixumi Studio</h1><p>Acesso pessoal independente.</p>${safe ? `<div class="error">${safe}</div>` : ""}<form method="post" action="/api/personal-login"><label for="username">Usuário</label><input id="username" name="username" autocomplete="username" required><label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Entrar no estúdio</button></form></main></body></html>`;
}

export function registerPersonalAuthRoutes(app: Express) {
  app.get("/api/personal-login", (_req, res) => {
    if (!isPersonalAuthConfigured()) return res.status(503).send(page("Configure PERSONAL_PASSWORD na Vercel antes de entrar."));
    return res.type("html").send(page());
  });
  app.post("/api/personal-login", async (req: Request, res: Response) => {
    const username = String(req.body?.username || "");
    const password = String(req.body?.password || "");
    const expectedUser = process.env.PERSONAL_USERNAME?.trim() || "pixumi";
    if (!isPersonalAuthConfigured() || !process.env.JWT_SECRET) return res.status(503).send(page("A autenticação pessoal não está configurada."));
    if (username !== expectedUser || !passwordMatches(password)) return res.status(401).type("html").send(page("Usuário ou senha inválidos."));
    await upsertUser({ openId: PERSONAL_OPEN_ID, name: process.env.PERSONAL_DISPLAY_NAME || "Diretora criativa", email: null, loginMethod: "personal" });
    const token = await issueSession();
    res.cookie(PERSONAL_COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: SESSION_MAX_AGE_SECONDS * 1000 });
    return res.redirect("/");
  });
}

export function clearPersonalSession(req: Request, res: Response) {
  res.clearCookie(PERSONAL_COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: 0 });
}
