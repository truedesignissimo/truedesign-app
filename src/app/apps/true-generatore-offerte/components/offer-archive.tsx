import type { Offer } from "../domain/types";
import styles from "../offer-generator.module.css";

export default function OfferArchive({ offers, currentId, onOpen, onNew }: { offers: Offer[]; currentId: string; onOpen: (offer: Offer) => void; onNew: () => void }) {
  return <aside className={styles.archive}><div><h2>Offerte salvate</h2><button type="button" onClick={onNew}>Nuova</button></div>{offers.length === 0 ? <p>Nessuna offerta salvata.</p> : <nav>{offers.map((offer) => <button type="button" className={offer.id === currentId ? styles.current : ""} key={offer.id} onClick={() => onOpen(offer)}><strong>{offer.number}</strong><span>{offer.customer.name || "Cliente da definire"}</span></button>)}</nav>}</aside>;
}
