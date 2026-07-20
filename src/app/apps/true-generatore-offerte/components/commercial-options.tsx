import type { Offer } from "../domain/types";
import styles from "../offer-generator.module.css";

export default function CommercialOptions({
  offer,
  onChange,
}: {
  offer: Offer;
  onChange: (offer: Offer) => void;
}) {
  return (
    <>
      <div className={styles.sectionPanel}>
        <div className={styles.sectionPanelTitle}>Scontistica</div>
        <div className={styles.sectionGrid}>
          <div className={styles.field}>
            <label htmlFor="globalDiscount">Sconto generale offerta (%)</label>
            <input id="globalDiscount" value={offer.globalDiscount} placeholder="es. 50+5" onChange={(event) => onChange({ ...offer, globalDiscount: event.target.value })} />
          </div>
          <div className={styles.checkField}>
            <input id="showDiscounts" type="checkbox" checked={offer.showDiscounts} onChange={(event) => onChange({ ...offer, showDiscounts: event.target.checked })} />
            <label htmlFor="showDiscounts">Mostra sconti nel PDF</label>
          </div>
          <div className={styles.checkField}>
            <input id="showNetPrices" type="checkbox" checked={offer.showNetPrices} onChange={(event) => onChange({ ...offer, showNetPrices: event.target.checked })} />
            <label htmlFor="showNetPrices">Mostra prezzi netti e totali riga</label>
          </div>
        </div>
      </div>
      <div className={styles.sectionPanel}>
        <div className={styles.sectionPanelTitle}>Opzioni speciali</div>
        <div className={styles.sectionGrid}>
          <div className={styles.checkField}>
            <input id="enableClass1IM" type="checkbox" checked={offer.specialOptions.class1IM} onChange={(event) => onChange({ ...offer, specialOptions: { ...offer.specialOptions, class1IM: event.target.checked } })} />
            <label htmlFor="enableClass1IM">Classe 1IM sulle righe dove richiesta</label>
          </div>
          <div className={styles.checkField}>
            <input id="fireRetardantOffer" type="checkbox" checked={offer.specialOptions.fireRetardant} onChange={(event) => onChange({ ...offer, specialOptions: { ...offer.specialOptions, fireRetardant: event.target.checked } })} />
            <label htmlFor="fireRetardantOffer">Annota richiesta verniciatura ignifuga</label>
          </div>
        </div>
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor="offerNotes">Note descrizione offerta</label>
        <textarea id="offerNotes" value={offer.offerNotes} placeholder="Note, condizioni particolari, indicazioni di progetto..." onChange={(event) => onChange({ ...offer, offerNotes: event.target.value })} />
      </div>
    </>
  );
}
