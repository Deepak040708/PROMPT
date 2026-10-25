import os
import tempfile
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport

from backend.app.config import settings
from backend.app.database import init_db, insert_prompt
from backend.app.main import app

@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    # Use isolated temporary database for tests
    test_db = tmp_path / "test_prompts.db"
    settings.database_path = str(test_db)
    init_db()
    yield
    if test_db.exists():
        test_db.unlink(missing_ok=True)

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "PromptCraft"

@pytest.mark.asyncio
async def test_empty_input_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/prompts/generate", json={"idea": "   "})
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_database_crud_and_persistence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        prompt_id = "test-uuid-1234"
        row = insert_prompt(
            prompt_id=prompt_id,
            original_idea="Initial draft idea with 'quotes' & \"special\" characters 🚀",
            generated_prompt="A well structured prompt for test purposes",
            purpose="Build SaaS",
            context="Mobile first",
            output_format="Markdown table",
            constraints="No heavy dependencies",
            language_detected="English",
            clarification_question=None,
            is_saved=False
        )
        assert row["id"] == prompt_id
        assert row["purpose"] == "Build SaaS"

        # 2. Get by ID
        res = await ac.get(f"/api/prompts/{prompt_id}")
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == prompt_id
        assert body["is_saved"] is False
        assert body["context"] == "Mobile first"

        # 3. Edit / PUT
        updated_text = "Updated prompt text by the user with emoji 🎉 and \n\n newlines"
        res_put = await ac.put(f"/api/prompts/{prompt_id}", json={"generated_prompt": updated_text})
        assert res_put.status_code == 200
        assert res_put.json()["generated_prompt"] == updated_text

        # 4. Save toggle / PATCH
        res_save = await ac.patch(f"/api/prompts/{prompt_id}/save", json={"is_saved": True})
        assert res_save.status_code == 200
        assert res_save.json()["is_saved"] is True

        # 5. Check saved endpoint
        res_saved = await ac.get("/api/prompts/saved")
        assert res_saved.status_code == 200
        saved_items = res_saved.json()["prompts"]
        assert len(saved_items) == 1
        assert saved_items[0]["id"] == prompt_id

        # 6. Search history by keyword or purpose
        res_search = await ac.get("/api/prompts/history?search=SaaS")
        assert res_search.status_code == 200
        assert len(res_search.json()["prompts"]) == 1

        # Search no match
        res_nomatch = await ac.get("/api/prompts/history?search=NonExistentKeywordXYZ")
        assert res_nomatch.status_code == 200
        assert len(res_nomatch.json()["prompts"]) == 0

        # 7. Delete
        res_del = await ac.delete(f"/api/prompts/{prompt_id}")
        assert res_del.status_code == 200

        # Verify 404 after deletion
        res_after = await ac.get(f"/api/prompts/{prompt_id}")
        assert res_after.status_code == 404

@pytest.mark.asyncio
async def test_special_characters_and_long_prompts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        special_idea = "Idea with தமிழ், Thanglish, Chinese (中文), emojis 🌟🔥, quotes \"'` and SQL-like ' OR 1=1 --"
        prompt_id = "test-special-chars"
        row = insert_prompt(
            prompt_id=prompt_id,
            original_idea=special_idea,
            generated_prompt="A" * 5000, # Long prompt
            purpose="Special Char Verification",
            is_saved=True
        )
        assert row["id"] == prompt_id
        res = await ac.get(f"/api/prompts/{prompt_id}")
        assert res.status_code == 200
        assert res.json()["original_idea"] == special_idea
        assert len(res.json()["generated_prompt"]) == 5000

@pytest.mark.asyncio
async def test_missing_credentials_handling():
    original_key = settings.ai_api_key
    settings.ai_api_key = ""
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/prompts/generate", json={"idea": "Testing missing key error"})
            assert res.status_code == 400
            assert "AI API Key is missing" in res.json()["detail"]
    finally:
        settings.ai_api_key = original_key

@pytest.mark.asyncio
async def test_mocked_provider_failure():
    # Test graceful error propagation without calling external network
    with patch("backend.app.services.ai_service.call_gemini_api", side_effect=Exception("Simulated provider network failure")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/prompts/generate", json={"idea": "Testing provider error"})
            assert res.status_code == 502
            assert "Simulated provider network failure" in res.json()["detail"]

@pytest.mark.asyncio
async def test_settings_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/settings")
        assert res.status_code == 200
        data = res.json()
        assert "configured" in data
        assert "model" in data
        assert "masked_api_key" in data

@pytest.mark.asyncio
async def test_ai_generation_with_optional_controls_live():
    if not settings.is_configured:
        pytest.skip("AI API key not configured")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "idea": "enaku oru study app venum students ku useful ah irukanum",
            "purpose": "Academic exam preparation and flashcards",
            "context": "Must work offline on Android phones",
            "output_format": "Markdown specifications with feature list",
            "constraints": "Do not include paid microtransactions"
        }
        res = await ac.post("/api/prompts/generate", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert "generated_prompt" in data
        assert len(data["generated_prompt"]) > 50
        assert data["purpose"] == payload["purpose"]
        assert data["context"] == payload["context"]
        assert data["output_format"] == payload["output_format"]
        assert data["constraints"] == payload["constraints"]
