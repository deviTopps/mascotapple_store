import json
import re
from pathlib import Path

PALETTES = json.loads((Path(__file__).with_name('iphone-colors.json')).read_text())

def iphone_colors(name):
    for model in sorted(PALETTES, key=len, reverse=True):
        if re.search(r'\b' + re.escape(model) + r'(?=$|[^a-z0-9])', name, re.I):
            return PALETTES[model]
    return []
