import type { Offer } from "../domain/types";
import styles from "../offer-generator.module.css";

const addDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export default function CustomerDetails({
  offer,
  onChange,
}: {
  offer: Offer;
  onChange: (offer: Offer) => void;
}) {
  const customer = (field: keyof Offer["customer"], value: string) =>
    onChange({ ...offer, customer: { ...offer.customer, [field]: value } });
  const project = (field: keyof Offer["project"], value: string) =>
    onChange({ ...offer, project: { ...offer.project, [field]: value } });
  const setOfferDate = (offerDate: string) => {
    const validUntil = addDays(offerDate, offer.validityDays);
    onChange({
      ...offer,
      offerDate,
      validUntil,
      project: { ...offer.project, validUntil },
    });
  };
  const setValidUntil = (validUntil: string) =>
    onChange({ ...offer, validUntil, project: { ...offer.project, validUntil } });

  return (
    <>
      <div className={styles.field}>
        <label htmlFor="custName">Nome</label>
        <input id="custName" value={offer.customer.name ?? ""} onChange={(event) => customer("name", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="custCompany">Azienda</label>
        <input id="custCompany" value={offer.customer.company ?? ""} onChange={(event) => customer("company", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="custVatNumber">Partita IVA / Codice fiscale</label>
        <input id="custVatNumber" value={offer.customer.vatNumber ?? ""} onChange={(event) => customer("vatNumber", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="custEmail">Email</label>
        <input id="custEmail" type="email" value={offer.customer.email ?? ""} onChange={(event) => customer("email", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="custPhone">Telefono</label>
        <input id="custPhone" value={offer.customer.phone ?? ""} onChange={(event) => customer("phone", event.target.value)} />
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor="custAddress">Indirizzo</label>
        <input id="custAddress" value={offer.customer.address ?? ""} onChange={(event) => customer("address", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="offerNumber">Numero Offerta</label>
        <input id="offerNumber" value={offer.number} onChange={(event) => onChange({ ...offer, number: event.target.value })} />
      </div>
      <div className={styles.field}>
        <label htmlFor="offerDate">Data Preventivo</label>
        <input id="offerDate" type="date" value={offer.offerDate} onChange={(event) => setOfferDate(event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="offerValidUntil">Validità</label>
        <input id="offerValidUntil" type="date" value={offer.validUntil} onChange={(event) => setValidUntil(event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="vatRate">IVA</label>
        <select id="vatRate" value={offer.vatRate} onChange={(event) => onChange({ ...offer, vatRate: Number(event.target.value) })}>
          <option value={22}>22% (standard)</option>
          <option value={0}>0% (reverse charge / extra UE)</option>
          <option value={4}>4%</option>
          <option value={10}>10%</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="projectReference">Riferimento Progetto</label>
        <input id="projectReference" value={offer.project.reference ?? ""} onChange={(event) => project("reference", event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="salesRepresentative">Referente Commerciale</label>
        <input id="salesRepresentative" value={offer.salesRepresentative} onChange={(event) => onChange({ ...offer, salesRepresentative: event.target.value })} />
      </div>
      <div className={styles.field}>
        <label htmlFor="paymentTerms">Tipologia di pagamento</label>
        <input id="paymentTerms" value={offer.paymentTerms} placeholder="Es. Ri.Ba. 30/60 gg, bonifico, acconto..." onChange={(event) => onChange({ ...offer, paymentTerms: event.target.value })} />
      </div>
    </>
  );
}
