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

  /* Container dimensions in rem (468px≈29.25rem, 60px=3.75rem, 320px=20rem, 50px=3.125rem) */
  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2 overflow-hidden px-0">
      <div
        ref={container1Ref}
        className="max-w-full overflow-hidden"
        style={{
          width: "29.25rem",
          height: "3.75rem",
          maxWidth: "100%",
        }}
      />
      <div
        ref={container2Ref}
        className="max-w-full overflow-hidden"
        style={{
          width: "20rem",
          height: "3.125rem",
          maxWidth: "100%",
        }}
      />
    </div>
  );
}
