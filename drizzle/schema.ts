import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  productType: varchar("productType", { length: 120 }).notNull(),
  productPreset: varchar("productPreset", { length: 60 }).default("keychain-single"),
  productSpec: text("productSpec"),
  desiredSize: varchar("desiredSize", { length: 120 }),
  notes: text("notes"),
  economyPreference: varchar("economyPreference", { length: 120 }),
  paletteBox: varchar("paletteBox", { length: 40 }).default("studio-48"),
  instructions: text("instructions"),
  referenceUrl: text("referenceUrl"),
  referenceKey: text("referenceKey"),
  status: mysqlEnum("status", ["DRAFT", "IN_ANALYSIS", "IN_DEVELOPMENT", "AWAITING_REVIEW", "IN_REVISION", "APPROVED", "FINALIZED", "ARCHIVED", "ERROR"]).default("DRAFT").notNull(),
  currentStage: int("currentStage").default(1).notNull(),
  version: varchar("version", { length: 16 }).default("01.0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agentRuns = mysqlTable("agentRuns", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stage: int("stage").notNull(),
  agentName: varchar("agentName", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["RUNNING", "COMPLETED", "NEEDS_REVIEW", "APPROVED", "ERROR"]).default("RUNNING").notNull(),
  prompt: text("prompt").notNull(),
  output: text("output"),
  reviewInstruction: text("reviewInstruction"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const projectEvents = mysqlTable("projectEvents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stage: int("stage"),
  type: varchar("type", { length: 60 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectVersions = mysqlTable("projectVersions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  version: varchar("version", { length: 16 }).notNull(),
  snapshot: text("snapshot").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type ProjectEvent = typeof projectEvents.$inferSelect;
export type ProjectVersion = typeof projectVersions.$inferSelect;
