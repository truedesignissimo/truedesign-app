# Pallet, Container and Documents Implementation Plan

**Goal:** Make the True Tetris Pallet workflow support prioritized/custom pallets, direct container loading, clearer failures and purpose-specific multilingual documents.

**Architecture:** Keep the standalone packing engine as the single source of geometry rules and generate the embedded Next.js document from it. Extend the same load model with a `mode` (`pallet` or `container`), so the archive and PDF code retain one shipment format.

## Tasks

- [ ] Add failing engine tests for 120x80 priority, configurable overhang, explicit unplaced-box diagnostics and valid large-on-small support.
- [ ] Extend the engine scoring and load creation without changing verified catalogue dimensions.
- [ ] Add custom pallet definitions and selected-pallet replacement, persisted with the shipment.
- [ ] Add mode selection and direct-box container optimisation for verified 20GP, 40GP and 40HC profiles.
- [ ] Rebuild the contained isometric container renderer and alternate valid layouts.
- [ ] Add supplemental product descriptions and red, localised box-error cards.
- [ ] Replace the header controls, remove favourite/last-order controls and add compact mode picker by upload.
- [ ] Split printing into cargo, client and pallet-label documents with language dictionaries.
- [ ] Regenerate the Next.js embedded document, run standalone and route tests, commit, push and confirm the production deployment.

## Verification

- [ ] Run engine, archive, PDF and feedback test suites.
- [ ] Build the Next.js application.
- [ ] Inspect the deployed route and verify the version contains each approved control.
