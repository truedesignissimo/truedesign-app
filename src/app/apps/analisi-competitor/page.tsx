'use client'

// L'app è un report editoriale statico (HTML/CSS/JS autonomo, generato da una
// pipeline Python separata che analizza i siti dei competitor di True Design).
// Viene incorporata via iframe puntando al file statico in
// public/apps/analisi-competitor/index.html invece di essere riscritta in
// JSX: ha uno stile e una logica molto specifici già rifiniti e testati, e
// l'iframe evita qualunque conflitto con gli stili globali/Tailwind del sito.

export default function AnalisiCompetitorPage() {
  return (
    <iframe
      src="/apps/analisi-competitor/index.html"
      title="Competitive Intelligence — True Design"
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
    />
  )
}
