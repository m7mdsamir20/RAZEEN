"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ImagePlus, X, AlertCircle, Loader2, Play } from "lucide-react";

const MAX_IMAGES = 10;
const MAX_VIDEOS = 2;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 120;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

interface MediaBase {
  /** Stable key for React and for removal — the object URL is unique per file. */
  id: string;
  file: File;
  previewUrl: string;
}

export interface PendingImage extends MediaBase {
  kind: "image";
}

export interface PendingVideo extends MediaBase {
  kind: "video";
  durationSec: number;
  /** Poster frame grabbed in the browser, so the server never decodes video. */
  poster: Blob | null;
  posterUrl: string | null;
}

export type PendingMedia = PendingImage | PendingVideo;

interface MediaUploaderProps {
  media: PendingMedia[];
  onChange: (media: PendingMedia[]) => void;
  disabled?: boolean;
}

/** Split a mixed list back into the two kinds the upload endpoints expect. */
export function splitMedia(media: PendingMedia[]) {
  return {
    images: media.filter((item): item is PendingImage => item.kind === "image"),
    videos: media.filter((item): item is PendingVideo => item.kind === "video"),
  };
}

/** Release every object URL a list is holding. */
export function revokeMedia(media: PendingMedia[]) {
  for (const item of media) {
    URL.revokeObjectURL(item.previewUrl);
    if (item.kind === "video" && item.posterUrl) {
      URL.revokeObjectURL(item.posterUrl);
    }
  }
}

/**
 * Reads a video's duration and grabs a frame, entirely client-side.
 * Rejects files the browser cannot decode, which also filters out mislabelled
 * uploads before they reach the server.
 */
function inspectVideo(
  file: File
): Promise<{ durationSec: number; poster: Blob | null; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const fail = (reason: string) => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error(reason));
    };

    video.onerror = () => fail("undecodable");

    video.onloadedmetadata = () => {
      const durationSec = video.duration;

      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        fail("undecodable");
        return;
      }

      // Seek a little in — frame zero is often black.
      video.currentTime = Math.min(1, durationSec / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ durationSec: video.duration, poster: null, previewUrl });
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (poster) => resolve({ durationSec: video.duration, poster, previewUrl }),
        "image/jpeg",
        0.8
      );
    };

    video.src = previewUrl;
  });
}

let nextId = 0;

/**
 * One picker for everything a listing shows: photos and clips go through the
 * same button and sit in the same gallery, because to the publisher they are
 * simply "the pictures of my property". The two kinds are only told apart
 * where it matters — the per-kind limits, and the two upload endpoints.
 */
export function MediaUploader({
  media,
  onChange,
  disabled = false,
}: MediaUploaderProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  const { images, videos } = splitMedia(media);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setError("");
    const incoming = Array.from(fileList);

    // Count what is arriving before accepting any of it, so a batch that
    // busts a limit is rejected whole rather than half-applied.
    const incomingImages = incoming.filter((f) => IMAGE_TYPES.includes(f.type));
    const incomingVideos = incoming.filter((f) => VIDEO_TYPES.includes(f.type));

    if (incomingImages.length + incomingVideos.length !== incoming.length) {
      setError(t("media.invalidType"));
      return;
    }
    if (images.length + incomingImages.length > MAX_IMAGES) {
      setError(t("media.tooManyImages", { max: MAX_IMAGES }));
      return;
    }
    if (videos.length + incomingVideos.length > MAX_VIDEOS) {
      setError(t("media.tooManyVideos", { max: MAX_VIDEOS }));
      return;
    }

    setIsReading(true);
    const accepted: PendingMedia[] = [];

    try {
      for (const file of incoming) {
        if (IMAGE_TYPES.includes(file.type)) {
          if (file.size > MAX_IMAGE_SIZE) {
            setError(t("media.imageTooLarge", { max: 5 }));
            revokeMedia(accepted);
            return;
          }

          accepted.push({
            kind: "image",
            id: `m${nextId++}`,
            file,
            previewUrl: URL.createObjectURL(file),
          });
          continue;
        }

        if (file.size > MAX_VIDEO_SIZE) {
          setError(t("media.videoTooLarge", { max: 50 }));
          revokeMedia(accepted);
          return;
        }

        let inspected;
        try {
          inspected = await inspectVideo(file);
        } catch {
          setError(t("media.undecodable"));
          revokeMedia(accepted);
          return;
        }

        if (inspected.durationSec > MAX_VIDEO_SECONDS) {
          URL.revokeObjectURL(inspected.previewUrl);
          setError(t("media.videoTooLong", { max: MAX_VIDEO_SECONDS / 60 }));
          revokeMedia(accepted);
          return;
        }

        accepted.push({
          kind: "video",
          id: `m${nextId++}`,
          file,
          previewUrl: inspected.previewUrl,
          durationSec: inspected.durationSec,
          poster: inspected.poster,
          posterUrl: inspected.poster
            ? URL.createObjectURL(inspected.poster)
            : null,
        });
      }

      onChange([...media, ...accepted]);
    } finally {
      setIsReading(false);
      // Allow re-selecting the same file after a removal.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    const target = media.find((item) => item.id === id);
    if (target) revokeMedia([target]);

    onChange(media.filter((item) => item.id !== id));
    setError("");
  }

  const isFull = images.length >= MAX_IMAGES && videos.length >= MAX_VIDEOS;
  const isLocked = disabled || isFull || isReading;

  // The first image is the listing's cover, wherever it sits in the list.
  const coverId = images[0]?.id;

  return (
    <div>
      {/* The enclosing section supplies the heading, so only the running
          count is shown here. */}
      <div className="flex justify-end mb-1.5">
        <span className="text-xs text-gray-500">
          {t("media.counter", {
            images: images.length,
            maxImages: MAX_IMAGES,
            videos: videos.length,
            maxVideos: MAX_VIDEOS,
          })}
        </span>
      </div>

      {media.length > 0 ? (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {media.map((item) => (
            <li
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
            >
              {item.kind === "image" ? (
                <Image
                  src={item.previewUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="120px"
                />
              ) : (
                <>
                  {item.posterUrl ? (
                    <Image
                      src={item.posterUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="120px"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-gray-900" />
                  )}

                  {/* Marks the tile as a clip without needing to play it */}
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                    aria-hidden="true"
                  >
                    <Play className="w-7 h-7 text-white drop-shadow-sm" />
                  </span>

                  <span className="absolute bottom-1 start-1 px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/60 rounded">
                    {Math.round(item.durationSec)}s
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => remove(item.id)}
                disabled={disabled}
                aria-label={t("media.remove")}
                className="absolute top-1 end-1 w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              {item.id === coverId ? (
                <span className="absolute bottom-1 start-1 px-1.5 py-0.5 text-[10px] font-medium text-white bg-primary rounded">
                  {t("media.cover")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isLocked}
        className="sr-only"
        id="property-media"
      />
      <label
        htmlFor="property-media"
        className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed rounded-xl transition-colors min-h-[120px] text-center ${
          isLocked
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-600 hover:border-primary hover:bg-primary/5 cursor-pointer"
        }`}
      >
        {isReading ? (
          <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus className="w-7 h-7" aria-hidden="true" />
        )}
        <span className="text-base font-medium">
          {isReading
            ? t("media.reading")
            : isFull
              ? t("media.full")
              : t("media.choose")}
        </span>
        <span className="text-xs text-gray-500">{t("media.hint")}</span>
      </label>

      {error ? (
        <p
          className="flex items-center gap-1.5 mt-2 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
