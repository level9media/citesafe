import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

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
  // Stripe customer ID — stored here so we can look up subscriptions
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Job Sites — named locations that group inspections
export const jobSites = mysqlTable("job_sites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  description: text("description"),
  riskScore: float("riskScore").notNull().default(0), // 0–100
  totalInspections: int("totalInspections").notNull().default(0),
  totalViolations: int("totalViolations").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobSite = typeof jobSites.$inferSelect;
export type InsertJobSite = typeof jobSites.$inferInsert;

// Inspections table — stores every OSHA analysis result
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orgId: int("orgId"), // nullable — set for Team plan users
  jobSiteId: int("jobSiteId"), // nullable — can be unassigned
  status: mysqlEnum("status", ["violation", "clear", "unclear"]).notNull(),
  headline: varchar("headline", { length: 255 }).notNull(),
  citation: varchar("citation", { length: 100 }).notNull().default(""),
  analysis: text("analysis").notNull(),
  severity: varchar("severity", { length: 64 }).notNull().default("none"),
  maxPenalty: varchar("maxPenalty", { length: 64 }).notNull().default("N/A"),
  confidence: int("confidence").notNull().default(0),
  fullResult: text("fullResult").notNull(), // JSON blob
  imageUrl: varchar("imageUrl", { length: 1024 }), // S3 URL of uploaded photo
  inspectorName: varchar("inspectorName", { length: 255 }), // name at time of inspection
  locationLabel: varchar("locationLabel", { length: 255 }), // e.g. "Building A - Level 2"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// Corrective Actions — AI-generated fix steps per inspection
export const correctiveActions = mysqlTable("corrective_actions", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  userId: int("userId").notNull(),
  steps: text("steps").notNull(), // JSON array of step strings
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type InsertCorrectiveAction = typeof correctiveActions.$inferInsert;

// OSHA 300 Log — recordable incident mapping
export const osha300Log = mysqlTable("osha_300_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inspectionId: int("inspectionId").notNull(),
  jobSiteId: int("jobSiteId"),
  incidentType: mysqlEnum("incidentType", [
    "injury",
    "illness",
    "near_miss",
    "property_damage",
    "environmental",
  ]).notNull(),
  recordable: int("recordable").notNull().default(1), // 1 = yes, 0 = no
  cfr: varchar("cfr", { length: 100 }).notNull().default(""),
  description: text("description").notNull(),
  correctiveActionTaken: text("correctiveActionTaken"),
  incidentDate: timestamp("incidentDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Osha300Log = typeof osha300Log.$inferSelect;
export type InsertOsha300Log = typeof osha300Log.$inferInsert;

// Organizations — Team plan workspaces
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // user who created the org (Team subscriber)
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Team Members — users belonging to an org
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "member"]).notNull().default("member"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// Subscriptions table — one active row per user
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 64 }).notNull(),
  plan: mysqlEnum("plan", ["pro", "team"]).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"), // active | past_due | canceled
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
