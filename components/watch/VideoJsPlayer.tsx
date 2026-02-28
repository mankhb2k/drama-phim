"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

type VideoJsPlayerProps = {
  src: string;
  subtitleSrc?: string | null;
  subtitleLabel?: string;
  subtitleLang?: string;
  vastTagUrl?: string | null;
};

declare global {
  interface Window {
    google?: {
      ima?: unknown;
    };
  }
}

function loadImaSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.ima) return Promise.resolve();

  const existing = document.querySelector(
    'script[data-ima-sdk="true"]'
  ) as HTMLScriptElement | null;

  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load IMA SDK")),
        { once: true }
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
    script.async = true;
    script.dataset.imaSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load IMA SDK"));
    document.head.appendChild(script);
  });
}

export function VideoJsPlayer({
  src,
  subtitleSrc,
  subtitleLabel = "Vietnamese",
  subtitleLang = "vi",
  vastTagUrl,
}: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    let disposed = false;
    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.isConnected) return;
    const mountedVideo = videoElement;

    async function initPlayer() {
      if (disposed || !mountedVideo.isConnected) return;
      if (playerRef.current && !playerRef.current.isDisposed()) return;

      const player = videojs(mountedVideo, {
        controls: true,
        autoplay: false,
        preload: "auto",
        responsive: true,
        fluid: false,
        fill: true,
        sources: [{ src, type: "video/mp4" }],
      });

      playerRef.current = player;

      if (subtitleSrc) {
        player.addRemoteTextTrack(
          {
            kind: "subtitles",
            src: subtitleSrc,
            srclang: subtitleLang,
            label: subtitleLabel,
            default: true,
          },
          false
        );
      }

      if (vastTagUrl) {
        try {
          await Promise.all([import("videojs-contrib-ads"), import("videojs-ima")]);
          await loadImaSdk();

          if (typeof (player as unknown as { ima?: unknown }).ima === "function") {
            (
              player as unknown as {
                ima: (options: { adTagUrl: string }) => void;
              }
            ).ima({
              adTagUrl: vastTagUrl,
            });
          }
        } catch (error) {
          console.error("[VideoJsPlayer] VAST init failed", error);
        }
      }
    }

    const rafId = window.requestAnimationFrame(() => {
      void initPlayer();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
      }
      playerRef.current = null;
    };
  }, [src, subtitleLabel, subtitleLang, subtitleSrc, vastTagUrl]);

  return (
    <div data-vjs-player className="vjs-drama-player relative w-full">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered size-full rounded-xl"
      />
    </div>
  );
}
