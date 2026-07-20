import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("catalogo commerciale pubblicato", () => {
  it("include l'intera collezione ufficiale Spradling Valencia", () => {
    const root = resolve(import.meta.dirname, "../../../../..");
    execFileSync(process.execPath, ["scripts/materialize-true-offer-catalog.mjs"], {
      cwd: root,
      stdio: "pipe",
    });
    const base = resolve(root, "public/apps/true-generatore-offerte/data");
    const manifest = JSON.parse(readFileSync(resolve(base, "catalog-manifest.json"), "utf8"));
    const catalog = JSON.parse(readFileSync(resolve(base, "fabrics.json"), "utf8"));
    const valencia = catalog.fabrics.filter((fabric: Record<string, unknown>) => fabric.collection === "VALENCIA");

    expect(manifest.fabricCount).toBe(1830);
    expect(valencia).toHaveLength(72);
    expect(valencia[0]).toMatchObject({
      id: "VALENCIA 107-9607",
      category: "T",
      manufacturer: "Spradling",
      swatchPath: expect.stringMatching(/^images\/fabrics\//),
    });
    expect(valencia.at(-1)).toMatchObject({ id: "VALENCIA 107-0020", name: "MOCCA" });
  });
});
