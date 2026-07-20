import base64
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("export-v3-catalog.py")


def load_exporter():
    spec = importlib.util.spec_from_file_location("export_v3_catalog", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class ExportCatalogTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "source"
        self.output = self.root / "public"
        self.source.mkdir()
        png = base64.b64encode(b"\x89PNG\r\n\x1a\nDRAWING").decode()
        jpg = base64.b64encode(b"\xff\xd8\xffPHOTO").decode()
        product = {
            "code": "AB 1000",
            "family": "ABISKO",
            "prices": {"S": 1000, "T": 1100},
            "prices_EF": {"S": 1200, "T": 1300},
            "finishes": ["Ashwood"],
            "componentGroups": [{"id": "shell", "options": ["Ashwood"]}],
            "extraCharges": [{"label": "custom color", "price": 80}],
            "image": png,
            "productPhoto": jpg,
            "productPhotoUrl": "https://example.test/ab.jpg",
        }
        (self.source / "products-app.json").write_text(json.dumps([product]))
        (self.source / "products-data.json").write_text(json.dumps({
            "families": {"Abisko": {"products": [{"code": "AB 1000", "drawing": png, "photo": jpg}]}},
            "fabric_categories": {"order": ["S", "T"]},
            "finish_palettes": {"wood": ["Ashwood"]},
            "meta": {"currency": "EUR"},
        }))
        (self.source / "fabrics-data.json").write_text(json.dumps({
            "version": "fixture-v1",
            "fabrics": [{"id": "fab-1", "manufacturer": "Camira", "category": "S", "swatch": jpg}],
        }))

    def tearDown(self):
        self.temp.cleanup()

    def test_preserves_commercial_fields_and_extracts_images(self):
        exporter = load_exporter()
        manifest = exporter.export_catalog(self.source, self.output)
        products = json.loads((self.output / "data/products.json").read_text())

        self.assertEqual(products[0]["prices"], {"S": 1000, "T": 1100})
        self.assertEqual(products[0]["prices_EF"], {"S": 1200, "T": 1300})
        self.assertEqual(products[0]["extraCharges"][0]["price"], 80)
        self.assertNotIn("image", products[0])
        self.assertNotIn("productPhoto", products[0])
        self.assertTrue((self.output / products[0]["imagePath"].lstrip("/")).is_file())
        self.assertTrue((self.output / products[0]["productPhotoPath"].lstrip("/")).is_file())
        self.assertEqual(manifest["productCount"], 1)

    def test_extracts_fabric_swatches_and_keeps_metadata(self):
        exporter = load_exporter()
        exporter.export_catalog(self.source, self.output)
        fabrics = json.loads((self.output / "data/fabrics.json").read_text())
        metadata = json.loads((self.output / "data/catalog-meta.json").read_text())

        self.assertNotIn("swatch", fabrics["fabrics"][0])
        self.assertTrue((self.output / fabrics["fabrics"][0]["swatchPath"].lstrip("/")).is_file())
        self.assertEqual(metadata["finish_palettes"], {"wood": ["Ashwood"]})
        self.assertNotIn("families", metadata)


if __name__ == "__main__":
    unittest.main()
