import { useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "../data/catalog";
import type { Offer } from "../domain/types";
import { buildOfferPdf } from "../pdf/build-offer-pdf";
import styles from "./pdf-preview.module.css";

export default function PdfPreview({ offer, products, imageUrls, onReset }: {
  offer: Offer;
  products: CatalogProduct[];
  imageUrls: Record<string, string>;
  onReset: () => void;
}) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const urlRef = useRef("");

  const revokePreview = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
    setUrl("");
    setOpen(false);
  };

  useEffect(() => {
    revokePreview();
  }, [offer]);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const preview = async () => {
    setBusy(true);
    setError("");
    try {
      const doc = await buildOfferPdf(offer, products, imageUrls);
      const next = URL.createObjectURL(doc.output("blob"));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = next;
      setUrl(next);
      setOpen(true);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <section className={styles.actions}>
    <button type="button" onClick={preview} disabled={busy || offer.lines.length === 0}>{busy ? "Preparazione..." : "Anteprima offerta"}</button>
    <a className={!url ? styles.disabled : ""} href={url || undefined} download={`${offer.number || "offerta"}.pdf`} aria-disabled={!url}>Scarica PDF</a>
    <button className={styles.reset} type="button" onClick={() => { revokePreview(); onReset(); }}>Reset</button>
    {error && <span className={styles.error}>{error}</span>}
    {open && url && <div className={styles.modal}><div><button type="button" onClick={() => setOpen(false)}>Chiudi anteprima</button><iframe src={url} title="Anteprima PDF offerta" /></div></div>}
  </section>;
}
