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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Inspections table — stores every OSHA analysis result
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["violation", "clear", "unclear"]).notNull(),
  headline: varchar("headline", { length: 255 }).notNull(),
  citation: varchar("citation", { length: 100 }).notNull().default(""),
  analysis: text("analysis").notNull(),
  severity: varchar("severity", { length: 64 }).notNull().default("none"),
  maxPenalty: varchar("maxPenalty", { length: 64 }).notNull().default("N/A"),
  confidence: int("confidence").notNull().default(0),
  fullResult: text("fullResult").notNull(), // JSON blob
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
