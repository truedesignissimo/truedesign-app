import logo from "../assets/true-logo.png";
import type { Offer, OfferLanguage, PriceList } from "../domain/types";
import styles from "../offer-generator.module.css";

const languages: Array<{ value: OfferLanguage; label: string }> = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "he", label: "עברית" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
];

export default function LegacyHeader({
  offer,
  status,
  onLanguage,
  onPriceList,
}: {
  offer: Offer;
  status: string;
  onLanguage: (language: OfferLanguage) => void;
  onPriceList: (priceList: PriceList) => void;
}) {
  return (
    <header className={styles.header}>
      <a className={styles.logoBlock} href="/dashboard" aria-label="Torna alla dashboard">
        <img className={styles.logoImage} src={logo.src} alt="true" />
        <span className={styles.subtitle}>Generatore Offerte Commerciali V3</span>
      </a>
      <div className={styles.headerControls}>
        <span className={styles.status} aria-live="polite">{status}</span>
        <div className={styles.priceDots} aria-label="Selezione listino">
          <button
            type="button"
            aria-label="Listino ITA/ENG"
            title="Listino ITA/ENG"
            className={`${styles.priceDot} ${offer.priceList === "ITAENG" ? styles.priceDotActive : ""}`}
            onClick={() => onPriceList("ITAENG")}
          />
          <button
            type="button"
            aria-label="Listino ENG/FRA"
            title="Listino ENG/FRA"
            className={`${styles.priceDot} ${styles.priceDotGrey} ${offer.priceList === "ENGFRA" ? styles.priceDotActive : ""}`}
            onClick={() => onPriceList("ENGFRA")}
          />
        </div>
        <select
          className={styles.languageSelect}
          aria-label="Lingua documento"
          value={offer.language}
          onChange={(event) => onLanguage(event.target.value as OfferLanguage)}
        >
          {languages.map((language) => (
            <option key={language.value} value={language.value}>{language.label}</option>
          ))}
        </select>
      </div>
    </header>
  );
}
