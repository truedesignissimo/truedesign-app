"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./survey.module.css";
import { SURVEY_SELECTION_COUNT } from "./api/validation";
import { resolveSurveyLocale, surveyCopy, surveyErrorMessage, surveyLanguages, SURVEY_LOCALE_STORAGE_KEY, type SurveyLocale } from "./i18n";
import { toggleSurveySelection } from "./selection";

export type Product = {
  name: string;
  url: string;
  img: string;
};

type SurveyProps = {
  products: Product[];
};

export default function Survey({ products }: SurveyProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<SurveyLocale>("it");
  const [feedback, setFeedback] = useState<{ index: number; remaining: number; sequence: number } | null>(null);
  const submissionPending = useRef(false);
  const feedbackSequence = useRef(0);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const copy = surveyCopy[locale];

  useEffect(() => {
    function readLocale() {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(SURVEY_LOCALE_STORAGE_KEY); } catch { /* Private browsing may disable storage. */ }
      setLocale(resolveSurveyLocale(new URL(window.location.href).searchParams.get("lang"), saved));
    }
    readLocale();
    window.addEventListener("popstate", readLocale);
    return () => window.removeEventListener("popstate", readLocale);
  }, []);

  useEffect(() => { document.title = copy.pageTitle; }, [copy.pageTitle]);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 1400);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    if (status === "done") successHeading.current?.focus({ preventScroll: true });
  }, [status]);

  function changeLocale(next: SurveyLocale) {
    setLocale(next);
    try { window.localStorage.setItem(SURVEY_LOCALE_STORAGE_KEY, next); } catch { /* URL still retains the choice. */ }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(window.history.state, "", url);
  }

  const languageSelector = (
    <div className={styles.languages} role="group" aria-label={copy.languageLabel}>
      {surveyLanguages.map((language) => (
        <button key={language.locale} type="button" lang={language.locale}
          aria-label={language.label}
          aria-pressed={locale === language.locale} onClick={() => changeLocale(language.locale)}>
          <svg className={styles.languageFlag} viewBox="0 0 60 60" aria-hidden="true" focusable="false">
            {language.locale === "en" ? <>
              <path fill="#012169" d="M0 0h60v60H0z" />
              <path stroke="#fff" strokeWidth="12" d="m0 0 60 60M60 0 0 60" />
              <path stroke="#c8102e" strokeWidth="4" d="m0 0 60 60M60 0 0 60" />
              <path stroke="#fff" strokeWidth="20" d="M30 0v60M0 30h60" />
              <path stroke="#c8102e" strokeWidth="12" d="M30 0v60M0 30h60" />
            </> : <>
              <path fill={language.locale === "it" ? "#009246" : "#002654"} d="M0 0h20v60H0z" />
              <path fill="#fff" d="M20 0h20v60H20z" />
              <path fill={language.locale === "it" ? "#ce2b37" : "#ed2939"} d="M40 0h20v60H40z" />
            </>}
          </svg>
        </button>
      ))}
    </div>
  );

  const masthead = (
    <div className={styles.masthead}>
      <a className={styles.homeLink} href="/" aria-label={copy.homeLabel}>
        <img className={styles.logo} src="/Assets/Logo%20True.png" alt="True" />
      </a>
      {languageSelector}
    </div>
  );

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isFull = selected.length === SURVEY_SELECTION_COUNT;
  const canSubmit = isFull && name.trim().length > 0 && status !== "sending";

  function toggleProduct(index: number) {
    if (submissionPending.current) return;
    const next = toggleSurveySelection(selected, index);
    if (next === selected) return;
    setSelected(next);
    setFeedback({ index, remaining: SURVEY_SELECTION_COUNT - next.length, sequence: ++feedbackSequence.current });
    setStatus("idle");
    setError("");
  }

  async function submitSurvey() {
    if (!canSubmit || submissionPending.current) return;

    submissionPending.current = true;
    setStatus("sending");
    setError("");
    const choices = selected.map((index) => products[index]);
    const payload = new URLSearchParams({
      nome: name.trim(),
      scelte: choices.map((product, index) => `${index + 1}. ${product.name}`).join("\n"),
      link: choices.map((product) => product.url).join("\n"),
      lang: locale,
      website: "",
    });

    try {
      const response = await fetch("/apps/true-sondaggio-iconici/api", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });
      const result = (await response.json()) as { ok?: boolean; code?: string };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setError(result.code || "save_failed");
        return;
      }
      setStatus("done");
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    } catch {
      setStatus("error");
      setError("network_error");
    } finally {
      submissionPending.current = false;
    }
  }

  if (status === "done") {
    return (
      <main className={styles.successPage} lang={locale}>
        {masthead}
        <section className={styles.successCard} aria-live="polite">
          <span className={styles.successMark} aria-hidden="true">✓</span>
          <p className={styles.kicker}>{copy.recorded}</p>
          <h1 ref={successHeading} tabIndex={-1}>{copy.thanks(name.trim())}</h1>
          <p>{copy.success}</p>
          <a className={styles.backHome} href="/">{copy.backHome} <span aria-hidden="true">↗</span></a>
        </section>
      </main>
    );
  }

  const hint =
    selected.length < SURVEY_SELECTION_COUNT
      ? copy.remaining(SURVEY_SELECTION_COUNT - selected.length)
      : name.trim()
        ? `${copy.selectionComplete}. ${copy.ready}`
        : `${copy.selectionComplete}. ${copy.enterName}`;

  return (
    <main className={styles.page} lang={locale}>
      {masthead}
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.kicker}>{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className={styles.intro}>{copy.intro}</p>
        </div>
      </header>

      <section className={styles.grid} aria-label={copy.productsLabel} aria-busy={status === "sending"}>
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
              aria-label={`${product.name}${isSelected ? `, ${copy.selectedLabel}` : ""}`}
              disabled={isUnavailable || status === "sending"}
            >
              <span className={styles.badge} aria-hidden="true">{isSelected ? "✓" : ""}</span>
              <img src={product.img} alt="" loading="lazy" />
              <span className={styles.productName}>{product.name}</span>
              {feedback?.index === index && (
                <span key={feedback.sequence} className={styles.selectionFeedback} aria-hidden="true">
                  <strong>{feedback.remaining === 0 ? "✓" : feedback.remaining}</strong>
                  <span>{copy.remaining(feedback.remaining)}</span>
                </span>
              )}
            </button>
          );
        })}
      </section>

      <footer className={styles.actionBar}>
        <div className={styles.actionInner}>
          <div className={styles.progress}>
            <span className={styles.counter}>{selected.length}</span>
            <span>{copy.progress}</span>
          </div>
          <div className={styles.controls}>
            <label className={styles.nameField}>
              <span>{copy.nameLabel}</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setStatus("idle");
                  setError("");
                }}
                disabled={status === "sending"}
                autoComplete="name"
                maxLength={120}
                placeholder={copy.namePlaceholder}
              />
            </label>
            <button className={styles.submit} type="button" onClick={submitSurvey} disabled={!canSubmit}>
              {status === "sending" ? copy.sending : copy.submit}
            </button>
          </div>
          <p className={`${styles.hint} ${status === "error" ? styles.error : ""}`} aria-live="polite">
            {status === "error" ? surveyErrorMessage(locale, error) : hint}
          </p>
        </div>
      </footer>
    </main>
  );
}
