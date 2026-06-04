from fastapi import APIRouter, HTTPException, Request, Response
import httpx
import json
import os
from pydantic import BaseModel, Field
from typing import Any, Optional
from services.gemini_agent import run_orchestration_pipeline
from services.elastic_mcp import query_elastic_mcp_context, es_client
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

class CreatorPayload(BaseModel):
    user_prompt: str = Field(..., min_length=5)
    language: str = "en"
    creator_platform: str = "YouTube"

class CreatorAssetRequest(BaseModel):
    entity_name: str = Field(..., min_length=1)
    target_language: str = "en"
    creator_platform: str = "YouTube"

@router.post("/orchestrate")
async def orchestrate_content(payload: CreatorPayload):
    try:
        pipeline_input = {
            "user_prompt": payload.user_prompt,
            "language": payload.language,
            "creator_platform": payload.creator_platform,
        }

        result = await run_orchestration_pipeline(pipeline_input)

        return {
            "status": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during orchestration: {str(e)}",
        )

ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")
ELASTIC_MCP_URL = os.getenv("ELASTIC_MCP_URL")


LANGUAGE_ALIASES = {
    "en": ("en", "english"),
    "hi": ("hi", "hindi"),
    "ta": ("ta", "tamil"),
}

LANGUAGE_SCRIPT_RANGES = {
    "hi": ("\u0900", "\u097F"),
    "ta": ("\u0B80", "\u0BFF"),
}


def safe_json_parse(value: str) -> Any | None:
    try:
        return json.loads(value)
    except Exception:
        return None


def normalize_language(language: Any) -> str | None:
    if not isinstance(language, str):
        return None
    return language.strip().lower()


def matches_language(language: Any, target_language: str) -> bool:
    normalized = normalize_language(language)
    if not normalized:
        return False

    target = normalize_language(target_language) or "en"
    aliases = set(LANGUAGE_ALIASES.get(target, (target,)))
    return normalized in aliases


def contains_language_script(text: str, target_language: str) -> bool:
    script_range = LANGUAGE_SCRIPT_RANGES.get(normalize_language(target_language) or "en")
    if not script_range:
        return not any(contains_language_script(text, lang) for lang in LANGUAGE_SCRIPT_RANGES)

    start, end = script_range
    return any(start <= char <= end for char in text)


def filter_text_for_language(text: str, target_language: str) -> str:
    target = normalize_language(target_language) or "en"
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return text.strip() if contains_language_script(text, target) else ""

    if target in LANGUAGE_SCRIPT_RANGES:
        matching_lines = [line for line in lines if contains_language_script(line, target)]
        return "\n".join(matching_lines)

    english_lines = [line for line in lines if contains_language_script(line, "en")]
    return "\n".join(english_lines)


def find_translation_payload(translations: Any, target_language: str) -> Any | None:
    if not translations:
        return None

    target = normalize_language(target_language) or "en"
    aliases = set(LANGUAGE_ALIASES.get(target, (target,)))

    if isinstance(translations, dict):
        for alias in aliases:
            if alias in translations:
                return translations[alias]

        if "translations" in translations and isinstance(translations["translations"], dict):
            return find_translation_payload(translations["translations"], target_language)

        for key, value in translations.items():
            if normalize_language(key) in aliases:
                return value

        return translations

    if isinstance(translations, list):
        for item in translations:
            if isinstance(item, dict):
                if matches_language(item.get("language"), target_language) or matches_language(item.get("lang"), target_language) or matches_language(item.get("locale"), target_language):
                    return item.get("text") or item.get("content") or item.get("description") or item
        return translations[0] if translations else None

    return translations


def format_translated_record(payload: dict[str, Any], target_language: str) -> list[str]:
    name = payload.get("name") or payload.get("title")
    description = payload.get("description") or payload.get("text") or payload.get("content")
    pantheon = payload.get("pantheon")
    attributes = payload.get("attributes") or payload.get("traits")

    if isinstance(attributes, list):
        attributes = ", ".join(str(attribute) for attribute in attributes if attribute)

    pieces = []
    if name:
        pieces.append(f"Name: {name}")
    if pantheon:
        pieces.append(f"Pantheon: {pantheon}")
    if attributes:
        pieces.append(f"Attributes: {attributes}")
    if description:
        pieces.append(f"Description: {description}")

    rendered = " | ".join(pieces)
    if rendered and contains_language_script(rendered, target_language):
        return [rendered]
    return []


