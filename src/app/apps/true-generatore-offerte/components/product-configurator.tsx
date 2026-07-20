import type { CatalogProduct, FabricRecord } from "../data/catalog";
import { getPriceChoices, selectedExtraAmounts } from "../domain/product-pricing";
import type { OfferLine, PriceList } from "../domain/types";
import styles from "../offer-generator.module.css";

interface GroupOption { id: string; label: string }
interface Group { id: string; label: string; options: GroupOption[] }
interface Extra { id: string; label: string; note?: string; ITAENG?: number; ENGFRA?: number }

export default function ProductConfigurator({ product, line, priceList, fabrics, onChange }: {
  product: CatalogProduct; line: OfferLine; priceList: PriceList; fabrics: FabricRecord[]; onChange: (patch: Partial<OfferLine>) => void;
}) {
  const choices = getPriceChoices(product);
  const groups = (product.componentGroups as Group[] | undefined) ?? [];
  const extras = (product.extraCharges as Extra[] | undefined) ?? [];
  const selectedChoice = String(line.configuration.priceChoice ?? choices[0]?.id ?? "");
  const fabricChoices = fabrics.filter((fabric) => !choices.some((choice) => /^[A-Z]+$/.test(choice.id)) || choices.some((choice) => choice.id === fabric.category));

  const selectChoice = (id: string) => {
    const choice = choices.find((item) => item.id === id); if (!choice) return;
    onChange({ unitPrice: choice[priceList], pricesByList: { ITAENG: choice.ITAENG, ENGFRA: choice.ENGFRA }, configuration: { ...line.configuration, priceChoice: id } });
  };
  const toggleExtra = (extra: Extra, checked: boolean) => {
    const key = `extra:${extra.id}`;
    const configuration = { ...line.configuration, [key]: checked };
    const extrasByList = {
      ITAENG: selectedExtraAmounts(extras, configuration, "ITAENG"),
      ENGFRA: selectedExtraAmounts(extras, configuration, "ENGFRA"),
    };
    onChange({ extras: extrasByList[priceList], extrasByList, configuration });
  };

  return <div className={styles.configurator}>
    {choices.length > 1 && <label>Categoria / finitura<select value={selectedChoice} onChange={(e) => selectChoice(e.target.value)}>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label} · € {choice[priceList].toLocaleString("it-IT")}</option>)}</select></label>}
    {groups.map((group) => <label key={group.id}>{group.label}<select value={String(line.configuration[`component:${group.id}`] ?? "")} onChange={(e) => onChange({ configuration: { ...line.configuration, [`component:${group.id}`]: e.target.value } })}><option value="">Seleziona finitura</option>{group.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>)}
    {Boolean(product.has_fabric) && <label>Tessuto<select value={String(line.configuration.fabricId ?? "")} onChange={(e) => { const fabric = fabricChoices.find((item) => item.id === e.target.value); if (!fabric) return; const categoryChoice = choices.find((choice) => choice.id === fabric.category); onChange({ ...(categoryChoice ? { unitPrice: categoryChoice[priceList], pricesByList: { ITAENG: categoryChoice.ITAENG, ENGFRA: categoryChoice.ENGFRA } } : {}), configuration: { ...line.configuration, fabricId: fabric.id, fabric: `${fabric.manufacturer ?? ""} ${fabric.collection ?? ""} ${fabric.code ?? ""}`.trim(), priceChoice: categoryChoice?.id ?? selectedChoice } }); }}><option value="">Seleziona tessuto</option>{fabricChoices.map((fabric) => <option key={fabric.id} value={fabric.id}>{String(fabric.manufacturer ?? "")} · {String(fabric.collection ?? "")} · {String(fabric.code ?? fabric.id)} ({String(fabric.category ?? "")})</option>)}</select></label>}
    {extras.length > 0 && <fieldset><legend>Extra charges</legend>{extras.map((extra) => <label className={styles.check} key={extra.id}><input type="checkbox" checked={Boolean(line.configuration[`extra:${extra.id}`])} onChange={(e) => toggleExtra(extra, e.target.checked)} /><span>{extra.label}<small>{extra.note}{extra[priceList] != null ? ` · € ${Number(extra[priceList]).toLocaleString("it-IT")}` : ""}</small></span></label>)}</fieldset>}
  </div>;
}
