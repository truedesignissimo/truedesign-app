"use client";

import { useEffect, useRef, useState } from "react";

const PALETTES = [
  { id: "golden", name: "Golden Breath", colors: ["#d8b85f", "#a96c43", "#3b2b23"] },
  { id: "roaring", name: "Roaring Legacy", colors: ["#777b43", "#b48745", "#e2ded0"] },
  { id: "tribal", name: "Tribal Soil", colors: ["#865943", "#c5a981", "#f0e7d8"] },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

function applyPalette(palette: PaletteId) {
  document.documentElement.dataset.sitePalette = palette;
  window.localStorage.setItem("true-site-palette", palette);
}

export default function PaletteSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PaletteId>("golden");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("true-site-palette") as PaletteId | null;
    const palette = PALETTES.some((item) => item.id === saved) ? saved! : "golden";
    setActive(palette);
    applyPalette(palette);
  }, []);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="palette-switcher" ref={rootRef}>
      <button
        type="button"
        className="palette-trigger"
        aria-label="Scegli la palette del sito"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {PALETTES.find((palette) => palette.id === active)?.colors.map((color) => (
          <i key={color} style={{ backgroundColor: color }} />
        ))}
      </button>
      {open && (
        <div className="palette-menu" role="menu" aria-label="Palette True CMF">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className={palette.id === active ? "is-active" : ""}
              onClick={() => {
                setActive(palette.id);
                applyPalette(palette.id);
                setOpen(false);
              }}
            >
              <span>{palette.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
              {palette.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
