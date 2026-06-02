import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel
from services.elastic_mcp import query_elastic_mcp_context
 
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

class ContentPlanOutput(BaseModel):
    thought_process_step: str
    script_segments: list[str]
    seo_metadata_tags: list[str]
    entity_names: list[str] = []  # Extract entity names from context for backend translation lookup

async def run_orchestration_pipeline(payload_dict: dict) -> dict:
    try:
        # Handle keys from both the frontend UI and potential Agent Studio calls
        user_query = payload_dict.get("user_prompt", payload_dict.get("query", ""))
        lang_target = payload_dict.get("language", payload_dict.get("lang", "en"))
        platform_target = payload_dict.get("creator_platform", payload_dict.get("platform", "YouTube"))
        
        # 1. Gather historical folklore context (Falls back safely if index is missing)
        logger.info(f"Starting orchestration pipeline for: '{user_query}' [Target Lang: {lang_target}]")
        context_documents = await query_elastic_mcp_context(query=user_query, lang=lang_target)
        
        # 2. Fire unified client worker 
        client = genai.Client()

        language_names = {
            "en": "English",
            "hi": "Hindi in Devanagari script",
            "ta": "Tamil script",
        }
        language_instruction = language_names.get(str(lang_target).lower(), str(lang_target))
        exclusivity_instruction = ""
        if str(lang_target).lower() in {"hi", "ta"}:
            exclusivity_instruction = " Do not include English source rows, English labels, or bilingual output unless the user explicitly asks for comparison."
        
        system_instruction = (
            f"You are an expert cultural content strategist dashboard. "
            f"Use the provided folklore context data to plan script assets in {language_instruction}. "
            f"IMPORTANT: The fields 'thought_process_step' and 'script_segments' MUST be written in {language_instruction}.{exclusivity_instruction}\n"
            f"ALSO: Extract any entity names (deity/character names) from the retrieved context and list them in the 'entity_names' field for backend translation lookup."
        )
        
        user_content = (
            f"Platform Target: {platform_target}\n"
            f"Prompt Query: {user_query}\n\n"
            f"Retrieved Elastic Context:\n{json.dumps(context_documents, ensure_ascii=False)}"
        )
        
        logger.info(f"Invoking Gemini model (3.5-flash) for {platform_target} synthesis...")
        # Switched to the modern gemini-3.5-flash model to bypass the 429 quota exhaustion block
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=ContentPlanOutput,
            ),
        )
        
        logger.info("Successfully received synthesis from Gemini.")
        return json.loads(response.text)
        
    except Exception as e:
        logger.error(f"Orchestration pipeline failed: {str(e)}")
        return {
            "thought_process_step": f"Pipeline exception details: {str(e)}",
            "script_segments": [],
            "seo_metadata_tags": ["error"]
        }
