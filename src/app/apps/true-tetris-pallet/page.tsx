"use client";

import { TRUE_TETRIS_DOCUMENT } from "./app-document";

export default function TrueTetrisPalletPage() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "#f5f5f7",
      }}
    >
      <iframe
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
