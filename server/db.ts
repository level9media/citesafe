import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { inspections, users } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import type { InsertInspection } from "../drizzle/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  if (!db) {
    const pool = mysql.createPool(ENV.databaseUrl);
    db = drizzle(pool);
  }
  return db!;
}

export async function upsertUser(data: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}) {
  const database = getDb();
  const existing = await database
    .select()
    .from(users)
    .where(eq(users.openId, data.openId))
    .limit(1);

  if (existing.length > 0) {
    const updateData: Partial<typeof users.$inferInsert> = {
      lastSignedIn: new Date(),
    };
    if (data.name != null) updateData.name = data.name;
    if (data.email != null) updateData.email = data.email;
    if (data.loginMethod != null) updateData.loginMethod = data.loginMethod;

    // Auto-promote owner to admin
    if (ENV.ownerOpenId && data.openId === ENV.ownerOpenId) {
      updateData.role = "admin";
    }

    await database
      .update(users)
      .set(updateData)
      .where(eq(users.openId, data.openId));

    const updated = await database
      .select()
      .from(users)
      .where(eq(users.openId, data.openId))
      .limit(1);
    return updated[0];
  }

  const insertData: typeof users.$inferInsert = {
    openId: data.openId,
    name: data.name ?? null,
    email: data.email ?? null,
    loginMethod: data.loginMethod ?? null,
    role:
      ENV.ownerOpenId && data.openId === ENV.ownerOpenId ? "admin" : "user",
    lastSignedIn: new Date(),
  };

  await database.insert(users).values(insertData);
  const created = await database
    .select()
    .from(users)
    .where(eq(users.openId, data.openId))
    .limit(1);
  return created[0];
}

export async function getUserByOpenId(openId: string) {
  const database = getDb();
  const result = await database
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0] ?? null;
}

// ── Inspection queries ──────────────────────────────────────

export async function createInspection(data: InsertInspection) {
  const database = getDb()!;
  await database.insert(inspections).values(data);
  const created = await database
    .select()
    .from(inspections)
    .where(eq(inspections.userId, data.userId))
    .orderBy(desc(inspections.createdAt))
    .limit(1);
  return created[0];
}

export async function getInspectionsByUser(userId: number, limit = 50) {
  const database = getDb()!;
  return database
    .select()
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .orderBy(desc(inspections.createdAt))
    .limit(limit);
}

export async function deleteInspection(id: number, userId: number) {
  const database = getDb()!;
  await database
    .delete(inspections)
    .where(eq(inspections.id, id));
  return { success: true };
}

export async function getInspectionCountThisMonth(userId: number) {
  const database = getDb()!;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const results = await database
    .select()
    .from(inspections)
    .where(eq(inspections.userId, userId));

  return results.filter((r: { createdAt: Date }) => new Date(r.createdAt) >= startOfMonth).length;
}
