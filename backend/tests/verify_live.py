import urllib.request
import json
import sys
import time

BASE_URL = "http://127.0.0.1:8000"

def request_json(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            content = res.read().decode("utf-8")
            return res.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except:
            return e.code, {"raw": content}

def test_live_server():
    print("--- 1. Testing Live Server Startup & Health ---")
    status, health = request_json("/api/health")
    assert status == 200, f"Health check failed: {status}"
    print(f"Health check OK: {health}")

    print("\n--- 2. Testing SPA Static Page Serving ---")
    req = urllib.request.Request(f"{BASE_URL}/")
    with urllib.request.urlopen(req, timeout=5) as res:
        html = res.read().decode("utf-8")
        assert "<title>PromptCraft" in html
        print(f"Frontend SPA loaded successfully ({len(html)} bytes)")

    print("\n--- 3. Testing Empty Input Validation ---")
    status, err = request_json("/api/prompts/generate", method="POST", data={"idea": "   "})
    assert status == 400
    print(f"Empty input correctly rejected with 400: {err.get('detail')}")

    print("\n--- 4. Testing Live AI Generation with Optional Controls (Thanglish + Options) ---")
    thanglish = "enaku oru study app venum students ku useful ah irukanum"
    payload = {
        "idea": thanglish,
        "purpose": "Exam revision and flashcards for university students",
        "context": "Support offline caching on low-end smartphones",
        "output_format": "Step-by-step numbered feature specification",
        "constraints": "Do not include proprietary closed-source SDKs"
    }
    status, gen = request_json("/api/prompts/generate", method="POST", data=payload)
    assert status == 201, f"Generation failed: {status} {gen}"
    prompt_id = gen["id"]
    print(f"Successfully generated prompt ID: {prompt_id}")
    print(f"Purpose preserved: {gen.get('purpose')}")
    print(f"Output Format preserved: {gen.get('output_format')}")
    print(f"Generated prompt preview: {gen['generated_prompt'][:160]}...")

    print("\n--- 5. Testing Prompt Editing (PUT) with Special Characters ---")
    new_text = gen["generated_prompt"] + "\n\nNote: 'Special quotes' & \"emoji\" support 🚀🎉 verified."
    status, updated = request_json(f"/api/prompts/{prompt_id}", method="PUT", data={"generated_prompt": new_text})
    assert status == 200
    assert "Special quotes" in updated["generated_prompt"]
    print("Edit/Update with special characters verified successfully.")

    print("\n--- 6. Testing Save / Bookmark Toggle (PATCH) ---")
    status, saved = request_json(f"/api/prompts/{prompt_id}/save", method="PATCH", data={"is_saved": True})
    assert status == 200
    assert saved["is_saved"] is True
    print(f"Save toggle verified: is_saved = {saved['is_saved']}")

    print("\n--- 7. Testing Regeneration (POST) ---")
    status, regen = request_json("/api/prompts/regenerate", method="POST", data={"id": prompt_id})
    assert status == 200
    print(f"Regenerated prompt preview: {regen['generated_prompt'][:160]}...")

    print("\n--- 8. Testing History Retrieval & Search across Optional Fields ---")
    status, history = request_json("/api/prompts/history")
    assert status == 200
    assert history["total"] >= 1
    print(f"History retrieved: {len(history['prompts'])} prompts, total {history['total']}")

    # Search for a term that was in the purpose field
    status, search_res = request_json("/api/prompts/history?search=flashcards")
    assert status == 200
    assert len(search_res["prompts"]) >= 1
    print(f"Search for 'flashcards' across optional fields returned {len(search_res['prompts'])} matching prompt(s)")

    print("\n--- 9. Testing Saved Prompts Endpoint ---")
    status, saved_list = request_json("/api/prompts/saved")
    assert status == 200
    assert len(saved_list["prompts"]) >= 1
    print(f"Saved prompts returned {len(saved_list['prompts'])} item(s)")

    print("\n--- 10. Testing Delete ---")
    status, del_res = request_json(f"/api/prompts/{prompt_id}", method="DELETE")
    assert status == 200
    print("Prompt deleted successfully.")

    status, check_del = request_json(f"/api/prompts/{prompt_id}")
    assert status == 404
    print("Verified 404 on deleted prompt.")

    print("\n==========================================")
    print("ALL LIVE VERIFICATION CHECKS PASSED CLEANLY!")
    print("==========================================")

if __name__ == "__main__":
    test_live_server()
