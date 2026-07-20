import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "..");
const PARTS_DIR = join(ROOT, "src/app/apps/true-generatore-offerte/catalog-bundle");
const OUTPUT_DIR = join(ROOT, "public/apps/true-generatore-offerte");
const EXPECTED_SHA256 = "2a39e3908ec50bc3632c5a4b69d9fe3be430bd3a7dbc5812cd670c6b6b7a2eae";
const ALLOWED_ROOTS = new Set(["data", "images"]);

function readString(buffer, offset, length) {
  return buffer.subarray(offset, offset + length).toString("utf8").replace(/\0.*$/, "").trim();
}

function safeTarget(relativePath) {
  const clean = normalize(relativePath).replace(/^[/\\]+/, "");
  const root = clean.split(/[\\/]/, 1)[0];
  if (!clean || clean.includes("..") || !ALLOWED_ROOTS.has(root)) {
    throw new Error(`Percorso non valido nel catalogo: ${relativePath}`);
  }
  const target = resolve(OUTPUT_DIR, clean);
  if (!target.startsWith(`${OUTPUT_DIR}/`)) throw new Error(`Percorso fuori destinazione: ${relativePath}`);
  return target;
}

function extractTar(tarBuffer) {
  let offset = 0;
  let files = 0;
  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const relativePath = prefix ? `${prefix}/${name}` : name;
    const sizeText = readString(header, 124, 12);
    const size = Number.parseInt(sizeText || "0", 8);
    if (!Number.isFinite(size) || size < 0) throw new Error(`Dimensione TAR non valida: ${relativePath}`);
    const type = String.fromCharCode(header[156] || 48);
    const target = safeTarget(relativePath.replace(/\/$/, ""));
    const contentOffset = offset + 512;

    if (type === "5" || relativePath.endsWith("/")) {
      mkdirSync(target, { recursive: true });
    } else if (type === "0" || type === "\0") {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, tarBuffer.subarray(contentOffset, contentOffset + size));
      files += 1;
    } else {
      throw new Error(`Tipo TAR non supportato (${type}): ${relativePath}`);
    }
    offset = contentOffset + Math.ceil(size / 512) * 512;
  }
  return files;
}

const parts = readdirSync(PARTS_DIR).filter((name) => name.startsWith("part-")).sort();
if (!parts.length) throw new Error("Bundle catalogo non trovato");
const encoded = parts.map((name) => readFileSync(join(PARTS_DIR, name), "utf8")).join("");
const archive = Buffer.from(encoded, "base64");
const checksum = createHash("sha256").update(archive).digest("hex");
if (checksum !== EXPECTED_SHA256) throw new Error(`Checksum catalogo non valido: ${checksum}`);

for (const directory of ALLOWED_ROOTS) {
  const target = join(OUTPUT_DIR, directory);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}
mkdirSync(OUTPUT_DIR, { recursive: true });
const files = extractTar(gunzipSync(archive));
if (files !== 2619) throw new Error(`Catalogo incompleto: attesi 2619 file, trovati ${files}`);
console.log(`Catalogo TRUE materializzato: ${files} file (${checksum.slice(0, 12)})`);
