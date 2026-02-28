"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
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
    'script[data-ima-sdk="true"]',
  ) as HTMLScriptElement | null;

  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load IMA SDK")),
        { once: true },
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);

  const clearHideControlsTimer = () => {
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  };

  const scheduleHideControls = () => {
    clearHideControlsTimer();
    const player = playerRef.current;
    if (!player || player.isDisposed() || player.paused()) return;
    hideControlsTimerRef.current = window.setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  };

  const revealControls = () => {
    setIsControlsVisible(true);
    scheduleHideControls();
  };

  const seekBy = (seconds: number) => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    const current = player.currentTime() ?? 0;
    const duration = player.duration() ?? 0;
    const next = Math.min(
      Math.max(current + seconds, 0),
      duration || Number.MAX_SAFE_INTEGER,
    );
    player.currentTime(next);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    if (player.paused()) {
      void player.play();
    } else {
      player.pause();
    }
  };

  const onSeek = (nextTime: number) => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    player.currentTime(nextTime);
  };

  const onVolumeChange = (nextVolume: number) => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    player.volume(nextVolume);
    if (nextVolume > 0 && player.muted()) {
      player.muted(false);
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    player.muted(!player.muted());
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    if (player.isFullscreen()) {
      void player.exitFullscreen();
    } else {
      void player.requestFullscreen();
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return "00:00";
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  useEffect(() => {
    let disposed = false;
    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.isConnected) return;
    const mountedVideo = videoElement;

    async function initPlayer() {
      if (disposed || !mountedVideo.isConnected) return;
      if (playerRef.current && !playerRef.current.isDisposed()) return;

      const player = videojs(mountedVideo, {
        controls: false,
        bigPlayButton: false,
        controlBar: false,
        autoplay: false,
        preload: "auto",
        responsive: true,
        fluid: false,
        fill: true,
        sources: [{ src, type: "video/mp4" }],
      });

      playerRef.current = player;
      setIsReady(true);
      setIsControlsVisible(true);

      const syncState = () => {
        setCurrentTime(player.currentTime() ?? 0);
        setDuration(player.duration() ?? 0);
        setVolume(player.volume() ?? 1);
        setIsMuted(player.muted() ?? false);
        setIsPlaying(!player.paused());
        setIsFullscreen(player.isFullscreen() ?? false);
      };
      syncState();

      player.on("loadedmetadata", syncState);
      player.on("durationchange", syncState);
      player.on("timeupdate", syncState);
      player.on("play", () => {
        syncState();
        scheduleHideControls();
      });
      player.on("pause", () => {
        syncState();
        clearHideControlsTimer();
        setIsControlsVisible(true);
      });
      player.on("ended", () => {
        syncState();
        clearHideControlsTimer();
        setIsControlsVisible(true);
      });
      player.on("volumechange", syncState);
      player.on("fullscreenchange", syncState);

      if (subtitleSrc) {
        player.addRemoteTextTrack(
          {
            kind: "subtitles",
            src: subtitleSrc,
            srclang: subtitleLang,
            label: subtitleLabel,
            default: true,
          },
          false,
        );
      }

      if (vastTagUrl) {
        try {
          await Promise.all([
            import("videojs-contrib-ads"),
            import("videojs-ima"),
          ]);
          await loadImaSdk();

          if (
            typeof (player as unknown as { ima?: unknown }).ima === "function"
          ) {
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
      clearHideControlsTimer();
      setIsReady(false);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
      }
      playerRef.current = null;
    };
  }, [src, subtitleLabel, subtitleLang, subtitleSrc, vastTagUrl]);

  return (
    <div
      data-vjs-player
      className="vjs-drama-player relative w-full"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onClick={revealControls}
    >
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered size-full rounded-xl"
      />

      {isReady && (
        <div
          className={`absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 transition-opacity duration-200 ${
            isControlsVisible || !isPlaying
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/85"
            aria-label="Lùi 10 giây"
          >
            <RotateCcw className="size-4" />
            -10s
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex size-20 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transition hover:bg-white"
            aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
          >
            {isPlaying ? (
              <Pause className="size-9 fill-current" />
            ) : (
              <Play className="size-9 fill-current pl-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/85"
            aria-label="Tiến 10 giây"
          >
            <RotateCw className="size-4" />
            +10s
          </button>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 text-white transition-opacity duration-200 ${
          isControlsVisible || !isPlaying
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="ml-auto text-xs tabular-nums text-white/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-600">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-zinc-300"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onSeek(Number(e.target.value))
              }
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Thanh thời lượng video"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              aria-label={isMuted ? "Bật tiếng" : "Tắt tiếng"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onVolumeChange(Number(e.target.value))
              }
              className="h-1.5 w-28 cursor-pointer accent-zinc-300"
              aria-label="Âm lượng"
            />

            <button
              type="button"
              onClick={toggleFullscreen}
              className="ml-auto inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              aria-label={
                isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"
              }
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
