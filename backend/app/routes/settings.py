import time
from fastapi import APIRouter, HTTPException
from ..config import settings
from ..schemas import SettingsResponse, SettingsUpdateRequest
from ..services.ai_service import generate_prompt

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
async def get_settings():
    return SettingsResponse(
        configured=settings.is_configured,
        model=settings.ai_model,
        has_api_key=bool(settings.ai_api_key),
        masked_api_key=settings.masked_api_key,
        base_url=settings.ai_base_url
    )

@router.post("", response_model=SettingsResponse)
async def update_settings(req: SettingsUpdateRequest):
    if req.api_key is not None:
        settings.update_runtime(api_key=req.api_key)
    if req.model is not None:
        settings.update_runtime(model=req.model)

    return SettingsResponse(
        configured=settings.is_configured,
        model=settings.ai_model,
        has_api_key=bool(settings.ai_api_key),
        masked_api_key=settings.masked_api_key,
        base_url=settings.ai_base_url
    )

@router.post("/test")
async def test_connection():
    if not settings.is_configured:
        raise HTTPException(
            status_code=400,
            detail="AI API Key is not configured. Please supply a valid Gemini API key."
        )

    start_time = time.time()
    try:
        result = await generate_prompt("Build a simple portfolio website")
        latency_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "connected",
            "model": settings.ai_model,
            "latency_ms": latency_ms,
            "sample_prompt_preview": result["generated_prompt"][:100] + "..."
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")
