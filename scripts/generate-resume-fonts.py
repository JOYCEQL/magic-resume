"""Losslessly slice the resume fonts into unicode-range WOFF2 subsets while
preserving 100% character coverage and identical glyph advance widths.

python -m pip install fonttools brotli
python scripts/generate-resume-fonts.py
"""
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = [
    ("Alibaba PuHuiTi", "AlibabaPuHuiTi-3-55-Regular.ttf", 400),
    ("Alibaba PuHuiTi", "AlibabaPuHuiTi-3-85-Bold.ttf", 700),
    ("MiSans", "MiSans-Normal.ttf", 400),
    ("MiSans", "MiSans-Medium.ttf", 700),
    ("Noto Sans SC", "NotoSansSC-Regular.otf", 400),
    ("Noto Sans SC", "NotoSansSC-Medium.otf", 500),
    ("Noto Sans SC", "NotoSansSC-Bold.otf", 700),
    ("Source Han Serif SC", "SourceHanSerifSC-Regular.otf", 400),
    ("Source Han Serif SC", "SourceHanSerifSC-Medium.otf", 500),
    ("Source Han Serif SC", "SourceHanSerifSC-Bold.otf", 700),
]


def to_unicode_range(cps: set[int]) -> str:
    sorted_cps = sorted(cps)
    if not sorted_cps:
        return ""
    ranges: list[str] = []
    start = prev = sorted_cps[0]
    for cp in sorted_cps[1:]:
        if cp == prev + 1:
            prev = cp
        else:
            ranges.append(
                f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}"
            )
            start = prev = cp
    ranges.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
    return ",".join(ranges)


def build_gb2312_sets() -> tuple[set[int], set[int]]:
    l1: set[int] = set()
    l2: set[int] = set()
    for row in range(16, 56):
        for col in range(1, 95):
            try:
                ch = bytes([0xA0 + row, 0xA0 + col]).decode("gb2312")
                l1.add(ord(ch))
            except Exception:
                pass
    for row in range(56, 88):
        for col in range(1, 95):
            try:
                ch = bytes([0xA0 + row, 0xA0 + col]).decode("gb2312")
                l2.add(ord(ch))
            except Exception:
                pass
    return l1, l2


def build_fixed_core_ranges() -> set[int]:
    return (
        set(range(0x0020, 0x0250))
        | set(range(0x2000, 0x2700))
        | set(range(0x3000, 0x3040))
        | set(range(0xFE30, 0xFE50))
        | set(range(0xFF00, 0xFFF0))
    )


def build_extra_core_candidates(l1: set[int]) -> set[int]:
    extra = set(l1)
    for rel in [
        "src/config/initialResumeData.ts",
        "src/i18n/locales/zh.json",
        "src/i18n/locales/en.json",
        "tests/fixtures/one-page-lists.json",
    ]:
        text = (ROOT / rel).read_text(encoding="utf-8")
        for ch in text:
            if ord(ch) >= 0x20:
                extra.add(ord(ch))
    return extra


def subset_to_woff2_bytes(source: Path, cps: set[int]) -> bytes:
    font = TTFont(source, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=cps)
    subsetter.subset(font)
    font.flavor = "woff2"
    buffer = io.BytesIO()
    font.save(buffer)
    return buffer.getvalue()


def build_and_verify_slice(
    filename: str, slice_key: str, s_cps: set[int]
) -> tuple[str, int]:
    source = ROOT / "public/fonts" / filename
    output = ROOT / "public/fonts/resume"
    # Regenerate from the actual source and codepoint set. Output hashes alone
    # cannot validate inputs: changing the core set moves glyphs between slices.
    orig_font = TTFont(source, recalcTimestamp=False)
    orig_cmap = orig_font.getBestCmap()
    orig_hmtx = orig_font["hmtx"].metrics
    data = subset_to_woff2_bytes(source, s_cps)
    packed = TTFont(io.BytesIO(data))
    packed_cmap = packed.getBestCmap()
    packed_hmtx = packed["hmtx"].metrics
    assert s_cps.issubset(packed_cmap.keys()), f"{filename} {slice_key}"
    for cp in s_cps:
        assert (
            orig_hmtx[orig_cmap[cp]][0] == packed_hmtx[packed_cmap[cp]][0]
        ), f"{filename} {slice_key} width mismatch at U+{cp:X}"

    digest = hashlib.sha256(data).hexdigest()[:12]
    name = f"{source.stem}.{slice_key}.{digest}.woff2"
    (output / name).write_bytes(data)
    return f"/fonts/resume/{name}", len(data)


