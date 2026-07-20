import { useEffect, useRef } from "react";
import type { CatalogProduct, FabricRecord } from "../data/catalog";
import { calculateLineTotal } from "../domain/pricing";
import { getPriceChoices, selectedExtraAmounts } from "../domain/product-pricing";
import type { OfferLine, PriceList } from "../domain/types";
import ProductConfigurator from "./product-configurator";
import styles from "../offer-generator.module.css";

interface Extra {
  id: string;
  label: string;
  note?: string;
  ITAENG?: number;
  ENGFRA?: number;
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const asset = (path?: string) => path ? `/apps/true-generatore-offerte/${path}` : "";
const text = (value: unknown) => String(value ?? "");

export default function OfferLines({ lines, products, fabrics, priceList, previews, onUpdate, onRemove, onImage }: {
  lines: OfferLine[];
  products: CatalogProduct[];
  fabrics: FabricRecord[];
  priceList: PriceList;
  previews: Record<string, string>;
  onUpdate: (id: string, patch: Partial<OfferLine>) => void;
  onRemove: (id: string) => void;
  onImage: (line: OfferLine, file: File) => void;
}) {
  const lastRowRef = useRef<HTMLTableRowElement>(null);
  const previousLength = useRef(lines.length);
  useEffect(() => {
    const added = lines.length > previousLength.current;
    previousLength.current = lines.length;
    if (!added || !lastRowRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      lastRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      lastRowRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lines.length]);

  if (!lines.length) return <div className={styles.empty}>L’offerta è vuota. Cerca un prodotto per iniziare.</div>;

  return <div className={styles.tableWrap}>
    <table className={styles.offerTable}>
      <thead><tr>
        <th aria-label="Rimuovi" />
        <th>Codice</th><th>Immagine</th><th>Nome</th><th>Configurazione</th>
        <th>Qta</th><th>Categoria</th><th>Prezzo listino</th><th>Sconto %</th>
        <th>Sovrapprezzo</th><th>Totale Riga</th>
      </tr></thead>
      <tbody>{lines.map((line, index) => {
        const product = products.find((item) => item.code === line.productCode);
        if (!product) return null;
        const image = previews[line.id] || asset(product.productPhotoPath || product.imagePath);
        const choices = getPriceChoices(product);
        const extras = (product.extraCharges as Extra[] | undefined) ?? [];
        const selectedFinish = text(line.configuration.finishId);
        const pricingMode = text(line.configuration.pricingMode);
        const categories = choices.filter((choice) => !choice.id.startsWith("option::") && (!choice.finishId || choice.finishId === selectedFinish));
        const selectedExtraId = text(line.configuration.extraId);

        const updateExtra = (configuration: OfferLine["configuration"], quantity = line.quantity) => {
          const extrasByList = {
            ITAENG: selectedExtraAmounts(extras, configuration, "ITAENG", quantity),
            ENGFRA: selectedExtraAmounts(extras, configuration, "ENGFRA", quantity),
          };
          onUpdate(line.id, { configuration, extrasByList, extras: extrasByList[priceList] });
        };

        return <tr key={line.id} data-line-id={line.id} tabIndex={-1} ref={index === lines.length - 1 ? lastRowRef : undefined}>
          <td className={styles.removeCell}><button type="button" aria-label={`Rimuovi ${line.productCode}`} onClick={() => onRemove(line.id)}>×</button></td>
          <td className={styles.codeCell}>{line.productCode}</td>
          <td className={styles.imageCell}>
            {image ? <img src={image} alt={line.productCode} /> : <span>Nessuna immagine</span>}
            <label className={styles.upload}>Carica immagine<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImage(line, file);
            }} /></label>
          </td>
          <td className={styles.nameCell}>{text(product.name_it || product.name)}<small>{product.family}</small></td>
          <td className={styles.configurationCell}><ProductConfigurator product={product} line={line} priceList={priceList} fabrics={fabrics} onChange={(patch) => onUpdate(line.id, patch)} /></td>
          <td><input className={styles.compactInput} aria-label={`Quantità ${line.productCode}`} type="number" min="1" value={line.quantity} onChange={(event) => {
            const quantity = Math.max(1, Number(event.target.value) || 1);
            const extrasByList = {
              ITAENG: selectedExtraAmounts(extras, line.configuration, "ITAENG", quantity),
              ENGFRA: selectedExtraAmounts(extras, line.configuration, "ENGFRA", quantity),
            };
            onUpdate(line.id, { quantity, extrasByList, extras: extrasByList[priceList] });
          }} /></td>
          <td>{pricingMode === "option" || !categories.length ? <span>-</span> : <select className={styles.compactSelect} aria-label={`Categoria ${line.productCode}`} value={text(line.configuration.category)} onChange={(event) => {
            const choice = categories.find((item) => item.category === event.target.value);
            if (!choice) return;
            onUpdate(line.id, {
              unitPrice: choice[priceList],
              pricesByList: { ITAENG: choice.ITAENG, ENGFRA: choice.ENGFRA },
              configuration: { ...line.configuration, priceChoice: choice.id, category: choice.category ?? null },
            });
          }}>{categories.map((choice) => <option key={choice.id} value={choice.category}>{choice.category}</option>)}</select>}</td>
          <td className={styles.moneyCell}>{euro.format(line.unitPrice)}</td>
          <td><input className={styles.discountInput} aria-label={`Sconto ${line.productCode}`} type="text" value={line.discount} placeholder="50+5" onChange={(event) => onUpdate(line.id, { discount: event.target.value })} /></td>
          <td className={styles.extraCell}>
            <select aria-label={`Sovrapprezzo ${line.productCode}`} value={selectedExtraId} disabled={!extras.length} onChange={(event) => updateExtra({ ...line.configuration, extraId: event.target.value, waiveExtraCharge: false })}>
              <option value="">Nessuno</option>
              {extras.map((extra) => <option key={extra.id} value={extra.id}>{extra.label} + {euro.format(Number(extra[priceList] ?? 0))}</option>)}
            </select>
            {selectedExtraId && <>
              {extras.find((extra) => extra.id === selectedExtraId)?.note && <small>{extras.find((extra) => extra.id === selectedExtraId)?.note}</small>}
              <label className={styles.waiveExtra}><input type="checkbox" checked={Boolean(line.configuration.waiveExtraCharge)} onChange={(event) => updateExtra({ ...line.configuration, waiveExtraCharge: event.target.checked })} /> Omaggio commerciale</label>
            </>}
          </td>
          <td className={styles.totalCell}>{euro.format(calculateLineTotal(line))}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
