"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { loadCatalog, type Catalog, type CatalogProduct } from "./data/catalog";
import { createImageStorage } from "./data/image-storage";
import { createOffersRepository } from "./data/offers-repository";
import { createLineFromProduct } from "./domain/product-pricing";
import type { Offer, OfferLine, PriceList } from "./domain/types";
import { createEmptyOffer, offerReducer, type OfferAction } from "./state/offer-reducer";
import OfferArchive from "./components/offer-archive";
import OfferHeader from "./components/offer-header";
import OfferLines from "./components/offer-lines";
import OfferTotals from "./components/offer-totals";
import ProductSearch from "./components/product-search";
import PdfPreview from "./components/pdf-preview";
import styles from "./offer-generator.module.css";

export default function OfferGenerator({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const repository = useMemo(() => createOffersRepository(supabase), [supabase]);
  const imageStorage = useMemo(() => createImageStorage(supabase), [supabase]);
  const [offer, dispatch] = useReducer(offerReducer, userId, (id) => createEmptyOffer(id));
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [archive, setArchive] = useState<Offer[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Caricamento catalogo...");

  const change = useCallback((action: OfferAction) => { dispatch(action); setDirty(true); }, []);
  const replace = useCallback((next: Offer) => change({ type: "offer/replace", offer: next }), [change]);

  useEffect(() => {
    Promise.all([loadCatalog(), repository.listOffers(userId)])
      .then(([nextCatalog, offers]) => { setCatalog(nextCatalog); setArchive(offers); setStatus("Pronto"); })
      .catch((error: Error) => setStatus(error.message));
  }, [repository, userId]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      setStatus("Salvataggio...");
      repository.saveOffer(offer).then((saved) => {
        setArchive((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
        setDirty(false); setStatus("Salvata");
      }).catch((error: Error) => setStatus(error.message));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, offer, repository]);

  const addProduct = (product: CatalogProduct) => {
    try { change({ type: "line/add", line: createLineFromProduct(product, offer.priceList) }); }
    catch (error) { setStatus((error as Error).message); }
  };
  const updateLine = (lineId: string, patch: Partial<OfferLine>) => change({ type: "line/update", lineId, patch });
  const uploadImage = async (line: OfferLine, file: File) => {
    const localUrl = URL.createObjectURL(file); setPreviews((items) => ({ ...items, [line.id]: localUrl }));
    try { const path = await imageStorage.uploadLineImage({ userId, offerId: offer.id, lineId: line.id, file }); updateLine(line.id, { customImagePath: path }); setStatus("Immagine caricata"); }
    catch (error) { setPreviews((items) => { const next = { ...items }; delete next[line.id]; return next; }); setStatus((error as Error).message); }
  };

  if (!catalog) return <main className={styles.loading}><div /><p>{status}</p></main>;
  return <main className={styles.app}>
    <header className={styles.topbar}><a href="/dashboard">Dashboard</a><span className={status.includes("Errore") ? styles.error : ""}>{status}</span></header>
    <div className={styles.workspace}>
      <OfferArchive offers={archive} currentId={offer.id} onOpen={(item) => { dispatch({ type: "offer/replace", offer: item }); setDirty(false); }} onNew={() => { dispatch({ type: "offer/replace", offer: createEmptyOffer(userId) }); setDirty(false); setPreviews({}); }} />
      <div className={styles.document}>
        <OfferHeader offer={offer} onChange={replace} onPriceList={(priceList: PriceList) => change({ type: "price-list/set", priceList })} />
        <ProductSearch products={catalog.products} onSelect={addProduct} />
        <OfferLines lines={offer.lines} products={catalog.products} fabrics={catalog.fabrics.fabrics} priceList={offer.priceList} previews={previews} onUpdate={updateLine} onRemove={(lineId) => change({ type: "line/remove", lineId })} onImage={uploadImage} />
        <OfferTotals offer={offer} onChange={replace} />
        <PdfPreview offer={offer} products={catalog.products} imageUrls={previews} />
      </div>
    </div>
  </main>;
}
