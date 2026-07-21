"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { TRUE_TETRIS_DOCUMENT } from "./app-document";
import { createTetrisShipmentsRepository } from "./data/shipments-repository";
import { createArchiveMessageHandler } from "./tetris-archive-bridge";

export default function TrueTetrisPalletPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const repository = useMemo(() => createTetrisShipmentsRepository(supabase), [supabase]);
  const send = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);
  const handler = useMemo(() => createArchiveMessageHandler({ repository, send }), [repository, send]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      void handler(event);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [handler]);

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "#f5f5f7",
      }}
    >
      <iframe
        ref={iframeRef}
        title="True Tetris Pallet"
        srcDoc={TRUE_TETRIS_DOCUMENT}
        style={{
          display: "block",
          width: "100%",
          height: "100dvh",
          border: 0,
          background: "#f5f5f7",
        }}
      />
    </main>
  );
}
