# True Tetris Pallet — Compact Order Review and Shipping Documents

## Goal

Make the order-review cards denser and easier to scan, then give the final shipment screen and three printed documents a deliberate, ordered hierarchy without changing any packing calculation or archive data.

## Scope

### Compact order cards

- Preserve product, packaging, quantity and gross-weight data.
- Reduce vertical rhythm in the card header, code blocks, packaging row and numeric fields.
- Put the editable `Descrizione supplementare` field on its own full-width row.
- Render its placeholder as normal-weight, light-grey helper text.

### Final shipment screen

- Keep the existing title, shipment status and pallet-management functionality.
- Reflow the top actions into three visually distinct groups: order actions, document actions and language selection.
- Keep the pallet-management controls on one compact, responsive row; allow wrapping only on narrow screens.
- Avoid changing the calculations, selection state, archive save/load format or moving boxes.

### Documents

- **PDF cliente:** create one product row per product/article code, with the number of packages and an explicit list of pallets where that product is found. Preserve product names verbatim; translate only document labels.
- **Etichette pallet:** one landscape A4 page per pallet. Use the True logo, a small `Pallet` label, a visually dominant `N / Total`, shipment reference and pallet details. The whole printable area is intentional rather than a small centred label.
- Keep the existing cargo PDF and the Italian, English, French and German language picker.

## Interaction and visual rules

- Follow the project True Design system: neutral surfaces, restrained borders, Swiss/Apple system typography, 8px spacing rhythm and functional hover/focus states.
- Do not add UI libraries or decorative gradients.
- Respect `prefers-reduced-motion`; the work is layout/print focused and introduces no new animation.
- Print styles explicitly select landscape only for labels; cargo and client documents keep their existing document flow.

## Boundaries

- The packing engine, pallet optimisation, container calculation, archive schema, archive opening and cloud persistence are out of scope for this change.
- No database or Supabase changes are required.
- Existing supplementary descriptions remain plain text and continue to be included in the current document logic where applicable.

## Verification

- Add source-level regression tests for the full-width description field, compact card classes, product-to-pallet client mapping, landscape A4 labels and the label hierarchy.
- Run all standalone tests plus Next.js typecheck and production build.
- Inspect desktop and narrow mobile layouts locally, then verify the deployed internal route after Vercel is Ready.
