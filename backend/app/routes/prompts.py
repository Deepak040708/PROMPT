import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from ..schemas import (
    PromptGenerateRequest,
    PromptRegenerateRequest,
    PromptUpdateRequest,
    PromptSaveToggleRequest,
    PromptResponse,
    HistoryResponse
)
from ..database import (
    insert_prompt,
    get_prompt_by_id,
    list_prompts,
    count_prompts,
    update_prompt_text,
    toggle_save_prompt,
    delete_prompt
)
from ..services.ai_service import generate_prompt as ai_generate, regenerate_prompt as ai_regenerate

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

def format_row(row: dict) -> PromptResponse:
    return PromptResponse(
        id=row["id"],
        original_idea=row["original_idea"],
        generated_prompt=row["generated_prompt"],
        purpose=row.get("purpose"),
        context=row.get("context"),
        output_format=row.get("output_format"),
        constraints=row.get("constraints"),
        language_detected=row.get("language_detected"),
        clarification_question=row.get("clarification_question"),
        is_saved=bool(row.get("is_saved", 0)),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.post("/generate", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def generate(req: PromptGenerateRequest):
    idea = req.idea.strip()
    if not idea:
        raise HTTPException(status_code=400, detail="Idea cannot be empty.")

    # Call AI service with optional generation controls
    ai_result = await ai_generate(
        idea=idea,
        purpose=req.purpose,
        context=req.context,
        output_format=req.output_format,
        constraints=req.constraints
    )

    # Persist in SQLite
    new_id = str(uuid.uuid4())
    row = insert_prompt(
        prompt_id=new_id,
        original_idea=idea,
        generated_prompt=ai_result["generated_prompt"],
        purpose=req.purpose.strip() if req.purpose else None,
        context=req.context.strip() if req.context else None,
        output_format=req.output_format.strip() if req.output_format else None,
        constraints=req.constraints.strip() if req.constraints else None,
        language_detected=ai_result.get("language_detected"),
        clarification_question=ai_result.get("clarification_question"),
        is_saved=False
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to persist generated prompt.")

    return format_row(row)

@router.post("/regenerate", response_model=PromptResponse)
async def regenerate(req: PromptRegenerateRequest):
    original_idea = req.original_idea
    existing_row = None
    purpose = req.purpose
    context = req.context
    output_format = req.output_format
    constraints = req.constraints

    if req.id:
        existing_row = get_prompt_by_id(req.id)
        if not existing_row:
            raise HTTPException(status_code=404, detail="Original prompt not found.")
        if not original_idea:
            original_idea = existing_row["original_idea"]
        if purpose is None:
            purpose = existing_row.get("purpose")
        if context is None:
            context = existing_row.get("context")
        if output_format is None:
            output_format = existing_row.get("output_format")
        if constraints is None:
            constraints = existing_row.get("constraints")

    if not original_idea or not original_idea.strip():
        raise HTTPException(status_code=400, detail="Original idea is required to regenerate.")

    ai_result = await ai_regenerate(
        idea=original_idea.strip(),
        instruction=req.instruction,
        purpose=purpose,
        context=context,
        output_format=output_format,
        constraints=constraints
    )

    # If an existing prompt ID was provided, we update it and preserve saved status
    if req.id and existing_row:
        updated = update_prompt_text(req.id, ai_result["generated_prompt"])
        return format_row(updated)
    else:
        # Otherwise create a new record
        new_id = str(uuid.uuid4())
        row = insert_prompt(
            prompt_id=new_id,
            original_idea=original_idea.strip(),
            generated_prompt=ai_result["generated_prompt"],
            purpose=purpose.strip() if purpose else None,
            context=context.strip() if context else None,
            output_format=output_format.strip() if output_format else None,
            constraints=constraints.strip() if constraints else None,
            language_detected=ai_result.get("language_detected"),
            clarification_question=ai_result.get("clarification_question"),
            is_saved=False
        )
        return format_row(row)

@router.get("/history", response_model=HistoryResponse)
async def get_history(
    search: Optional[str] = Query(None, description="Search term for idea, prompt, purpose, or context"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    rows = list_prompts(search=search, saved_only=False, limit=limit, offset=offset)
    total = count_prompts(search=search, saved_only=False)
    return HistoryResponse(
        prompts=[format_row(r) for r in rows],
        total=total
    )

@router.get("/saved", response_model=HistoryResponse)
async def get_saved(
    search: Optional[str] = Query(None, description="Search term within saved prompts"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    rows = list_prompts(search=search, saved_only=True, limit=limit, offset=offset)
    total = count_prompts(search=search, saved_only=True)
    return HistoryResponse(
        prompts=[format_row(r) for r in rows],
        total=total
    )

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str):
    row = get_prompt_by_id(prompt_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return format_row(row)

@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(prompt_id: str, req: PromptUpdateRequest):
    new_text = req.generated_prompt.strip()
    if not new_text:
        raise HTTPException(status_code=400, detail="Prompt content cannot be empty.")
    
    updated = update_prompt_text(prompt_id, new_text)
    if not updated:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return format_row(updated)

@router.patch("/{prompt_id}/save", response_model=PromptResponse)
async def save_toggle(prompt_id: str, req: Optional[PromptSaveToggleRequest] = None):
    explicit_save = req.is_saved if req else None
    updated = toggle_save_prompt(prompt_id, explicit_save)
    if not updated:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return format_row(updated)

@router.delete("/{prompt_id}", status_code=status.HTTP_200_OK)
async def delete(prompt_id: str):
    success = delete_prompt(prompt_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return {"status": "success", "message": f"Prompt {prompt_id} deleted successfully."}
