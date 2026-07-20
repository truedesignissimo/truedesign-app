import type { Offer, PriceList } from "../domain/types";
import styles from "../offer-generator.module.css";

export default function OfferHeader({ offer, onChange, onPriceList }: {
  offer: Offer;
  onChange: (offer: Offer) => void;
  onPriceList: (priceList: PriceList) => void;
}) {
  return <section className={styles.headerPanel}>
    <div className={styles.brand}><strong>true</strong><span>Generatore Offerte</span></div>
    <div className={styles.headerFields}>
      <label>N. offerta<input value={offer.number} onChange={(e) => onChange({ ...offer, number: e.target.value })} /></label>
      <label>Cliente<input value={offer.customer.name ?? ""} onChange={(e) => onChange({ ...offer, customer: { ...offer.customer, name: e.target.value } })} /></label>
      <label>Progetto<input value={offer.project.reference ?? ""} onChange={(e) => onChange({ ...offer, project: { ...offer.project, reference: e.target.value } })} /></label>
      <label>Validità<input type="date" value={offer.project.validUntil ?? ""} onChange={(e) => onChange({ ...offer, project: { ...offer.project, validUntil: e.target.value } })} /></label>
    </div>
    <div className={styles.segmented} aria-label="Listino">
      {(["ITAENG", "ENGFRA"] as PriceList[]).map((list) => <button key={list} type="button" className={offer.priceList === list ? styles.active : ""} onClick={() => onPriceList(list)}>{list === "ITAENG" ? "ITA · ENG" : "FRA · ENG"}</button>)}
    </div>
  </section>;
}

