// §6.3 Cross-device persistence for Telegram users.
// Mirrors the localStorage-first profile (see artifacts/game/src/game/profile.ts)
// into Postgres so match history, inventory and achievements survive a device
// switch/reinstall for players identified by their Telegram id. Every write is
// best-effort from the client (fire-and-forget) — localStorage remains the
// source of truth for gameplay; the DB is a durable mirror + read source for
// "restore my progress" and future cross-device/leaderboard features.

import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryTable, matchHistoryTable, achievementsTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureUser } from "../lib/ensureUser";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const router = Router();

interface Identity {
  telegramId: number;
  displayName: string;
  username?: string;
  photoUrl?: string;
}

function parseIdentity(body: Record<string, unknown>): Identity | null {
  const telegramId = body["telegramId"];
  const displayName = body["displayName"];
  if (typeof telegramId !== "number" || !Number.isFinite(telegramId)) return null;
  if (typeof displayName !== "string" || !displayName.trim()) return null;
  return {
    telegramId,
    displayName: displayName.trim().slice(0, 128),
    username: typeof body["username"] === "string" ? body["username"] : undefined,
    photoUrl: typeof body["photoUrl"] === "string" ? body["photoUrl"] : undefined,
  };
}

/**
 * POST /api/sync/match-history
 * Body: { telegramId, displayName, username?, photoUrl?, role, result, fuelSiphoned?, tasksCompleted?, survivedSeconds?, character? }
 */
router.post("/sync/match-history", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const identity = parseIdentity(body);
  const { role, result, fuelSiphoned, tasksCompleted, survivedSeconds, character } = body as {
    role?: string; result?: string; fuelSiphoned?: number; tasksCompleted?: number;
    survivedSeconds?: number; character?: string;
  };

  if (!identity || !role || !result) {
    return res.status(400).json({ error: "telegramId, displayName, role, result required" });
  }

  try {
    await db.transaction(async (tx: Tx) => {
      await ensureUser(tx, identity);
      await tx.insert(matchHistoryTable).values({
        userId: identity.telegramId,
        role,
        result,
        fuelSiphoned: fuelSiphoned ?? 0,
        tasksCompleted: tasksCompleted ?? 0,
        survivedSeconds: survivedSeconds ?? null,
        character: character ?? null,
      });
      const [current] = await tx
        .select({ totalMatches: usersTable.totalMatches, totalWins: usersTable.totalWins })
        .from(usersTable)
        .where(eq(usersTable.telegramId, identity.telegramId))
        .limit(1);
      await tx
        .update(usersTable)
        .set({
          totalMatches: (current?.totalMatches ?? 0) + 1,
          totalWins: result === "win" ? (current?.totalWins ?? 0) + 1 : current?.totalWins,
        })
        .where(eq(usersTable.telegramId, identity.telegramId));
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record match history" });
  }
});

/**
 * POST /api/sync/inventory
 * Body: { telegramId, displayName, username?, photoUrl?, itemType, itemId, equipped? }
 * Upserts one owned cosmetic item (idempotent — safe to call on every purchase/equip).
 */
router.post("/sync/inventory", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const identity = parseIdentity(body);
  const { itemType, itemId, equipped } = body as { itemType?: string; itemId?: string; equipped?: boolean };

  if (!identity || !itemType || !itemId) {
    return res.status(400).json({ error: "telegramId, displayName, itemType, itemId required" });
  }

  try {
    await db.transaction(async (tx: Tx) => {
      await ensureUser(tx, identity);
      await tx
        .insert(inventoryTable)
        .values({ userId: identity.telegramId, itemType, itemId, equipped: equipped ?? false })
        .onConflictDoUpdate({
          target: [inventoryTable.userId, inventoryTable.itemType, inventoryTable.itemId],
          set: { equipped: equipped ?? false },
        });
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sync inventory item" });
  }
});

/**
 * POST /api/sync/achievement
 * Body: { telegramId, displayName, username?, photoUrl?, achievementId }
 */
router.post("/sync/achievement", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const identity = parseIdentity(body);
  const { achievementId } = body as { achievementId?: string };

  if (!identity || !achievementId) {
    return res.status(400).json({ error: "telegramId, displayName, achievementId required" });
  }

  try {
    await db.transaction(async (tx: Tx) => {
      await ensureUser(tx, identity);
      await tx
        .insert(achievementsTable)
        .values({ userId: identity.telegramId, achievementId })
        .onConflictDoNothing();
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sync achievement" });
  }
});

/**
 * GET /api/sync/profile/:telegramId
 * Returns everything needed to restore progress on a new device: recent match
 * history, owned inventory, and unlocked achievements.
 */
router.get("/sync/profile/:telegramId", async (req, res) => {
  const telegramId = Number(req.params["telegramId"]);
  if (!Number.isFinite(telegramId)) {
    return res.status(400).json({ error: "telegramId must be a number" });
  }

  try {
    const [user, inventory, achievements, matchHistory] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId)).limit(1),
      db.select().from(inventoryTable).where(eq(inventoryTable.userId, telegramId)),
      db.select().from(achievementsTable).where(eq(achievementsTable.userId, telegramId)),
      db.select().from(matchHistoryTable).where(eq(matchHistoryTable.userId, telegramId)).orderBy(desc(matchHistoryTable.playedAt)).limit(20),
    ]);

    if (user.length === 0) {
      return res.status(404).json({ error: "No synced profile for this Telegram user yet" });
    }

    return res.json({ user: user[0], inventory, achievements, matchHistory });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load synced profile" });
  }
});

export default router;
