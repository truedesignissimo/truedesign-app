"use client";

import { useMemo, useState } from "react";
import styles from "./survey.module.css";

export type Product = {
  name: string;
  url: string;
  img: string;
};

type SurveyProps = {
  products: Product[];
};

const MAX_SELECTIONS = 5;

export default function Survey({ products }: SurveyProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isFull = selected.length === MAX_SELECTIONS;
  const canSubmit = isFull && name.trim().length > 0 && status !== "sending";

  function toggleProduct(index: number) {
    setSelected((current) => {
      if (current.includes(index)) {
        return current.filter((item) => item !== index);
      }
      if (current.length >= MAX_SELECTIONS) {
        return current;
      }
      return [...current, index];
    });
    setStatus("idle");
    setError("");
  }

  async function submitSurvey() {
    if (!canSubmit) return;

    setStatus("sending");
    setError("");
    const choices = selected.map((index) => products[index]);
    const payload = new URLSearchParams({
      nome: name.trim(),
      scelte: choices.map((product, index) => `${index + 1}. ${product.name}`).join("\n"),
      link: choices.map((product) => product.url).join("\n"),
      data: new Date().toLocaleString("it-IT"),
      website: "",
    });

    try {
      const response = await fetch("/apps/true-sondaggio-iconici/api", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Invio non riuscito");
      }
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Invio non riuscito");
    }
  }

  if (status === "done") {
    return (
      <main className={styles.successPage}>
        <section className={styles.successCard} aria-live="polite">
          <span className={styles.successMark}>✓</span>
          <p className={styles.kicker}>Risposta registrata</p>
          <h1>Grazie, {name.trim()}!</h1>
          <p>Le tue cinque scelte sono state inviate correttamente.</p>
        </section>
      </main>
    );
  }

  const hint =
    selected.length < MAX_SELECTIONS
      ? `Scegli ancora ${MAX_SELECTIONS - selected.length} ${MAX_SELECTIONS - selected.length === 1 ? "prodotto" : "prodotti"}.`
      : name.trim()
        ? "Tutto pronto: puoi inviare la tua selezione."
        : "Inserisci il tuo nome per inviare.";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.kicker}>True Design · Survey</p>
          <h1>Quali sono i prodotti iconici di True?</h1>
          <p className={styles.intro}>
            Aiutaci a identificare i prodotti che meglio rappresentano l&apos;identità di True. Seleziona le
            cinque collezioni che ritieni più iconiche e riconoscibili.
          </p>
        </div>
        <img className={styles.logo} src="/Assets/Logo%20True.png" alt="True" />
      </header>

      <section className={styles.grid} aria-label="Prodotti True">
        {products.map((product, index) => {
          const isSelected = selectedSet.has(index);
          const isUnavailable = isFull && !isSelected;

          return (
            <button
              className={`${styles.card} ${isSelected ? styles.selected : ""} ${isUnavailable ? styles.unavailable : ""}`}
              type="button"
              key={product.name}
              onClick={() => toggleProduct(index)}
              aria-pressed={isSelected}
              aria-label={`${product.name}${isSelected ? ", selezionato" : ""}`}
              disabled={isUnavailable}
            >
              <span className={styles.badge} aria-hidden="true">{isSelected ? "✓" : ""}</span>
              <img src={product.img} alt="" loading="lazy" />
              <span className={styles.productName}>{product.name}</span>
            </button>
          );
        })}
      </section>

      <footer className={styles.actionBar}>
        <div className={styles.actionInner}>
          <div className={styles.progress}>
            <span className={styles.counter}>{selected.length}</span>
            <span>di {MAX_SELECTIONS} selezionati</span>
          </div>
          <div className={styles.controls}>
            <label className={styles.nameField}>
              <span>Il tuo nome</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setStatus("idle");
                }}
                autoComplete="name"
                maxLength={120}
                placeholder="Nome e cognome"
              />
            </label>
            <button className={styles.submit} type="button" onClick={submitSurvey} disabled={!canSubmit}>
              {status === "sending" ? "Invio…" : "Invia selezione"}
            </button>
          </div>
          <p className={`${styles.hint} ${status === "error" ? styles.error : ""}`} aria-live="polite">
            {status === "error" ? `Errore di invio: ${error}. Riprova.` : hint}
          </p>
        </div>
      </footer>
    </main>
  );
}
