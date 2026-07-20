import { useMemo, useState } from "react";
import type { CatalogProduct } from "../data/catalog";
import { searchProducts } from "../domain/search";
import styles from "../offer-generator.module.css";

export default function ProductSearch({ products, onSelect }: { products: CatalogProduct[]; onSelect: (product: CatalogProduct) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchProducts(products, query), [products, query]);
  return <section className={styles.searchPanel}>
    <div><h2>Aggiungi prodotto</h2><p>Cerca per codice, famiglia o nome.</p></div>
    <div className={styles.searchBox}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Es. AB 1000, Abisko, poltrona" aria-label="Cerca prodotto" />
      {results.length > 0 && <div className={styles.results}>{results.map((product) => <button type="button" key={product.code} onClick={() => { onSelect(product); setQuery(""); }}><span><strong>{product.code}</strong><small>{product.family} · {String(product.name_it ?? product.name ?? "")}</small></span><span>Aggiungi</span></button>)}</div>}
    </div>
  </section>;
}

