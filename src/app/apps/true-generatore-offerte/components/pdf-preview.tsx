import { useEffect, useState } from "react";
import type { CatalogProduct } from "../data/catalog";
import type { Offer } from "../domain/types";
import { buildOfferPdf } from "../pdf/build-offer-pdf";
import styles from "./pdf-preview.module.css";

export default function PdfPreview({ offer, products, imageUrls }: { offer: Offer; products: CatalogProduct[]; imageUrls: Record<string, string> }) {
  const [url, setUrl] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const preview = async () => { setBusy(true); setError(""); try { const doc = await buildOfferPdf(offer, products, imageUrls); const next = URL.createObjectURL(doc.output("blob")); if (url) URL.revokeObjectURL(url); setUrl(next); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } };
  return <section className={styles.actions}><button type="button" onClick={preview} disabled={busy || offer.lines.length === 0}>{busy ? "Preparazione..." : "Anteprima offerta"}</button><a className={!url ? styles.disabled : ""} href={url || undefined} download={`${offer.number || "offerta"}.pdf`} aria-disabled={!url}>Scarica PDF</a>{error && <span>{error}</span>}{url && <div className={styles.modal}><div><button type="button" onClick={() => setUrl("")}>Chiudi anteprima</button><iframe src={url} title="Anteprima PDF offerta" /></div></div>}</section>;
}
