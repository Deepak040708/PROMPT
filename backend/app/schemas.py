from pydantic import BaseModel, Field
from typing import Optional, List

class PromptGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=1, max_length=10000, description="The raw user idea or description")
    purpose: Optional[str] = Field(None, max_length=1000, description="Optional purpose of the prompt")
    context: Optional[str] = Field(None, max_length=5000, description="Optional additional context or requirements")
    output_format: Optional[str] = Field(None, max_length=1000, description="Optional desired output format")
    constraints: Optional[str] = Field(None, max_length=2000, description="Optional constraints or things to avoid")

class PromptRegenerateRequest(BaseModel):
    id: Optional[str] = Field(None, description="ID of existing prompt to regenerate")
    original_idea: Optional[str] = Field(None, description="Original idea if ID is not provided")
    instruction: Optional[str] = Field(None, max_length=2000, description="Optional variation instructions")
    purpose: Optional[str] = Field(None, max_length=1000, description="Optional purpose of the prompt")
    context: Optional[str] = Field(None, max_length=5000, description="Optional additional context or requirements")
    output_format: Optional[str] = Field(None, max_length=1000, description="Optional desired output format")
    constraints: Optional[str] = Field(None, max_length=2000, description="Optional constraints or things to avoid")

class PromptUpdateRequest(BaseModel):
    generated_prompt: str = Field(..., min_length=1, max_length=50000, description="Updated prompt content")

class PromptSaveToggleRequest(BaseModel):
    is_saved: Optional[bool] = Field(None, description="Explicit target saved status (if omitted, toggles)")

class PromptResponse(BaseModel):
    id: str
    original_idea: str
    generated_prompt: str
    purpose: Optional[str] = None
    context: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    language_detected: Optional[str] = None
    clarification_question: Optional[str] = None
    is_saved: bool
    created_at: str
    updated_at: str

class HistoryResponse(BaseModel):
    prompts: List[PromptResponse]
    total: int

class SettingsResponse(BaseModel):
    configured: bool
    model: str
    has_api_key: bool
    masked_api_key: str
    base_url: str

class SettingsUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
