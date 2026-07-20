import type { CatalogProduct, FabricRecord } from "../data/catalog";
import { calculateLineTotal } from "../domain/pricing";
import type { OfferLine, PriceList } from "../domain/types";
import ProductConfigurator from "./product-configurator";
import styles from "../offer-generator.module.css";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const asset = (path?: string) => path ? `/apps/true-generatore-offerte/${path}` : "";
export default function OfferLines({ lines, products, fabrics, priceList, previews, onUpdate, onRemove, onImage }: {
  lines: OfferLine[]; products: CatalogProduct[]; fabrics: FabricRecord[]; priceList: PriceList; previews: Record<string, string>;
  onUpdate: (id: string, patch: Partial<OfferLine>) => void; onRemove: (id: string) => void; onImage: (line: OfferLine, file: File) => void;
}) {
  if (!lines.length) return <div className={styles.empty}>L’offerta è vuota. Cerca un prodotto per iniziare.</div>;
  return <div className={styles.lines}>{lines.map((line, index) => { const product = products.find((item) => item.code === line.productCode); if (!product) return null; const image = previews[line.id] || asset(product.productPhotoPath || product.imagePath); return <article className={styles.line} key={line.id}>
    <div className={styles.lineIndex}>{String(index + 1).padStart(2, "0")}</div>
    <div className={styles.productVisual}>{image ? <img src={image} alt={line.productCode} /> : <span>Nessuna immagine</span>}<label className={styles.upload}>Carica immagine<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImage(line, file); }} /></label></div>
    <div className={styles.lineBody}><div className={styles.lineTitle}><div><strong>{line.productCode}</strong><span>{product.family} · {String(product.name_it ?? product.name ?? "")}</span></div><button type="button" onClick={() => onRemove(line.id)}>Rimuovi</button></div><ProductConfigurator product={product} line={line} priceList={priceList} fabrics={fabrics} onChange={(patch) => onUpdate(line.id, patch)} /></div>
    <div className={styles.lineNumbers}><label>Q.tà<input type="number" min="1" value={line.quantity} onChange={(e) => onUpdate(line.id, { quantity: Math.max(1, Number(e.target.value)) })} /></label><label>Sconto %<input type="number" min="0" max="100" value={line.discountPercent} onChange={(e) => onUpdate(line.id, { discountPercent: Number(e.target.value) })} /></label><span>{euro.format(calculateLineTotal(line))}</span></div>
  </article>; })}</div>;
}

