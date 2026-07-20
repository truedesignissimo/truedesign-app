#!/usr/bin/env python3
"""Convert the verified V3 distribution into static, cacheable web assets."""

from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import re
from pathlib import Path
from typing import Any


REQUIRED_FILES = ("products-app.json", "products-data.json", "fabrics-data.json")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "asset"


def _decode_asset(encoded: str) -> tuple[bytes, str]:
    payload = encoded.split(",", 1)[1] if encoded.startswith("data:") else encoded
    raw = base64.b64decode(payload, validate=True)
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return raw, "png"
    if raw.startswith(b"\xff\xd8\xff"):
        return raw, "jpg"
    if raw.startswith((b"RIFF",)) and raw[8:12] == b"WEBP":
        return raw, "webp"
    raise ValueError("Unsupported embedded image format")


def _save_asset(output: Path, relative_dir: str, stem: str, encoded: str) -> str:
    raw, extension = _decode_asset(encoded)
    digest = hashlib.sha256(raw).hexdigest()[:16]
    relative = Path("images") / relative_dir / f"{_slug(stem)}-{digest}.{extension}"
    destination = output / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        destination.write_bytes(raw)
    return relative.as_posix()


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export_catalog(source: Path, output: Path) -> dict[str, Any]:
    source = Path(source)
    output = Path(output)
    missing = [name for name in REQUIRED_FILES if not (source / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing V3 catalog file: {missing[0]}")

    source_products = _read_json(source / "products-app.json")
    source_full = _read_json(source / "products-data.json")
    source_fabrics = _read_json(source / "fabrics-data.json")
    if not isinstance(source_products, list) or not isinstance(source_fabrics.get("fabrics"), list):
        raise ValueError("Invalid V3 catalog structure")

    products = []
    for original in source_products:
        product = copy.deepcopy(original)
        code = str(product.get("code") or "product")
        drawing = product.pop("image", None)
        photo = product.pop("productPhoto", None)
        if drawing:
            product["imagePath"] = _save_asset(output, "products", f"{code}-drawing", drawing)
        if photo:
            product["productPhotoPath"] = _save_asset(output, "products", f"{code}-photo", photo)
        products.append(product)

    fabrics = copy.deepcopy(source_fabrics)
    for fabric in fabrics["fabrics"]:
        swatch = fabric.pop("swatch", None)
        if swatch:
            identity = str(fabric.get("id") or fabric.get("code") or "fabric")
            fabric["swatchPath"] = _save_asset(output, "fabrics", identity, swatch)

    catalog_meta = {
        key: copy.deepcopy(source_full[key])
        for key in ("fabric_categories", "finish_palettes", "meta")
        if key in source_full
    }
    manifest = {
        "version": "next-v1",
        "productCount": len(products),
        "fabricCount": len(fabrics["fabrics"]),
        "sourceHashes": {name: _sha256(source / name) for name in REQUIRED_FILES},
    }
    _write_json(output / "data/products.json", products)
    _write_json(output / "data/fabrics.json", fabrics)
    _write_json(output / "data/catalog-meta.json", catalog_meta)
    _write_json(output / "data/catalog-manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(export_catalog(args.source, args.output), indent=2))


if __name__ == "__main__":
    main()
