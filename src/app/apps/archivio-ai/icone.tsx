import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const IconaCerca = () => (
  <svg {...base}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);

export const IconaChiudi = () => (
  <svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export const IconaIndietro = () => (
  <svg {...base}><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>
);

export const IconaAvanti = () => (
  <svg {...base}><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>
);

export const IconaScarica = () => (
  <svg {...base}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" /></svg>
);

export const IconaSpunta = () => (
  <svg {...base}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

export const IconaNascondi = () => (
  <svg {...base}>
    <path d="M3 12c1.8-3.6 5-6 9-6s7.2 2.4 9 6c-1.8 3.6-5 6-9 6s-7.2-2.4-9-6Z" />
    <path d="M4 4l16 16" />
  </svg>
);

export const IconaEsterno = () => (
  <svg {...base}><path d="M13 5h6v6M19 5l-8.5 8.5M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" /></svg>
);

export const IconaIngrandisci = () => (
  <svg {...base}><path d="M14 4h6v6M20 4l-6.5 6.5M10 20H4v-6M4 20l6.5-6.5" /></svg>
);
