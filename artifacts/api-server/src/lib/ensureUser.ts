// Shared helper: upsert a minimal `users` row so FK-dependent writes
// (inventory, match_history, achievements, daily_leaderboard) never fail
// with a foreign-key violation for a Telegram user we haven't seen before.

import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

// Transaction type extracted from the db instance — avoids importing drizzle internals.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface EnsureUserInput {
  telegramId: number;
  displayName: string;
  username?: string | null;
  photoUrl?: string | null;
  preferredCharacter?: string | null;
}

/**
 * Insert the user row if it doesn't exist yet; otherwise touch `lastSeen`
 * and refresh a couple of display fields. Safe to call on every sync write.
 */
export async function ensureUser(tx: Tx, input: EnsureUserInput): Promise<void> {
  await tx
    .insert(usersTable)
    .values({
      telegramId: input.telegramId,
      displayName: input.displayName || `Игрок ${input.telegramId}`,
      username: input.username ?? null,
      photoUrl: input.photoUrl ?? null,
      preferredCharacter: input.preferredCharacter ?? "denis",
    })
    .onConflictDoUpdate({
      target: usersTable.telegramId,
      set: {
        displayName: input.displayName || sql`${usersTable.displayName}`,
        username: input.username ?? sql`${usersTable.username}`,
        photoUrl: input.photoUrl ?? sql`${usersTable.photoUrl}`,
        lastSeen: sql`now()`,
      },
    });
}
