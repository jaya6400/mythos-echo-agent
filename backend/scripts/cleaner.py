import re
import unicodedata
from typing import Any, Dict, List, Union

def normalize_unicode(text: str) -> str:
    """
    Normalizes text to Unicode NFC (Normalization Form Canonical Composition)
    to standardise diacritics and multilingual character representations.
    """
    if not isinstance(text, str):
        return ""
    return unicodedata.normalize("NFC", text)

def clean_string(text: str) -> str:
    """
    Cleans a raw string by:
    - Normalizing Unicode.
    - Stripping HTML/Markdown tags.
    - Standardizing whitespace.
    - Stripping trailing/leading space.
    """
    if not text:
        return ""
    
    # Normalize unicode diacritics and letters
    cleaned = normalize_unicode(text)
    
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]*>", "", cleaned)
    
    # Standardize whitespace (replace tabs, multiple spaces, newlines with single space where appropriate)
    # If it is a description, preserve single newlines but remove multiple consecutive newlines or leading/trailing ones.
    cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
    
    return cleaned.strip()

def clean_attributes(attributes: Union[str, List[Any], None]) -> List[str]:
    """
    Converts and cleans attributes/powers/domains into a list of clean, unique strings.
    Handles:
    - Lists of strings.
    - Comma-separated strings.
    - JSON-like strings.
    """
    if not attributes:
        return []
    
    raw_list = []
    if isinstance(attributes, str):
        # Handle string serialization representation of list/json if present
        if attributes.startswith("[") and attributes.endswith("]"):
            # Strip brackets and split by comma or quotes
            content = attributes[1:-1]
            # Simple quote/comma split
            raw_list = [item.strip("'\" ") for item in content.split(",") if item.strip()]
        else:
            # Comma-separated string
            raw_list = [item.strip() for item in attributes.split(",") if item.strip()]
    elif isinstance(attributes, list):
        raw_list = [str(item) for item in attributes]
    else:
        raw_list = [str(attributes)]
        
    cleaned_set = set()
    for item in raw_list:
        cleaned_item = clean_string(item).lower()
        if cleaned_item:
            cleaned_set.add(cleaned_item)
            
    return sorted(list(cleaned_set))

def clean_translations(translations: Any) -> Dict[str, Dict[str, str]]:
    """
    Cleans translation structures. Expects maps of language codes:
    e.g., {
        "hi": {"name": "शिव", "description": "..."},
        "en": {"name": "Shiva", "description": "..."}
    }
    or {
        "hi": "शिव"  # Flat string translations
    }
    Returns a structured dictionary: {lang_code: {field: cleaned_value}}
    """
    cleaned_tx: Dict[str, Dict[str, str]] = {}
    if not isinstance(translations, dict):
        return cleaned_tx
        
    for lang, val in translations.items():
        lang_code = clean_string(lang).lower()
        if not lang_code:
            continue
            
        if isinstance(val, dict):
            cleaned_tx[lang_code] = {}
            for field, text in val.items():
                if isinstance(text, str):
                    cleaned_tx[lang_code][clean_string(field).lower()] = clean_string(text)
        elif isinstance(val, str):
            # If flat string, assume it's translating the character name by default
            cleaned_tx[lang_code] = {"name": clean_string(val)}
            
    return cleaned_tx

def normalize_character(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a character schema by standardizing field keys and cleaning contents.
    Mapped standard fields:
    - name
    - pantheon
    - attributes
    - description
    - translations
    - metadata
    """
    normalized: Dict[str, Any] = {
        "name": "",
        "pantheon": "Unknown",
        "attributes": [],
        "description": "",
        "translations": {},
        "metadata": {}
    }
    
    if not isinstance(raw_data, dict):
        return normalized

    # Extract field name mappings case-insensitively/flexibly
    for key, val in raw_data.items():
        k_lower = key.lower().replace("_", "").replace("-", "")
        
        if k_lower in ("name", "deityname", "charactername", "title"):
            normalized["name"] = clean_string(str(val))
        elif k_lower in ("pantheon", "pantheongroup", "group", "culture", "origin"):
            normalized["pantheon"] = clean_string(str(val))
        elif k_lower in ("attributes", "tags", "powers", "domains", "roles"):
            normalized["attributes"] = clean_attributes(val)
        elif k_lower in ("description", "desc", "bio", "history", "mythology"):
            normalized["description"] = clean_string(str(val))
        elif k_lower in ("translations", "multilingual", "langs", "languages"):
            normalized["translations"] = clean_translations(val)
        elif k_lower in ("metadata", "extra", "creatorassets", "assets"):
            if isinstance(val, dict):
                normalized["metadata"] = {clean_string(mk): clean_string(str(mv)) if isinstance(mv, str) else mv for mk, mv in val.items()}
            else:
                normalized["metadata"] = {"raw": val}
                
    # Fallback/default handling
    if not normalized["name"]:
        normalized["name"] = "Unnamed Deity"
        
    return normalized
