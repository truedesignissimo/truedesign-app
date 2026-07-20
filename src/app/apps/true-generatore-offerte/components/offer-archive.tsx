import type { Offer } from "../domain/types";
import styles from "../offer-generator.module.css";

const date = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });

export default function OfferArchive({ offers, currentId, onOpen, onNew, onDelete }: {
  offers: Offer[];
  currentId: string;
  onOpen: (offer: Offer) => void;
  onNew: () => void;
  onDelete: (offer: Offer) => void;
}) {
  return <aside className={styles.archive}>
    <div className={styles.archiveHeading}><h2>Offerte salvate</h2><button type="button" onClick={onNew}>Nuova offerta</button></div>
    {offers.length === 0 ? <p>Nessuna offerta salvata.</p> : <div className={styles.archiveTable}>
      <div className={styles.archiveHeader}><span>Numero</span><span>Cliente</span><span>Progetto</span><span>Aggiornata</span><span>Azioni</span></div>
      {offers.map((offer) => <div className={offer.id === currentId ? styles.archiveCurrent : styles.archiveRow} key={offer.id}>
        <strong>{offer.number}</strong>
        <span>{offer.customer.name || offer.customer.company || "Cliente da definire"}</span>
        <span>{offer.project.reference || "-"}</span>
        <span>{date.format(new Date(offer.updatedAt))}</span>
        <span className={styles.archiveActions}>
          <button type="button" onClick={() => onOpen(offer)}>Apri</button>
          <button type="button" className={styles.deleteAction} onClick={() => {
            if (window.confirm(`Eliminare definitivamente l'offerta ${offer.number}?`)) onDelete(offer);
          }}>Elimina</button>
        </span>
      </div>)}
    </div>}
  </aside>;
}
