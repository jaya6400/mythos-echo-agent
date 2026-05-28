from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.gemini_agent import run_orchestration_pipeline

router = APIRouter()

class CreatorPayload(BaseModel):
    user_prompt: str = Field(..., min_length=5)
    language: str = "en"
    creator_platform: str = "YouTube"

@router.post("/orchestrate")
async def orchestrate_content(payload: CreatorPayload):
    try:
        # Map payload to the expected dictionary format for the pipeline
        pipeline_input = {
            "query": payload.user_prompt,
            "lang": payload.language,
            "platform": payload.creator_platform
        }
        
        result = await run_orchestration_pipeline(pipeline_input)
        
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred during orchestration: {str(e)}"
        )
