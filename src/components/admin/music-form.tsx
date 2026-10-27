"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Music2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import {
  saveMusicTrack,
  type MusicActionState,
} from "@/lib/actions/music";

const initialState: MusicActionState = { status: "idle" };

export function MusicForm() {
  const router = useRouter();
  const [state, setState] = useState<MusicActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "music");
      const response = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Upload failed");
      setUrl(json.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await saveMusicTrack(state, formData);
      setState(result);
      if (result.status === "success") {
        setUrl("");
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div className="rounded-lg border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-900/6">
            <Music2 className="size-4 text-forest-800" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-forest-900">
              Add a track
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Upload an MP3, M4A, OGG, WAV or WebM file (max 20MB), or paste a
              direct audio URL. Only one track can play on the storefront at a
              time.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="title">Track title</Label>
            <Input
              id="title"
              name="title"
              maxLength={120}
              placeholder="e.g. Ceylon morning"
              className="mt-1.5"
            />
            <FieldError>{state.fieldErrors?.title}</FieldError>
          </div>

          <div>
            <Label>Audio file</Label>
            <div className="mt-1.5 rounded-md border border-line bg-cream-100/60 p-4">
              {url ? (
                <audio
                  src={url}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              ) : (
                <p className="text-sm text-muted">No audio selected yet.</p>
              )}
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-forest-900 hover:underline">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm"
                  className="hidden"
                  onChange={(event) => {
                    void upload(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploading ? "Uploading..." : "Upload audio (max 20MB)"}
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="url">Or audio URL</Label>
            <Input
              id="url"
              name="url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://.../track.mp3"
              className="mt-1.5"
            />
            <FieldError>{state.fieldErrors?.url}</FieldError>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
                className="mt-1.5"
              />
              <FieldError>{state.fieldErrors?.sortOrder}</FieldError>
            </div>

            <label className="flex items-start gap-2 self-end pb-1 text-sm font-medium text-forest-900">
              <input
                type="checkbox"
                name="isActive"
                className="mt-0.5 size-4 accent-forest-800"
              />
              <span>
                Play on the storefront
                <span className="mt-1 block text-xs font-normal leading-relaxed text-muted">
                  This replaces the currently active track.
                </span>
              </span>
            </label>
          </div>
        </div>

        <Button type="submit" className="mt-5" disabled={pending || uploading}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? "Saving..." : "Add track"}
        </Button>
      </div>
    </form>
  );
}
