import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from services.elastic_mcp import query_elastic_mcp_context

class ContentPlanOutput(BaseModel):
    thought_process_step: str
    script_segments: list[str]
    seo_metadata_tags: list[str]

async def run_orchestration_pipeline(payload_dict: dict) -> dict:
    try:
        user_query = payload_dict.get("query", "")
        lang_target = payload_dict.get("lang", "en")
        platform_target = payload_dict.get("platform", "YouTube")
        
        # 1. Gather historical folklore context (Falls back safely if index is missing)
        context_documents = await query_elastic_mcp_context(query=user_query, lang=lang_target)
        
        # 2. Fire unified client worker 
        client = genai.Client()
        
        system_instruction = (
            "You are an expert cultural content strategist dashboard. "
            "Use the provided folklore context data to plan script assets."
        )
        
        user_content = (
            f"Platform Target: {platform_target}\n"
            f"Prompt Query: {user_query}\n\n"
            f"Retrieved Elastic Context:\n{json.dumps(context_documents)}"
        )
        
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
        
        return json.loads(response.text)
        
    except Exception as e:
        return {
            "thought_process_step": f"Pipeline exception details: {str(e)}",
            "script_segments": [],
            "seo_metadata_tags": ["error"]
        }
