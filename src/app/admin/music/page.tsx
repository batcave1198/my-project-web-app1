import type { Metadata } from "next";
import { AudioLines, Music2, Pause, Play, Trash2 } from "lucide-react";
import { MusicForm } from "@/components/admin/music-form";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  deleteMusicTrack,
  setMusicTrackActive,
} from "@/lib/actions/music";

export const metadata: Metadata = {
  title: "Background music",
};

export default async function AdminMusicPage() {
  await requireStaff("/admin/music");
  const tracks = await db.musicTrack.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const active = tracks.find((track) => track.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-earth-500 uppercase">
            Content
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">
            Background music
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Add music for the storefront. Visitors see a mute and volume control
            in the corner of every storefront page. Music is not played in the
            admin dashboard.
          </p>
        </div>
        <div className="rounded-md border border-line bg-white px-4 py-2 text-sm">
          <span className="text-muted">Storefront: </span>
          <span className="font-semibold text-forest-900">
            {active ? active.title : "No track active"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <MusicForm />

        <section className="rounded-lg border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-forest-900">
                Music library
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {tracks.length} track{tracks.length === 1 ? "" : "s"}
              </p>
            </div>
            <AudioLines className="size-5 text-gold-600" />
          </div>

          {tracks.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Music2 className="mx-auto size-8 text-gold-600" />
              <p className="mt-3 text-sm font-medium text-forest-900">
                No music uploaded yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                Add the first track with the form beside this panel. It will be
                available to the storefront immediately.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {tracks.map((track) => (
                <li key={track.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-forest-900">
                          {track.title}
                        </h3>
                        {track.isActive && (
                          <span className="rounded-full bg-forest-900/8 px-2 py-0.5 text-[0.62rem] font-bold tracking-wide text-forest-900 uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-all text-xs text-muted">
                        {track.url}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <form
                        action={async () => {
                          "use server";
                          await setMusicTrackActive(track.id, !track.isActive);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800 hover:underline"
                        >
                          {track.isActive ? (
                            <>
                              <Pause className="size-3.5" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="size-3.5" />
                              Play on site
                            </>
                          )}
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await deleteMusicTrack(track.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <audio
                    src={track.url}
                    controls
                    preload="none"
                    className="mt-4 w-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!active && tracks.length > 0 && (
        <p className="rounded-md border border-dashed border-line-strong bg-cream-100/60 px-4 py-3 text-sm text-muted">
          Music is currently off. Choose “Play on site” on one track to enable
          it.
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Browsers block audible autoplay until a visitor interacts with the page.
        The player starts muted and shows a “Tap for sound” prompt, so playback
        still begins automatically.
      </p>
    </div>
  );
}
