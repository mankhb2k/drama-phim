"use client";

import { useEffect, useRef } from "react";

const AD_CONFIGS = [
  {
    key: "094b0dde630127aa659c6113712ed68c",
    width: 468,
    height: 60,
  },
  {
    key: "9ea4ed461dfb1b283c3e7dd579029340",
    width: 320,
    height: 50,
  },
] as const;

function getInvokeUrl(key: string): string {
  return `https://www.highperformanceformat.com/${key}/invoke.js`;
}

function loadAdIntoContainer(
  container: HTMLDivElement,
  config: (typeof AD_CONFIGS)[number],
  onDone: () => void,
): () => void {
  (window as Window & { atOptions?: Record<string, unknown> }).atOptions = {
    key: config.key,
    format: "iframe",
    height: config.height,
    width: config.width,
    params: {},
  };

  const script = document.createElement("script");
  script.src = getInvokeUrl(config.key);
  script.async = true;
  script.onload = () => {
    const bodyIframe = document.body.querySelector(
      `iframe[src*="${config.key}"]`,
    );
    if (bodyIframe && bodyIframe.parentElement !== container) {
      container.appendChild(bodyIframe);
    }
    onDone();
  };
  container.appendChild(script);

  return () => script.remove();
}

export function WatchPageAd() {
  const container1Ref = useRef<HTMLDivElement | null>(null);
  const container2Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container1 = container1Ref.current;
    const container2 = container2Ref.current;
    if (!container1 || !container2) return;

    let cleanup2: (() => void) | null = null;
    const cleanup1 = loadAdIntoContainer(container1, AD_CONFIGS[0], () => {
      cleanup2 = loadAdIntoContainer(container2, AD_CONFIGS[1], () => {});
    });

    return () => {
      cleanup1();
      cleanup2?.();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={container1Ref}
        style={{ width: AD_CONFIGS[0].width, height: AD_CONFIGS[0].height }}
        className="scale-75"
      />
      <div
        ref={container2Ref}
        style={{ width: AD_CONFIGS[1].width, height: AD_CONFIGS[1].height }}
      />
    </div>
  );
}
