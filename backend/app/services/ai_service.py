import json
import logging
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from fastapi import HTTPException
from ..config import settings

logger = logging.getLogger("promptcraft.ai")

SYSTEM_INSTRUCTION = """You are PromptCraft, an expert AI prompt engineer and software architect.
Your mission is to transform a user's rough idea, casual sentence, incomplete thought, or mixed-language description into an exceptionally clear, highly specific, well-structured, production-ready prompt that can be used directly with AI tools and coding assistants.

CORE PRINCIPLES:
1. PRESERVE ORIGINAL INTENTION: Maintain the user's primary goal, domain, explicit constraints, and target audience. Never discard their core requirement.
2. MULTI-LANGUAGE & THANGLISH UNDERSTANDING:
   - Users may enter ideas in English, Tamil, Thanglish (Tamil written in Latin/English alphabet, e.g. "enaku oru study app venum students ku useful ah irukanum"), Tanglish, Hindi, or mixed informal language.
   - Accurately interpret colloquial phrases, spelling errors, and shorthand.
   - Produce the final prompt in polished, professional English (or the language appropriate to the request).
3. CLARITY, RELEVANCE & USABILITY:
   - Emphasize clarity, specificity, relevance, and practical usability over unnecessary length.
   - Expand vague phrases into concrete, actionable functional requirements.
   - Organize logically (e.g. Core Objectives, Key Features, User Experience & Design, Edge Cases/Non-Functional Requirements).
4. NO INVENTED FICTIONS:
   - Do not hallucinate arbitrary budgets, proprietary commercial brands, or unmentioned constraints.
   - Use industry-standard sensible defaults where beneficial.
5. TEXT PROMPTS ONLY:
   - This app creates text prompts only. Never output raw code, markdown images, or media generation directives.
6. GENUINE AMBIGUITY HANDLING:
   - If the input is genuinely ambiguous (e.g. "make an app", "create something"), provide a solid foundational prompt template and include a short clarification question in `clarification_question`. Otherwise leave `clarification_question` null.
7. CLEAN OUTPUT:
   - Return clean prompt text without conversational preamble like "Sure, here is your prompt:".
"""

REGENERATE_MODIFIER = """This is a REGENERATION request for the same original idea.
Generate a fresh, distinctive alternative angle or structure (for example, emphasizing user journey, workflow ergonomics, modular component breakdown, or functional deliverables) while preserving all core requirements and constraints from the original idea. Avoid generating an identical prompt."""

FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

def build_prompt_payload(
    idea: str,
    purpose: Optional[str] = None,
    context: Optional[str] = None,
    output_format: Optional[str] = None,
    constraints: Optional[str] = None,
    is_regenerate: bool = False,
    instruction: Optional[str] = None
) -> str:
    parts = [f"Rough User Idea:\n{idea.strip()}"]
    
    if purpose and purpose.strip():
        parts.append(f"Prompt Purpose / Objective:\n{purpose.strip()}")
    if context and context.strip():
        parts.append(f"Additional Context & Requirements:\n{context.strip()}")
    if output_format and output_format.strip():
        parts.append(f"Desired Output Format:\n{output_format.strip()}")
    if constraints and constraints.strip():
        parts.append(f"Constraints / Things to Avoid:\n{constraints.strip()}")
    if is_regenerate and instruction and instruction.strip():
        parts.append(f"Regeneration Note:\n{instruction.strip()}")

    return "\n\n".join(parts)

async def call_gemini_api(payload: dict, candidate_models: List[str]) -> str:
    # Build unique deduplicated list of candidate models preserving order
    unique_models: List[str] = []
    for model in candidate_models:
        m = (model or "").strip()
        if m and m not in unique_models:
            unique_models.append(m)

    last_error = ""
    # 2 passes across models to weather transient Google high-demand micro-bursts (503 / 429)
    for pass_num in range(2):
        for model in unique_models:
            url = f"{settings.ai_base_url}/models/{model}:generateContent?key={settings.ai_api_key}"
            try:
                # 8.0s timeout per candidate ensures snappy response and rapid failover
                async with httpx.AsyncClient(timeout=8.0) as client:
                    response = await client.post(
                        url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        part = candidates[0].get("content", {}).get("parts", [{}])[0]
                        return part.get("text", "")

                # If 503 (demand spike), 429 (rate limit), or other non-200 status
                error_data = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                last_error = error_data.get("error", {}).get("message", response.text)
                logger.warning(
                    f"[Pass {pass_num+1}] Model {model} returned status {response.status_code}: {last_error[:100]}. Failing over..."
                )

                # Micro-pause on 503/429 to allow socket buffer clearing
                if response.status_code in (429, 503):
                    await asyncio.sleep(0.3)

            except httpx.TimeoutException:
                last_error = f"Model {model} timed out after 8s."
                logger.warning(f"[Pass {pass_num+1}] {last_error} Failing over to next candidate...")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"[Pass {pass_num+1}] Error calling model {model}: {last_error}. Failing over...")

        if pass_num == 0:
            # Brief backoff before second pass if all candidates faced a simultaneous micro-spike
            await asyncio.sleep(0.7)

    raise HTTPException(
        status_code=503,
        detail="AI service is momentarily experiencing high demand across providers. Please retry in a moment."
    )

