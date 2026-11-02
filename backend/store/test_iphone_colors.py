import json
from pathlib import Path
from django.test import SimpleTestCase
from .iphone_colors import PALETTES, iphone_colors

class IPhoneColorTests(SimpleTestCase):
    def test_specific_model_takes_priority(self):
        self.assertEqual(iphone_colors('Certified Pre-Owned iPhone 16 Pro Max 256GB')[0], {'name': 'Natural Titanium', 'hex': '#C2BCB2'})
        self.assertEqual(iphone_colors('iphone 17 Pro 256GB E-sim Unlocked')[1]['hex'], '#F77E2D')
        self.assertEqual(iphone_colors('iPhone 17e 256GB')[0]['name'], 'Soft Pink')
        self.assertEqual(iphone_colors('iPhone SE (3rd generation)')[0]['hex'], '#232A31')
        self.assertEqual(iphone_colors('iPhone 19'), [])

    def test_frontend_and_backend_palettes_agree(self):
        self.assertEqual(PALETTES, json.loads((Path(__file__).resolve().parents[2] / 'app/lib/iphone-colors.json').read_text()))
        for colors in PALETTES.values():
            for color in colors:
                self.assertRegex(color['hex'], r'^#[0-9A-F]{6}$')
