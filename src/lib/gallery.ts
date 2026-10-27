export type GalleryMedia = "IMAGE" | "VIDEO";

export function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|ogv|mov)(?:[?#]|$)/i.test(url);
}

/**
 * Converts common YouTube and Vimeo links into embeddable URLs. Direct video
 * files are returned unchanged so they can be rendered with a <video> tag.
 */
export function getVideoEmbedUrl(url: string): string | null {
  // Uploaded gallery videos use a local, root-relative URL. They are already
  // direct media files, so return them before trying to parse an absolute URL.
  if (/^\/(uploads|images)\//.test(url) && isDirectVideo(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (isDirectVideo(url)) return url;

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
    return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = parsed.pathname.match(/(?:video\/)?(\d+)/);
    return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return null;
}
