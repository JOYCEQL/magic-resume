"""Subset existing MiSans and Source Han Serif fonts for the bilingual landing page.
Run after changing homepage copy: python -m pip install fonttools brotli
Then: python scripts/generate-landing-fonts.py
"""
from pathlib import Path
import json
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
text = ''.join(chr(code) for code in range(32, 127)) + '魔方简历切换到中文'
for locale in ('zh', 'en'):
    messages = json.loads((root / f'src/i18n/locales/{locale}.json').read_text())
    text += json.dumps(messages['home'], ensure_ascii=False)
output = root / 'public/fonts/landing'
output.mkdir(parents=True, exist_ok=True)
for source, filename in [
    ('MiSans-Normal.ttf', 'misans-400.woff2'),
    ('MiSans-Medium.ttf', 'misans-700.woff2'),
    ('SourceHanSerifSC-Medium.otf', 'source-han-serif-500.woff2'),
]:
    font = TTFont(root / 'public/fonts' / source)
    options = subset.Options()
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(output / filename)