async def generate_prompt(
    idea: str,
    purpose: Optional[str] = None,
    context: Optional[str] = None,
    output_format: Optional[str] = None,
    constraints: Optional[str] = None
) -> Dict[str, Any]:
    if not settings.ai_api_key:
        raise HTTPException(
            status_code=400,
            detail="AI API Key is missing. Please configure your API key in backend/.env or through the Settings page."
        )

    models = [settings.ai_model] + [m for m in FALLBACK_MODELS if m != settings.ai_model]
    user_prompt_text = build_prompt_payload(idea, purpose, context, output_format, constraints)

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"Transform this rough user idea and options into a high-grade, structured AI prompt:\n\n{user_prompt_text}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "OBJECT",
                "properties": {
                    "generated_prompt": {
                        "type": "STRING",
                        "description": "The polished, detailed, production-ready text prompt"
                    },
                    "language_detected": {
                        "type": "STRING",
                        "description": "Detected input language or mixture"
                    },
                    "clarification_question": {
                        "type": "STRING",
                        "description": "Short clarification question if input is ambiguous, otherwise leave blank or null"
                    }
                },
                "required": ["generated_prompt", "language_detected"]
            }
        }
    }

    try:
        raw_text = await call_gemini_api(payload, models)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during prompt generation")
        raise HTTPException(status_code=502, detail=f"Prompt generation error: {str(e)}")

    try:
        parsed = json.loads(raw_text)
        return {
            "generated_prompt": parsed.get("generated_prompt", "").strip(),
            "language_detected": parsed.get("language_detected", "English").strip(),
            "clarification_question": parsed.get("clarification_question") or None
        }
    except json.JSONDecodeError:
        return {
            "generated_prompt": raw_text.strip(),
            "language_detected": "English",
            "clarification_question": None
        }

async def regenerate_prompt(
    idea: str,
    instruction: Optional[str] = None,
    purpose: Optional[str] = None,
    context: Optional[str] = None,
    output_format: Optional[str] = None,
    constraints: Optional[str] = None
) -> Dict[str, Any]:
    if not settings.ai_api_key:
        raise HTTPException(
            status_code=400,
            detail="AI API Key is missing. Please configure your API key in backend/.env or through the Settings page."
        )

    models = [settings.ai_model] + [m for m in FALLBACK_MODELS if m != settings.ai_model]
    user_prompt_text = build_prompt_payload(idea, purpose, context, output_format, constraints, is_regenerate=True, instruction=instruction)

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION + "\n\n" + REGENERATE_MODIFIER}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"Transform this rough user idea into a fresh, distinct alternative AI prompt:\n\n{user_prompt_text}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.85,
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "OBJECT",
                "properties": {
                    "generated_prompt": {
                        "type": "STRING",
                        "description": "The fresh, distinctive alternative prompt"
                    },
                    "language_detected": {
                        "type": "STRING",
                        "description": "Detected input language"
                    },
                    "clarification_question": {
                        "type": "STRING",
                        "description": "Short clarification question if applicable, else null"
                    }
                },
                "required": ["generated_prompt", "language_detected"]
            }
        }
    }

    try:
        raw_text = await call_gemini_api(payload, models)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during prompt regeneration")
        raise HTTPException(status_code=502, detail=f"Prompt regeneration error: {str(e)}")

    try:
        parsed = json.loads(raw_text)
        return {
            "generated_prompt": parsed.get("generated_prompt", "").strip(),
            "language_detected": parsed.get("language_detected", "English").strip(),
            "clarification_question": parsed.get("clarification_question") or None
        }
    except json.JSONDecodeError:
        return {
            "generated_prompt": raw_text.strip(),
            "language_detected": "English",
            "clarification_question": None
        }
