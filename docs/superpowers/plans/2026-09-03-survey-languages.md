# Survey Languages Implementation Plan

> Execution: subagent-driven-development for the independent admin task; main agent implements the public survey and coordinates verification. No new user task.

**Goal:** Complete the approved Italian/English/French survey, selection feedback and reliable administrator results management.
**Architecture:** Typed per-app dictionaries and pure selection reducer; API emits stable error codes; existing server actions enforce admin checks; transactional SQL functions serialize archival operations.
**Tech Stack:** Existing Next.js/React/TypeScript/Vitest/Supabase. No new dependencies.

## Global Constraints

- Scope: true-sondaggio-iconici and its admin page only; minimal related files.
- Keep exactly 10 selections and unchanged product names.
- No real votes deleted/reset for testing; no legacy PHP/external archives.
- No survey email exists: do not add mail or translate site-wide registration.
- Preserve unrelated dirty files and automation commits; no branch deletions.
- Implement in the current checkout, already aligned with origin/main a541bc0.
- Test first; selective commits/push; final live verification required.

## Task 1 — Public survey localization (main agent)

Files: app `i18n.ts`, `i18n.test.ts`, `selection.ts`, `selection.test.ts`, `survey.tsx`, `survey.module.css`, `api/route.ts`, `api/route.test.ts`.

Interfaces: `SurveyLocale = 'it'|'en'|'fr'`; `resolveSurveyLocale(query,stored)` returns a supported locale; `surveyCopy[locale]` contains all public text; `toggleSurveySelection(current,index)` returns the next bounded selection array.

- [ ] RED: dictionaries have identical keys; URL overrides storage, invalid values fallback; translated singular/plural/zero, all API errors mapped. Example: `expect(resolveSurveyLocale('fr','en')).toBe('fr')`.
- [ ] RED: `expect(toggleSurveySelection([0,1],0)).toEqual([1])`; adding an 11th choice returns original selection; repeated toggles don't duplicate.
- [ ] Implement pure functions then run targeted Vitest GREEN.
- [ ] Wire selector, URL/localStorage effects with exception handling, localized success/ARIA/title, transient count feedback, disabled input while sending. Localize client errors by stable API code, never expose driver text.
- [ ] Test API invalid requests and database failure safely via mocked gateway; browser-check all languages, persistence, reduced motion, keyboard and narrow viewport.
- [ ] Commit only task files after tests/typecheck.

## Task 2 — Admin deletion and archive reliability (isolated file ownership)

Files: `src/app/admin/apps/true-sondaggio-iconici/` as needed, scoped CSS module; new `supabase/migrations/20260903110000_survey_archive_concurrency.sql`; tests under that admin directory. Do not modify public survey, globals.css, package files, old SQL or automation.

Interfaces: `deleteSurveyResponse(responseId,confirmation)` server action, `runDeleteResponse(responseId,confirmation,gateway)` pure gate with `confirmation === 'ELIMINA'` and UUID validation; gateway deletes only one id and requires an affected row. Existing archive APIs/signatures retained.

- [ ] Write failing deletion tests: invalid UUID and wrong confirmation never call gateway; valid deletes exactly requested id; missing/error do not report success. Add action authorization tests for missing session/non-admin.
- [ ] Implement server guard/action and per-response confirmation UI using existing dialog. Show it only for current dataset, never for archived snapshots; refresh all derived results and exports after deletion.
- [ ] Write SQL regression checks for locks before reads/mutations, consistent lock order, role revocations, transactional rollback, archive-copy count consistency, restore without duplicate response ids, deletion scoped to target archive.
- [ ] Add standalone migration that creates absent archive structures and replaces unsafe functions. Use transaction-wide locks on current responses and both archive tables in a single consistent order before count/copy/delete. Keep safety archive before restoring and restrict execute to service_role.
- [ ] Add isolated SQL test script or documented reproducible SQL fixtures using a separate schema and rollback; no production execution by subagent. Owner performs live verification.
- [ ] Run targeted tests and typecheck, self-review and report exact changes/concerns. No commit/push by subagent while main agent writes public files.

## Task 3 — Integration and live verification (main agent)

- [ ] Review both tasks against spec and code quality; address blocking findings.
- [ ] Run all tests, typecheck and build; inspect no unrelated files staged.
- [ ] Run safe isolated database verification; apply only the reviewed new migration transaction, never all historical migrations; verify structures and function privileges without calling destructive RPCs on real votes.
- [ ] Publish selective site changes, verify Vercel completion, public languages, admin access control and catalog assignment.
- [ ] Record actual results and outstanding blockers; do not claim emails or live operations were tested if they were not.

## Progress

- Base synchronized, old work preserved, 171/171 baseline tests and typecheck passed.
- Tasks 1–3 completed on 2026-09-03. Code published on main in commit 6287571; Vercel deployment succeeded. The checklist above preserves the original implementation plan; completed verification and its explicit limitations are recorded in `../specs/2026-09-03-survey-verification.md`.
- Final verification: 235 tests, typecheck and production build passed; isolated database fixtures passed and rolled back; migration applied with all 11 real responses unchanged; public languages, admin guard, catalog and assignment UI checked live.
