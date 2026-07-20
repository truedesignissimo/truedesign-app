import type { Offer } from "../domain/types";
import { calculateOfferTotals } from "../domain/pricing";
import styles from "../offer-generator.module.css";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
export default function OfferTotals({ offer, onChange }: { offer: Offer; onChange: (offer: Offer) => void }) {
  const totals = calculateOfferTotals(offer);
  return <aside className={styles.totals}>
    <label>Sconto globale %<input type="number" min="0" max="100" value={offer.globalDiscountPercent} onChange={(e) => onChange({ ...offer, globalDiscountPercent: Number(e.target.value) })} /></label>
    <dl><div><dt>Subtotale</dt><dd>{euro.format(totals.subtotal)}</dd></div><div><dt>Sconto</dt><dd>− {euro.format(totals.discount)}</dd></div><div className={styles.grandTotal}><dt>Totale</dt><dd>{euro.format(totals.total)}</dd></div></dl>
  </aside>;
}
