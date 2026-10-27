"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const MUTE_KEY = "chm-music-muted";
const VOLUME_KEY = "chm-music-volume";

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storeValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be disabled; the player still works for this page view.
  }
}

export function BackgroundMusic({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.55);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const storedVolume = Number(readStoredValue(VOLUME_KEY));
    const initialVolume =
      Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1
        ? storedVolume
        : 0.55;
    audio.volume = initialVolume;
    // Persisted client-only preferences are applied once when the player mounts.
    setVolume(initialVolume);

    if (readStoredValue(MUTE_KEY) === "1") {
      audio.muted = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMuted(true);
      void audio.play().catch(() => undefined);
      return;
    }

    audio.muted = false;
    void audio
      .play()
      .then(() => {
        setMuted(false);
        setNeedsGesture(false);
      })
      .catch(() => {
        // Browsers block audible autoplay until a user gesture. Start muted so
        // the track is ready, then unmute on the first real interaction.
        audio.muted = true;
        setMuted(true);
        setNeedsGesture(true);
        void audio.play().catch(() => undefined);
      });
  }, [src]);

  useEffect(() => {
    if (!needsGesture || readStoredValue(MUTE_KEY) === "1") return;

    function canHandleTarget(target: EventTarget | null) {
      return !(
        target instanceof HTMLElement &&
        target.closest("button, input, select, textarea, a, [role='button']")
      );
    }

    function enableSound(event: Event) {
      if (!canHandleTarget(event.target)) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = false;
      void audio
        .play()
        .then(() => {
          setMuted(false);
          setNeedsGesture(false);
          storeValue(MUTE_KEY, "0");
        })
        .catch(() => undefined);
    }

    window.addEventListener("click", enableSound, { once: true });
    window.addEventListener("keydown", enableSound, { once: true });
    return () => {
      window.removeEventListener("click", enableSound);
      window.removeEventListener("keydown", enableSound);
    };
  }, [needsGesture]);

  function toggleMute(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
    setNeedsGesture(false);
    storeValue(MUTE_KEY, nextMuted ? "1" : "0");

    if (!nextMuted) {
      void audio.play().catch(() => {
        setMuted(true);
        storeValue(MUTE_KEY, "1");
      });
    }
  }

  function changeVolume(nextValue: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.min(1, Math.max(0, nextValue));
    audio.volume = next;
    setVolume(next);
    storeValue(VOLUME_KEY, String(next));

    if (next === 0) {
      audio.muted = true;
      setMuted(true);
      setNeedsGesture(false);
      storeValue(MUTE_KEY, "1");
      return;
    }

    if (muted) {
      audio.muted = false;
      setMuted(false);
      setNeedsGesture(false);
      storeValue(MUTE_KEY, "0");
      void audio.play().catch(() => undefined);
    }
  }

  if (!available) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-line-strong/70 bg-cream-50/95 px-2 py-1.5 text-forest-900 shadow-[0_18px_50px_-25px_rgb(20_33_26/0.55)] backdrop-blur">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={
          muted ? "Unmute background music" : "Mute background music"
        }
        title={muted ? "Unmute background music" : "Mute background music"}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-forest-900/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800"
      >
        {muted ? (
          <VolumeX className="size-4" aria-hidden="true" />
        ) : (
          <Volume2 className="size-4" aria-hidden="true" />
        )}
      </button>

      <div className="flex items-center gap-2 pr-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
          aria-label="Background music volume"
          className="h-1.5 w-20 cursor-pointer accent-forest-800"
        />
        <span className="w-7 text-right text-[0.62rem] font-semibold tabular-nums text-muted">
          {Math.round(volume * 100)}
        </span>
      </div>

      {needsGesture && (
        <span className="max-w-[7.5rem] pr-1 text-[0.62rem] leading-tight text-muted">
          Tap for sound
        </span>
      )}

      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        onError={() => setAvailable(false)}
        aria-label={`Background music: ${title}`}
        className="hidden"
      />
    </div>
  );
}
