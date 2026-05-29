from fastapi import APIRouter, HTTPException, Request, Response
import httpx
import os
from pydantic import BaseModel, Field
from typing import Optional
from services.gemini_agent import run_orchestration_pipeline
from fastapi.responses import JSONResponse

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

ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")
ELASTIC_MCP_URL = os.getenv("ELASTIC_MCP_URL")
@router.post("/mcp-bridge")
async def mcp_bridge(request: Request):
    """
    Acts as an unauthenticated bridge for Google Cloud Agent Studio.
    Intercepts the request and injects the secure Elastic ApiKey header behind the scenes.
    """
    if not ELASTIC_API_KEY:
        raise HTTPException(status_code=500, detail="ELASTIC_API_KEY environment variable is missing.")

    try:
        # Capture incoming payload from Agent Studio
        body = await request.json()
        
        # Inject the required secure cloud credentials
        headers = {
            "Authorization": f"ApiKey {ELASTIC_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Forward directly to Elastic Serverless on GCP
        async with httpx.AsyncClient() as client:
            response = await client.post(ELASTIC_MCP_URL, json=body, headers=headers, timeout=30.0 )
             # Check if the content is valid JSON before parsing it
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type and response.content:
                return JSONResponse(status_code=response.status_code, content=response.json())
            
            # Safe Fallback: Pass plain text or empty responses (like 202) back cleanly without breaking
            return Response(
                content=response.content, 
                status_code=response.status_code, 
                media_type=content_type
            )
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Bridge forwarding failed: {str(e)}"})