# Tetris Operator Layout Design

## Goal

Make the order and pallet workflow denser, make the container view legible and grounded, and reduce a cross-pallet transfer to one direct interaction.

## Scope

1. Product cards use a compact four-column desktop grid with reduced padding, shorter code and packaging blocks, and a full-width supplementary-description input.
2. The pallet selection header contains the prominent calculation action. Maximum height and maximum overhang share a single settings row. The custom-pallet form remains a single horizontal row on desktop.
3. The container recommendation uses a canvas-based isometric renderer built from the same cuboid projection principles as the pallet overview. Every pallet sits at z=0; the container floor and walls stay inside the visual frame. Container choices form one row and the alternative-layout action has its own row below.
4. The pallet-management bar is split into compact add, change, and remove groups with consistent controls.
5. Selecting boxes in the complete pallet board reveals one move icon. Pressing it expands inline destination pallet buttons; choosing a destination moves the selection without a modal. Success and failure remain visible in the editor notice stack.
6. The geometry/control status section is removed. The document language and print controls move to the bottom of the editor. Printed headers identify True Design and the document type only; they never mention “Tetris Pallet”.

## Constraints

- No change to packing, collision, optimisation, archive, or persistence data structures.
- Existing direct-container and pallet-container calculation results remain the source of truth.
- Mobile layouts may wrap but desktop controls stay in one logical row where requested.
- Source tests assert layout markers and document branding so generated output cannot silently regress.

## Verification

- Run the standalone engine, archive, motion, PDF/labels, and feedback tests.
- Generate the Next document and assert it hashes exactly to the embedded `origin/main` candidate before publishing.
- Build and typecheck the Next worktree.
- Inspect the public route after Vercel is Ready.