def main() -> None:
    l1_raw, l2_raw = build_gb2312_sets()
    fixed_core = build_fixed_core_ranges()
    extra_core_candidates = build_extra_core_candidates(l1_raw) - fixed_core

    # Intersect extra CJK/symbol core candidates & L2 across all 10 fonts so
    # every codepoint in shared core/l2 unicode-range rules is guaranteed to
    # exist in every font slice.
    common_all_fonts: set[int] | None = None
    for _, filename, _ in FONTS:
        font = TTFont(ROOT / "public/fonts" / filename, recalcTimestamp=False)
        font_cps = set(font.getBestCmap().keys())
        common_all_fonts = (
            font_cps
            if common_all_fonts is None
            else (common_all_fonts & font_cps)
        )
    assert common_all_fonts is not None

    extra_core_cps = extra_core_candidates & common_all_fonts
    core_Selector_cps = fixed_core | extra_core_cps
    l2_cps = (l2_raw & common_all_fonts) - core_Selector_cps

    range_defs = {
        "ext1": "U+0-1F,U+250-1FFF,U+2700-2FFF,U+3040-62FF",
        "ext2": "U+6300-77FF",
        "ext3": "U+7800-8CFF",
        "ext4": "U+8D00-FE2F,U+FE50-FEFF,U+FFF0-10FFFF",
        "l2": to_unicode_range(l2_cps),
        "core": to_unicode_range(core_Selector_cps),
    }

    output = ROOT / "public/fonts/resume"
    output.mkdir(parents=True, exist_ok=True)
    # Remove old un-sliced single font files without slice_key
    for existing in output.glob("*.woff2"):
        if len(existing.name.split(".")) < 4:
            existing.unlink()

    fonts_manifest: dict[str, list[dict[str, str]]] = {}
    rules = [
        "/* Generated by scripts/generate-resume-fonts.py. */",
        '@import "../styles/newsreader.css";\n',
    ]

    jobs: list[tuple[str, str, int, str, set[int]]] = []
    for family, filename, weight in FONTS:
        source = ROOT / "public/fonts" / filename
        orig_font = TTFont(source, recalcTimestamp=False)
        all_cps = set(orig_font.getBestCmap().keys())
        font_core_cps = all_cps & core_Selector_cps
        font_l2_cps = all_cps & l2_cps
        rem_cps = all_cps - font_core_cps - font_l2_cps

        slice_specs = [
            ("ext1", {cp for cp in rem_cps if cp < 0x6300}),
            ("ext2", {cp for cp in rem_cps if 0x6300 <= cp < 0x7800}),
            ("ext3", {cp for cp in rem_cps if 0x7800 <= cp < 0x8D00}),
            ("ext4", {cp for cp in rem_cps if cp >= 0x8D00}),
            ("l2", font_l2_cps),
            ("core", font_core_cps),
        ]

        reconstructed: set[int] = set()
        for _, s_cps in slice_specs:
            assert not (reconstructed & s_cps), filename
            reconstructed |= s_cps
        assert reconstructed == all_cps, filename

        for slice_key, s_cps in slice_specs:
            if s_cps:
                jobs.append((family, filename, weight, slice_key, s_cps))

    results: dict[tuple[str, str], tuple[str, int]] = {}
    with concurrent.futures.ProcessPoolExecutor() as executor:
        future_map = {
            executor.submit(build_and_verify_slice, filename, slice_key, s_cps): (
                filename,
                slice_key,
            )
            for _, filename, _, slice_key, s_cps in jobs
        }
        for future in concurrent.futures.as_completed(future_map):
            key = future_map[future]
            results[key] = future.result()

    for family, filename, weight in FONTS:
        source = ROOT / "public/fonts" / filename
        slice_entries: list[dict[str, str]] = []
        total_bytes = 0
        core_bytes = 0
        for slice_key in ["ext1", "ext2", "ext3", "ext4", "l2", "core"]:
            if (filename, slice_key) not in results:
                continue
            url, size = results[(filename, slice_key)]
            slice_entries.append({"url": url, "range": slice_key})
            total_bytes += size
            if slice_key == "core":
                core_bytes = size

            rules.append(
                f"""@font-face {{
  font-family: "{family}";
  src: url("{url}") format("woff2");
  font-weight: {weight};
  font-style: normal;
  font-display: swap;
  unicode-range: {range_defs[slice_key]};
}}
"""
            )

        fonts_manifest[filename] = slice_entries
        print(
            f"{filename}: raw={source.stat().st_size / 1048576:.2f} MiB -> "
            f"core={core_bytes / 1024:.1f} KiB, total_slices={total_bytes / 1048576:.2f} MiB"
        )

    manifest = {
        "ranges": range_defs,
        "fonts": fonts_manifest,
    }
    (ROOT / "src/generated/resume-fonts.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    (ROOT / "src/app/font.css").write_text("\n".join(rules), encoding="utf-8")


if __name__ == "__main__":
    main()
