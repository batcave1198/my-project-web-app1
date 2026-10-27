import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type ActiveMusicTrack = {
  id: string;
  title: string;
  url: string;
};

/**
 * Returns the one track the storefront should play. The admin action enforces
 * a single active row, but ordering keeps this deterministic if old data has
 * more than one row marked active.
 */
export const getActiveMusicTrack = cache(
  async (): Promise<ActiveMusicTrack | null> => {
    try {
      const track = await db.musicTrack.findFirst({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, url: true },
      });
      return track;
    } catch {
      return null;
    }
  },
);
