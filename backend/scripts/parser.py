import os
import sys
import json
import re
from typing import Any, Dict, List, Tuple
from cleaner import normalize_character

def split_respecting_bounds(s: str) -> List[str]:
    """
    Splits a string by commas at the top level, ignoring commas that reside
    inside nested brackets [ ] or quotes ' ' / " ".
    """
    parts = []
    current = []
    in_single_quote = False
    in_double_quote = False
    bracket_depth = 0
    escape = False
    
    for char in s:
        if escape:
            current.append(char)
            escape = False
            continue
            
        if char == '\\':
            current.append(char)
            escape = True
            continue
            
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            current.append(char)
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            current.append(char)
        elif char == '[' and not in_single_quote and not in_double_quote:
            bracket_depth += 1
            current.append(char)
        elif char == ']' and not in_single_quote and not in_double_quote:
            bracket_depth -= 1
            current.append(char)
        elif char == ',' and not in_single_quote and not in_double_quote and bracket_depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)
            
    if current:
        parts.append("".join(current).strip())
    return [p for p in parts if p]

def split_key_value(part: str) -> Tuple[str, str]:
    """
    Splits a PHP 'key => value' string on the first '=>' operator.
    """
    idx = part.find('=>')
    if idx == -1:
        return "", part
    key = part[:idx].strip().strip("'\" ")
    val = part[idx+2:].strip()
    return key, val

def parse_php_val(val: str) -> Any:
    """
    Parses a string representing a PHP value (string, array, list, number)
    into its equivalent Python representation.
    """
    val = val.strip()
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1]
    if val.startswith('"') and val.endswith('"'):
        return val[1:-1]
    if val.startswith('[') and val.endswith(']'):
        inner = val[1:-1].strip()
        if not inner:
            return []
        elements = split_respecting_bounds(inner)
        if any('=>' in el for el in elements):
            parsed_dict = {}
            for el in elements:
                k, v = split_key_value(el)
                if k:
                    parsed_dict[k] = parse_php_val(v)
            return parsed_dict
        else:
            return [parse_php_val(el) for el in elements]
            
    if val.isdigit():
        return int(val)
    try:
        return float(val)
    except ValueError:
        pass
        
    return val

def find_php_records(content: str) -> List[str]:
    """
    Scans a PHP seeder file using a stack-based bracket parser, locating all
    leaf array structures that contain deity character declarations (identified by 'name =>').
    """
    records = []
    stack = []
    in_single_quote = False
    in_double_quote = False
    escape = False
    
    # Pre-clean comments to avoid parsing issues inside them
    content = re.sub(r'//.*?\n', '\n', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    for i, char in enumerate(content):
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            continue
        if char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            continue
            
        if not in_single_quote and not in_double_quote:
            if char == '[':
                stack.append(i)
            elif char == ']':
                if stack:
                    start_idx = stack.pop()
                    block_content = content[start_idx:i+1]
                    # We check for name key indicators case-insensitively
                    if "'name'" in block_content or '"name"' in block_content or "'name' =>" in block_content:
                        records.append((start_idx, i+1, block_content))
                        
    # Keep only leaf records (i.e. records that contain name, but have no other name-containing records inside)
    leaf_records = []
    for start, end, block in records:
        is_leaf = True
        for o_start, o_end, o_block in records:
            if o_start > start and o_end < end:
                is_leaf = False
                break
        if is_leaf:
            leaf_records.append(block)
            
    return leaf_records

def parse_php_array_file(content: str) -> List[Dict[str, Any]]:
    """
    Extracts and parses PHP seeder style array items from a file string.
    """
    raw_blocks = find_php_records(content)
    records: List[Dict[str, Any]] = []
    
    for block in raw_blocks:
        # Strip outer [ and ]
        inner = block.strip()
        if inner.startswith('[') and inner.endswith(']'):
            inner = inner[1:-1].strip()
            
        parts = split_respecting_bounds(inner)
        record = {}
        for part in parts:
            k, v = split_key_value(part)
            if k:
                record[k] = parse_php_val(v)
        if record:
            records.append(record)
            
    return records

def build_vector_text(char_data: Dict[str, Any]) -> str:
    """
    Constructs a unified, rich vector text representation for Elastic Vector Indexing.
    Includes deity details and translations to make it searchable across representations.
    """
    parts = []
    if char_data.get("name"):
        parts.append(f"Name: {char_data['name']}")
    if char_data.get("pantheon"):
        parts.append(f"Pantheon: {char_data['pantheon']}")
    if char_data.get("attributes"):
        attrs_str = ", ".join(char_data["attributes"])
        parts.append(f"Attributes: {attrs_str}")
    if char_data.get("description"):
        parts.append(f"Description: {char_data['description']}")
        
    # Append translations to help cross-lingual alignment/retrieval
    translations = char_data.get("translations", {})
    for lang, val in translations.items():
        lang_parts = []
        if isinstance(val, dict):
            t_name = val.get("name")
            t_desc = val.get("description")
            if t_name:
                lang_parts.append(f"Name ({lang}): {t_name}")
            if t_desc:
                lang_parts.append(f"Description ({lang}): {t_desc}")
        elif isinstance(val, str):
            lang_parts.append(f"Name ({lang}): {val}")
            
        if lang_parts:
            parts.append(" | ".join(lang_parts))
            
    return " | ".join(parts)

def prepare_elastic_payload(cleaned_char: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms normalized character data into a document ready for Elastic Search/Vector Indexing.
    Creates a unique ID, builds the vector text, and structures metadata.
    """
    name_slug = re.sub(r'[^a-z0-9]', '_', cleaned_char["name"].lower())
    pantheon_slug = re.sub(r'[^a-z0-9]', '_', cleaned_char["pantheon"].lower())
    doc_id = f"mythos_{pantheon_slug}_{name_slug}"
    
    vector_text = build_vector_text(cleaned_char)
    
    payload = {
        "id": doc_id,
        "name": cleaned_char["name"],
        "pantheon": cleaned_char["pantheon"],
        "attributes": cleaned_char["attributes"],
        "description": cleaned_char["description"],
        "translations": cleaned_char["translations"],
        "vector_text": vector_text,
        "metadata": cleaned_char["metadata"]
    }
    return payload

def parse_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Reads a file, auto-detects its type (JSON or PHP seeder), parses records,
    cleans them, and prepares the final Elastic payload.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        
    raw_records: List[Dict[str, Any]] = []
    
    if content.startswith("{") or content.startswith("["):
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                raw_records = parsed
            elif isinstance(parsed, dict):
                for key in ["deities", "characters", "records", "data"]:
                    if key in parsed and isinstance(parsed[key], list):
                        raw_records = parsed[key]
                        break
                else:
                    raw_records = [parsed]
        except json.JSONDecodeError:
            raw_records = parse_php_array_file(content)
    else:
        raw_records = parse_php_array_file(content)
        
    processed_payloads = []
    for raw in raw_records:
        cleaned = normalize_character(raw)
        payload = prepare_elastic_payload(cleaned)
        processed_payloads.append(payload)
        
    return processed_payloads

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python parser.py <input_file_path> <output_file_path>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        results = parse_file(input_path)
        with open(output_path, "w", encoding="utf-8") as out_f:
            json.dump(results, out_f, indent=2, ensure_ascii=False)
        print(f"Success! Parsed {len(results)} records from {input_path} and saved to {output_path}")
    except Exception as e:
        print(f"Error parsing file: {e}")
        sys.exit(1)