def extract_mcp_segments(payload: Any, target_language: str = "en") -> list[str]:
    if payload is None:
        return []

    if isinstance(payload, str):
        parsed = safe_json_parse(payload)
        if parsed is not None:
            return extract_mcp_segments(parsed, target_language)
        filtered_text = filter_text_for_language(payload, target_language)
        return [filtered_text] if filtered_text else []

    if isinstance(payload, list):
        language_specific_items = [item for item in payload if isinstance(item, dict) and (matches_language(item.get("language"), target_language) or matches_language(item.get("lang"), target_language) or matches_language(item.get("locale"), target_language))]
        items_to_process = language_specific_items if language_specific_items else payload
        return [segment for item in items_to_process for segment in extract_mcp_segments(item, target_language)]

    if isinstance(payload, dict):
        translation_payload = find_translation_payload(payload.get("translations") or payload.get("translation") or payload.get("translated") or payload.get("translated_text"), target_language)
        if translation_payload is not None:
            return extract_mcp_segments(translation_payload, target_language)

        if payload.get("type") == "text" and isinstance(payload.get("text"), str):
            parsed = safe_json_parse(payload["text"])
            if parsed is not None:
                return extract_mcp_segments(parsed, target_language)
            filtered_text = filter_text_for_language(payload["text"], target_language)
            return [filtered_text] if filtered_text else []

        if payload.get("text"):
            parsed = safe_json_parse(payload["text"])
            if parsed is not None:
                return extract_mcp_segments(parsed, target_language)
            filtered_text = filter_text_for_language(str(payload["text"]), target_language)
            return [filtered_text] if filtered_text else []

        for key in ["content", "result", "data", "results", "resources", "snippets", "payload", "items", "_source"]:
            if payload.get(key) is not None:
                return extract_mcp_segments(payload.get(key), target_language)

        if payload.get("name") or payload.get("description"):
            translated_record = format_translated_record(payload, target_language)
            if translated_record:
                return translated_record
            return []

        text_pieces = [f"{k}: {v}" for k, v in payload.items() if isinstance(v, (str, int, float))]
        filtered_text = filter_text_for_language(" | ".join(text_pieces), target_language)
        return [filtered_text] if filtered_text else []

    return [str(payload)]


@router.post("/mcp-bridge")
async def mcp_bridge(request: Request):
    if not ELASTIC_API_KEY:
        raise HTTPException(status_code=500, detail="ELASTIC_API_KEY environment variable is missing.")

    try:
        body = await request.json()
        language = "en"
        if isinstance(body, dict):
            language = body.get("language", body.get("lang", "en")) or "en"

        is_simple_ui_request = isinstance(body, dict) and "jsonrpc" not in body
        if is_simple_ui_request:
            user_prompt = body.get("user_prompt", "")
            body = {
                "jsonrpc": "2.0",
                "id": "frontend-simulation-id",
                "method": "tools/call",
                "params": {
                    "name": "mythology_folklore_search",
                    "arguments": {
                        "nlQuery": user_prompt,
                        "language": language,
                    },
                },
            }

        headers = {
            "Authorization": f"ApiKey {ELASTIC_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "bypass-tunnel-reminder": "true",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(ELASTIC_MCP_URL, json=body, headers=headers, timeout=30.0)
            content_type = response.headers.get("content-type", "")

            if "application/json" in content_type and response.content:
                response_json = response.json()

                if isinstance(response_json, dict) and response_json.get("jsonrpc") == "2.0":
                    if is_simple_ui_request:
                        canonical_payload = response_json.get("result", response_json)
                        segments = extract_mcp_segments(canonical_payload, language)
                        if segments:
                            return JSONResponse(
                                status_code=response.status_code,
                                content={
                                    "script_segments": segments,
                                    "seo_metadata_tags": [],
                                    "raw_result": canonical_payload,
                                },
                            )
                        return JSONResponse(status_code=response.status_code, content=canonical_payload)

                    return JSONResponse(status_code=response.status_code, content=response_json)

                canonical_payload = response_json
                segments = extract_mcp_segments(canonical_payload, language)
                if segments:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={
                            "script_segments": segments,
                            "seo_metadata_tags": [],
                            "raw_result": canonical_payload,
                        },
                    )

                return JSONResponse(status_code=response.status_code, content=canonical_payload)

            return Response(content=response.content, status_code=response.status_code, media_type=content_type)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Bridge forwarding failed: {str(e)}"})


