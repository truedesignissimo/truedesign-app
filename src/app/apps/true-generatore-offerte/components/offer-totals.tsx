import type { Offer } from "../domain/types";
import { calculateOfferTotals } from "../domain/pricing";
import styles from "../offer-generator.module.css";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default function OfferTotals({ offer, onChange }: { offer: Offer; onChange: (offer: Offer) => void }) {
  const totals = calculateOfferTotals(offer);
  return <aside className={styles.totals}>
    <label>Sconto globale %<input type="text" value={offer.globalDiscount} placeholder="50+5" onChange={(event) => onChange({ ...offer, globalDiscount: event.target.value })} /></label>
    <dl>
      <div><dt>Subtotale</dt><dd>{euro.format(totals.subtotal)}</dd></div>
      <div><dt>Sconto globale</dt><dd>- {euro.format(totals.discount)}</dd></div>
      <div><dt>Imponibile</dt><dd>{euro.format(totals.net)}</dd></div>
      <div><dt>IVA {offer.vatRate}%</dt><dd>{euro.format(totals.vat)}</dd></div>
      <div className={styles.grandTotal}><dt>Totale</dt><dd>{euro.format(totals.total)}</dd></div>
    </dl>
  </aside>;
}
