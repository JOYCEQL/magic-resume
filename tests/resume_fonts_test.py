"""Run with: python -m unittest discover -s tests -p 'resume_fonts_test.py'."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


spec = importlib.util.spec_from_file_location(
    "resume_fonts", Path(__file__).resolve().parents[1] / "scripts/generate-resume-fonts.py"
)
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class FontGenerationTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.original_root = generator.ROOT
        generator.ROOT = Path(self.directory.name)
        self.addCleanup(setattr, generator, "ROOT", self.original_root)
        (generator.ROOT / "public/fonts/resume").mkdir(parents=True)
        self.source = generator.ROOT / "public/fonts/test.ttf"
        self.write_font(500)

    def write_font(self, width):
        builder = FontBuilder(1000, isTTF=True)
        names = [".notdef", "A", "rare"]
        builder.setupGlyphOrder(names)
        builder.setupCharacterMap({0x41: "A", 0x9F98: "rare"})
        glyphs = {}
        for name in names:
            pen = TTGlyphPen(None)
            pen.moveTo((0, 0))
            pen.lineTo((200, 0))
            pen.lineTo((200, 500))
            pen.closePath()
            glyphs[name] = pen.glyph()
        builder.setupGlyf(glyphs)
        builder.setupHorizontalMetrics({name: (width, 0) for name in names})
        builder.setupHorizontalHeader(ascent=800, descent=-200)
        builder.setupNameTable({"familyName": "Test", "styleName": "Regular"})
        builder.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
        builder.setupPost()
        builder.setupMaxp()
        builder.save(self.source)

    def packed(self, url):
        return TTFont(generator.ROOT / "public" / url.lstrip("/"))

    def test_changed_codepoints_rebuild_slice(self):
        first, _ = generator.build_and_verify_slice("test.ttf", "core", {0x41})
        second, _ = generator.build_and_verify_slice("test.ttf", "core", {0x41, 0x9F98})
        self.assertNotEqual(first, second)
        with self.packed(second) as font:
            self.assertEqual(set(font.getBestCmap()), {0x41, 0x9F98})

    def test_changed_source_rebuilds_glyph_metrics(self):
        first, _ = generator.build_and_verify_slice("test.ttf", "core", {0x41})
        self.write_font(700)
        second, _ = generator.build_and_verify_slice("test.ttf", "core", {0x41})
        self.assertNotEqual(first, second)
        with self.packed(second) as font:
            self.assertEqual(font["hmtx"].metrics[font.getBestCmap()[0x41]][0], 700)


if __name__ == "__main__":
    unittest.main()