@router.post("/creator-asset")
async def get_creator_asset(payload: CreatorAssetRequest):
    """
    Fetch creator asset with multilingual translations from Elasticsearch index.
    Uses query_elastic_mcp_context() to fetch real translations from translations.hi and translations.ta.
    Generates creator hooks and narratives based on fetched translations.
    """
    try:
        entity_name = payload.entity_name.strip()
        target_language = normalize_language(payload.target_language) or "en"
        
        logger.info(f"Fetching creator asset for: {entity_name} (lang={target_language})")
        
        # Query Elasticsearch using elastic MCP context function to get real translations
        elastic_results = await query_elastic_mcp_context(query=entity_name, lang=target_language)
        
        if not elastic_results:
            logger.warning(f"No entity found for: {entity_name}")
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found")
        
        # Use the first result as the primary source
        source = elastic_results[0]
        
        # Extract base English fields
        name = source.get("name", "")
        description = source.get("description", "")
        pantheon = source.get("pantheon", "")
        attributes = source.get("attributes", [])
        source_snippet = source.get("normalized_content", source.get("context_source", ""))
        
        # Extract translated fields based on target language
        if target_language == "hi":
            # Get Hindi translations from the nested structure
            translations_hi = source.get("translations", {}).get("hi", {})
            name = translations_hi.get("name", name)
            description = translations_hi.get("description", description)
            # Map pantheon to Hindi if available, otherwise use source value
            pantheon_hi_map = {
                "hindu": "हिंदू पौराणिक कथा",
                "greek": "यूनानी पौराणिक कथा",
                "egyptian": "मिस्र पौराणिक कथा",
                "norse": "नॉर्स पौराणिक कथा",
            }
            pantheon = pantheon_hi_map.get(pantheon.lower(), pantheon)
            
        elif target_language == "ta":
            # Get Tamil translations from the nested structure
            translations_ta = source.get("translations", {}).get("ta", {})
            name = translations_ta.get("name", name)
            description = translations_ta.get("description", description)
            # Map pantheon to Tamil if available, otherwise use source value
            pantheon_ta_map = {
                "hindu": "இந்து புராணக்கதை",
                "greek": "கிரேக்க புராணக்கதை",
                "egyptian": "எகிப்திய புராணக்கதை",
                "norse": "நோர்ஸ் புராணக்கதை",
            }
            pantheon = pantheon_ta_map.get(pantheon.lower(), pantheon)
        
        # Generate creator asset using real translations from Elasticsearch
        creator_asset = generate_creator_asset(
            name=name,
            pantheon=pantheon,
            attributes=attributes if isinstance(attributes, list) else [],
            description=description,
            source_snippet=source_snippet,
            target_language=target_language,
            platform=payload.creator_platform
        )
        
        logger.info(f"Successfully generated creator asset for: {name} (lang={target_language})")
        
        return {
            "status": "success",
            "data": creator_asset,
            "source_entity": {
                "id": source.get("_id", ""),
                "name": name,
                "pantheon": pantheon,
                "attributes": attributes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Creator asset fetch failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch creator asset: {str(e)}"
        )


def generate_creator_asset(
    name: str,
    pantheon: str,
    attributes: list,
    description: str,
    source_snippet: str,
    target_language: str = "en",
    platform: str = "YouTube"
) -> dict:
    """
    Generate creator-ready asset with hooks and narratives.
    Supports multilingual output (English, Hindi, Tamil).
    """
    
    target_lang = normalize_language(target_language) or "en"
    attr_str = ", ".join(attributes) if attributes else "legendary traits"
    
    if target_lang == "hi":
        # Hindi creator asset
        return {
            "hook": f"⚡ वायरल {platform} हुक: क्या आप जानते हैं कि {pantheon} के '{name}' {attr_str} और अद्भुत शक्तियों के लिए प्रसिद्ध हैं? ऐसी ही और पौराणिक कहानियों के लिए फॉलो करें!",
            "narrative": f"आज की कहानी '{name}' की है। {description} इस किरदार को एक तेज, रहस्यमय और सिनेमैटिक वीडियो में दिखाइए, जहां शुरुआत सवाल से हो, बीच में शक्ति का खुलासा आए, और अंत में दर्शक अगली कथा देखने के लिए रुक जाएं।",
            "metadataTags": ["पौराणिककथा", "देवकथा", name] + attributes[:3],
            "language": "Hindi",
            "sourceSnippet": source_snippet,
            "platform": platform
        }
    
    elif target_lang == "ta":
        # Tamil creator asset
        return {
            "hook": f"⚡ வைரல் {platform} கோழை: நீங்கள் தெரிவிக்கிறீர்களா {pantheon} இன் '{name}' {attr_str} மற்றும் அறுவியல் சக்திகளுக்கு பெயர்பெற்றிருக்கிறார்? இப்படிப்பட்ட மற்ற புராணக்கதைகளுக்கு பின்தொடர்க!",
            "narrative": f"இன்றைய கதை '{name}' பற்றிய. {description} இந்த பாத்திரத்தை வேகமான,신비로제, சிनிமாடிக் வीடியோக்களில் காட்டு, இங்கு ஆரம்பம் கேள்வியிலிருந்து, நடுவில் சக்தியின் வெளிப்பாடு, முடிவில் பார்வையாளர் அடுத்த கதை பார்க்க நகர்ந்துபோக வேண்டும்.",
            "metadataTags": ["புராணக்கதை", "தெய்வக்கதை", name] + attributes[:3],
            "language": "Tamil",
            "sourceSnippet": source_snippet,
            "platform": platform
        }
    
    else:
        # English creator asset (default)
        return {
            "hook": f"{name} is a {pantheon} icon with {attr_str} - built for a fast, high-impact {platform} creator hook.",
            "narrative": f"Bring {name} to life with a dynamic voiceover: from the {pantheon} heritage, through {attr_str.lower()}, into a cinematic moment. {description}",
            "metadataTags": ["mythology", "deity", name] + attributes[:3],
            "language": "English",
            "sourceSnippet": source_snippet,
            "platform": platform
        }
