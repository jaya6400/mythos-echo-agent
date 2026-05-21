import unittest
import sys
import os

# Add the directory containing cleaner and parser to path to allow direct imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cleaner
import parser

class TestCleanerAndParser(unittest.TestCase):

    def test_normalize_unicode(self):
        # Combining character for 'i' with diacritic vs precomposed diacritic
        raw_char = "o\u0308" # o with umlaut (decomposed)
        normalized = cleaner.normalize_unicode(raw_char)
        self.assertEqual(normalized, "\u00f6") # ö (canonical composition NFC)
        
        # Devanagari text check
        devanagari = "शिव" # Shiva in Devanagari
        self.assertEqual(cleaner.normalize_unicode(devanagari), devanagari)

    def test_clean_string(self):
        # Strips tags
        self.assertEqual(cleaner.clean_string("<p>Deity Description</p>"), "Deity Description")
        # Cleans extra whitespace
        self.assertEqual(cleaner.clean_string("  Shiva   Vishnu  \n  Brahma "), "Shiva Vishnu \n Brahma")
        # Handles empty strings
        self.assertEqual(cleaner.clean_string(""), "")
        self.assertEqual(cleaner.clean_string(None), "")

    def test_clean_attributes(self):
        # Parsing comma-separated string
        attrs_str = "destruction, asceticism, yoga, Yoga"
        cleaned_str = cleaner.clean_attributes(attrs_str)
        self.assertEqual(cleaned_str, ["asceticism", "destruction", "yoga"])
        
        # Parsing list of mixed items
        attrs_list = ["Creation", "wisdom", "creation"]
        cleaned_list = cleaner.clean_attributes(attrs_list)
        self.assertEqual(cleaned_list, ["creation", "wisdom"])

    def test_clean_translations(self):
        # Basic translations dictionary
        raw_tx = {
            "hi": {"name": "शिव", "description": "<p>Destroyer</p>"},
            "ta": "சிவன்"
        }
        cleaned_tx = cleaner.clean_translations(raw_tx)
        
        self.assertIn("hi", cleaned_tx)
        self.assertEqual(cleaned_tx["hi"]["name"], "शिव")
        self.assertEqual(cleaned_tx["hi"]["description"], "Destroyer")
        
        self.assertIn("ta", cleaned_tx)
        self.assertEqual(cleaned_tx["ta"]["name"], "சிவன்")

    def test_normalize_character(self):
        raw_data = {
            "DeityName": "Brahma",
            "pantheon_group": "Hindu",
            "powers": "creation, wisdom",
            "desc": "The creator god."
        }
        normalized = cleaner.normalize_character(raw_data)
        
        self.assertEqual(normalized["name"], "Brahma")
        self.assertEqual(normalized["pantheon"], "Hindu")
        self.assertEqual(normalized["attributes"], ["creation", "wisdom"])
        self.assertEqual(normalized["description"], "The creator god.")

    def test_php_seeder_parsing(self):
        # Mock Laravel seeder chunk
        php_code = """
        [
            'name' => 'Shiva',
            'pantheon' => 'Hindu',
            'attributes' => 'destruction, asceticism, yoga',
            'description' => '<p>The transformer</p>',
            'translations' => [
                'hi' => 'शिव',
                'ta' => 'சிவன்'
            ]
        ]
        """
        records = parser.parse_php_array_file(php_code)
        self.assertEqual(len(records), 1)
        
        record = records[0]
        self.assertEqual(record["name"], "Shiva")
        self.assertEqual(record["pantheon"], "Hindu")
        self.assertEqual(record["attributes"], "destruction, asceticism, yoga")
        self.assertEqual(record["translations"], {"hi": "शिव", "ta": "சிவன்"})
        
        # Test elastic payload generation
        cleaned = cleaner.normalize_character(record)
        payload = parser.prepare_elastic_payload(cleaned)
        
        self.assertEqual(payload["id"], "mythos_hindu_shiva")
        self.assertEqual(payload["name"], "Shiva")
        self.assertEqual(payload["attributes"], ["asceticism", "destruction", "yoga"])
        self.assertIn("Name: Shiva", payload["vector_text"])
        self.assertIn("Name (hi): शिव", payload["vector_text"])

if __name__ == "__main__":
    unittest.main()
