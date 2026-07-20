import type { CatalogProduct, FabricRecord } from "../data/catalog";
import {
  allowedFabricsForProduct,
  effectiveFabricCategory,
  getPriceChoices,
} from "../domain/product-pricing";
import type { OfferLine, PriceList } from "../domain/types";
import styles from "../offer-generator.module.css";

interface GroupOption {
  id: string;
  label: string;
  priceVariants?: string[];
}
interface Group {
  id: string;
  label: string;
  note?: string;
  linkedPrice?: boolean;
  options: GroupOption[];
}

const asset = (path?: string) => path ? `/apps/true-generatore-offerte/${path}` : "";
const text = (value: unknown) => String(value ?? "");

export default function ProductConfigurator({ product, line, priceList, fabrics, onChange }: {
  product: CatalogProduct;
  line: OfferLine;
  priceList: PriceList;
  fabrics: FabricRecord[];
  onChange: (patch: Partial<OfferLine>) => void;
}) {
  const choices = getPriceChoices(product);
  const groups = (product.componentGroups as Group[] | undefined) ?? [];
  const selectedChoice = text(line.configuration.priceChoice ?? choices[0]?.id);
  const selectedFinish = text(line.configuration.finishId);
  const pricingMode = text(line.configuration.pricingMode || "standard");
  const class1IM = Boolean(line.configuration.class1IM);
  const fabricChoices = allowedFabricsForProduct(product, fabrics);
  const manufacturers = [...new Set(fabricChoices.map((fabric) => text(fabric.manufacturer || "Altro")))].sort((a, b) => a.localeCompare(b, "it"));
  const manufacturer = text(line.configuration.fabricManufacturer);
  const visibleFabrics = fabricChoices.filter((fabric) => !manufacturer || text(fabric.manufacturer || "Altro") === manufacturer);
  const selectedFabric = fabricChoices.find((fabric) => fabric.id === line.configuration.fabricId);
  const fabricPriceChoices = choices.filter((choice) => !choice.id.startsWith("option::"));
  const optionChoices = choices.filter((choice) => choice.id.startsWith("option::"));
  const finishChoices = [...new Map(fabricPriceChoices.filter((choice) => choice.finishId).map((choice) => [choice.finishId, choice])).values()];

  const selectChoice = (id: string, configurationPatch: Record<string, string | number | boolean | null> = {}) => {
    const choice = choices.find((item) => item.id === id);
    if (!choice) return;
    onChange({
      unitPrice: choice[priceList],
      pricesByList: { ITAENG: choice.ITAENG, ENGFRA: choice.ENGFRA },
      configuration: {
        ...line.configuration,
        priceChoice: id,
        finishId: choice.finishId ?? null,
        category: choice.category ?? null,
        ...configurationPatch,
      },
    });
  };

  const chooseFabric = (fabricId: string) => {
    const fabric = fabricChoices.find((item) => item.id === fabricId);
    if (!fabric) {
      onChange({ configuration: { ...line.configuration, fabricId: "", fabric: "" } });
      return;
    }
    const category = effectiveFabricCategory(product, fabric, class1IM);
    const choice = fabricPriceChoices.find((item) => item.category === category && (!item.finishId || item.finishId === selectedFinish))
      ?? fabricPriceChoices.find((item) => item.category === category)
      ?? fabricPriceChoices[0];
    const patch = {
      fabricId: fabric.id,
      fabricManufacturer: text(fabric.manufacturer || "Altro"),
      fabric: [fabric.manufacturer, fabric.collection, fabric.code].filter(Boolean).join(" "),
    };
    if (choice) selectChoice(choice.id, patch);
    else onChange({ configuration: { ...line.configuration, ...patch } });
  };

  const setClass1IM = (checked: boolean) => {
    const nextConfiguration = { ...line.configuration, class1IM: checked };
    if (!selectedFabric) {
      onChange({ configuration: nextConfiguration });
      return;
    }
    const category = effectiveFabricCategory(product, selectedFabric, checked);
    const choice = fabricPriceChoices.find((item) => item.category === category && (!item.finishId || item.finishId === selectedFinish))
      ?? fabricPriceChoices.find((item) => item.category === category);
    if (choice) selectChoice(choice.id, { class1IM: checked });
    else onChange({ configuration: nextConfiguration });
  };

  const selectedFinishKey = selectedFinish.toLowerCase();
  const finishRestricted = (option: GroupOption) => !option.priceVariants?.length
    || option.priceVariants.some((variant) => variant.toLowerCase() === selectedFinishKey);
  const notRecommended = selectedFabric && ((product.fabricNotRecommended as string[] | undefined) ?? [])
    .some((collection) => text(selectedFabric.collection).toUpperCase().startsWith(collection.toUpperCase()));

  return <div className={styles.configStack}>
    {Boolean(product.has_fabric) && pricingMode !== "option" && <div className={styles.configGroup}>
      <div className={styles.configGroupTitle}>Tessuto</div>
      <div className={styles.configRow}>
        <select aria-label="Azienda tessuto" value={manufacturer} onChange={(event) => onChange({ configuration: { ...line.configuration, fabricManufacturer: event.target.value, fabricId: "", fabric: "" } })}>
          <option value="">Tutte le aziende</option>
          {manufacturers.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select aria-label="Tessuto" value={text(line.configuration.fabricId)} onChange={(event) => chooseFabric(event.target.value)}>
          <option value="">Seleziona tessuto</option>
          {visibleFabrics.map((fabric) => <option key={fabric.id} value={fabric.id}>
            {text(fabric.collection)} {text(fabric.code)} - {text(fabric.name)} (cat. {effectiveFabricCategory(product, fabric, class1IM) || "-"})
          </option>)}
        </select>
      </div>
      {selectedFabric ? <div className={styles.selectedFabric}>
        {selectedFabric.swatchPath && <img src={asset(selectedFabric.swatchPath)} alt="" />}
        <span>{text(selectedFabric.manufacturer)} - {text(selectedFabric.collection)} {text(selectedFabric.code)}<br />Cat. {effectiveFabricCategory(product, selectedFabric, class1IM) || "-"}</span>
      </div> : <div className={styles.configMuted}>Seleziona un tessuto per determinare categoria e texture.</div>}
      {notRecommended && <div className={styles.configWarning}>Rivestimento sconsigliato dal listino ufficiale per questo prodotto.</div>}
    </div>}

    {optionChoices.length > 0 && Boolean(product.has_fabric) && <div className={styles.configGroup}>
      <div className={styles.configGroupTitle}>Tipo prezzo</div>
      <select value={pricingMode} onChange={(event) => {
        const mode = event.target.value;
        const choice = mode === "option" ? optionChoices[0] : fabricPriceChoices[0];
        if (choice) selectChoice(choice.id, { pricingMode: mode });
      }}>
        <option value="fabric">Versione imbottita / tessuto</option>
        <option value="option">Versione alternativa da listino</option>
      </select>
      {pricingMode === "option" && <select aria-label="Versione alternativa" value={selectedChoice} onChange={(event) => selectChoice(event.target.value, { pricingMode: "option" })}>
        {optionChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
      </select>}
    </div>}

    {finishChoices.length > 0 && pricingMode !== "option" && <div className={styles.configGroup}>
      <div className={styles.configGroupTitle}>Versione prezzo</div>
      <select aria-label="Versione finitura" value={selectedFinish} onChange={(event) => {
        const finishId = event.target.value;
        const category = text(line.configuration.category);
        const choice = fabricPriceChoices.find((item) => item.finishId === finishId && item.category === category)
          ?? fabricPriceChoices.find((item) => item.finishId === finishId);
        if (choice) selectChoice(choice.id, { pricingMode: "fabric" });
      }}>
        {finishChoices.map((choice) => <option key={choice.finishId} value={choice.finishId}>{choice.label.replace(/\s+-\s+Categoria.+$/, "")}</option>)}
      </select>
    </div>}

    {groups.filter((group) => !group.linkedPrice).map((group) => {
      const options = group.options.filter(finishRestricted);
      return <div className={styles.configGroup} key={group.id}>
        <div className={styles.configGroupTitle}>{group.label}</div>
        {group.note && <div className={styles.configMuted}>{group.note}</div>}
        <select value={text(line.configuration[`component:${group.id}`])} onChange={(event) => onChange({ configuration: { ...line.configuration, [`component:${group.id}`]: event.target.value } })}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>;
    })}

    <div className={styles.configGroup}>
      <div className={styles.configGroupTitle}>Note e maggiorazioni</div>
      <div className={styles.configRow}>
        <input aria-label="Maggiorazione manuale" type="number" min="0" step="0.01" value={line.manualSurcharge} placeholder="Maggiorazione €" onChange={(event) => onChange({ manualSurcharge: Math.max(0, Number(event.target.value) || 0) })} />
        <label className={styles.configCheck}><input type="checkbox" checked={class1IM} onChange={(event) => setClass1IM(event.target.checked)} /> Classe 1IM</label>
        <label className={styles.configCheck}><input type="checkbox" checked={Boolean(line.configuration.fireRetardant)} onChange={(event) => onChange({ configuration: { ...line.configuration, fireRetardant: event.target.checked } })} /> Verniciatura ignifuga</label>
      </div>
      <textarea aria-label="Note riga" value={line.note} placeholder="Note riga / specifiche commerciali" onChange={(event) => onChange({ note: event.target.value })} />
    </div>
  </div>;
}
