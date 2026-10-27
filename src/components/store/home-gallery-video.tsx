"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react";

export type HomeGalleryVideoProps = {
  title: string | null;
  caption: string | null;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
};

export function HomeGalleryVideo({
  title,
  caption,
  description,
  videoUrl,
  thumbnailUrl,
}: HomeGalleryVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) videoRef.current?.pause();
  }, []);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next && video.paused) {
      void video.play().catch(() => undefined);
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }

  const displayCaption =
    caption?.trim() ||
    title?.trim() ||
    description?.trim() ||
    "A moment from our Sri Lankan pantry.";

  return (
    <section
      aria-label="Featured gallery video"
      className="w-full lg:w-[35vw] lg:min-w-[320px] lg:max-w-[520px]"
    >
      <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-forest-950 shadow-[0_30px_80px_-45px_rgb(20_33_26)]">
        <div className="relative aspect-[4/3] bg-forest-950">
          {failed ? (
            thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={title ?? "Ceylon herbs and spices"}
                fill
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-forest-900 px-6 text-center text-sm text-cream-200/75">
                The featured gallery video is unavailable right now.
              </div>
            )
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl ?? undefined}
              autoPlay
              muted={muted}
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
              aria-label={title ?? "Gallery video"}
            />
          )}

          {!failed && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/90 via-forest-950/35 to-transparent p-4 pt-16">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-gold-300 uppercase">
                    From the gallery
                  </p>
                  <p className="mt-1 line-clamp-2 font-display text-xl leading-snug text-cream-50">
                    {displayCaption}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause video" : "Play video"}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-cream-50/15 text-cream-50 backdrop-blur transition-colors hover:bg-cream-50/25"
                  >
                    {playing ? (
                      <Pause className="size-4 fill-current" />
                    ) : (
                      <Play className="ml-0.5 size-4 fill-current" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute video" : "Mute video"}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-cream-50/15 text-cream-50 backdrop-blur transition-colors hover:bg-cream-50/25"
                  >
                    {muted ? (
                      <VolumeX className="size-4" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-cream-100/10 px-4 py-3">
          <p className="line-clamp-1 text-xs text-cream-200/65">
            {title?.trim() || "Ceylon Herbs and Spices"}
          </p>
          <Link
            href="/gallery"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gold-300 transition-colors hover:text-gold-200"
          >
            View gallery
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
