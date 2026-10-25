# PromptCraft — AI Prompt Generator Web Application

PromptCraft is an intelligent, full-stack web application that transforms rough ideas, casual thoughts, incomplete descriptions, and mixed-language inputs (English, Tamil, Thanglish, and colloquial phrasing) into structured, highly actionable, production-grade text prompts for AI tools.

---

## 🌟 Key Features

### 1. Automatic Multi-Language & Thanglish Comprehension
- Automatically identifies and interprets input in **English**, **Tamil**, **Thanglish** (Tamil written using Latin script, e.g. `"enaku oru study app venum students ku useful ah irukanum"`), informal phrasing, and casual shorthand with typos.
- Understands intent without requiring manual language selection.
- Generates polished, domain-appropriate prompts in English (or the language appropriate to the request).
- In accordance with privacy and clean design principles, no distracting language badges or language-selection menus are displayed in the UI.

### 2. Optional Generation Controls
Users can generate a prompt simply with a rough idea, or optionally expand the **Optional Details & Constraints** panel:
- **Prompt Purpose / Objective:** Define the specific goal (e.g., *"Architecting a SaaS MVP specification"*).
- **Desired Output Format:** Specify the target format (e.g., *"Step-by-step checklist with markdown tables"*).
- **Additional Context & Requirements:** Add domain context or special prerequisites (e.g., *"Offline-first mobile support"*).
- **Constraints / Things to Avoid:** Guardrails and restrictions (e.g., *"No paid external APIs"*).

### 3. Prompt Actions & Management
- **Copy:** One-click copy with modern Clipboard API and legacy fallback support. Provides clear feedback if clipboard permissions fail rather than falsely reporting success.
- **Edit:** In-place editing directly within the prompt view, with instant *"Save Changes"* persistence to the database.
- **Regenerate:** Produces fresh alternative formulations preserving the user's intent while varying structure and perspective.
- **Save / Bookmark:** Persistent bookmarks stored in SQLite with real-time synchronized state.
- **Searchable History & Bookmarks:** Full-text keyword search across original ideas, generated prompts, purposes, and contexts.
- **Safe Deletion:** Two-step confirmation modal with keyboard navigation (`Escape` to cancel) preventing accidental prompt loss.
- **Duplicate Prevention:** In-flight submission guards prevent duplicate records from rapid clicking.

### 4. Text-Only Focus & Safety
- Generates text prompts exclusively.
- No image generation previews, mock media, or unprompted model dropdowns.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, Fetch API |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, Pydantic v2, HTTPX |
| **Database** | SQLite3 (`prompts.db`) with automatic backward-compatible schema migrations |
| **AI Integration** | Google Gemini Engine (`gemini-3.8-flash` with automatic fallback to `gemini-flash-lite-latest`) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX ASGI Client, Live End-to-End Suite |

---

## 📂 Project Structure

```text
PROMPT/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, lifespan, SPA static hosting
│   │   ├── config.py            # Environment configuration & masked key utility
│   │   ├── database.py          # SQLite schema, migrations & CRUD methods
│   │   ├── schemas.py           # Pydantic v2 validation models
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── prompts.py       # Prompt generation, CRUD & search routes
│   │   │   └── settings.py      # Provider status & connection test routes
│   │   └── services/
│   │       ├── __init__.py
│   │       └── ai_service.py    # Gemini prompt engineering & fallback engine
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api.py          # Pytest unit & integration test suite (8 tests)
│   │   └── verify_live.py       # Live server end-to-end verification script
│   ├── requirements.txt         # Python dependencies
│   ├── prompts.db               # SQLite persistent database (created automatically)
│   └── .env                     # Local backend environment credentials
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js        # API client for backend endpoints
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header navigation with badge counters
│   │   │   ├── PromptCard.jsx   # Card with copy, edit, save & regenerate
│   │   │   ├── DeleteModal.jsx  # Accessible deletion confirmation dialog
│   │   │   └── Toast.jsx        # Notification alert container
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Main prompt generator & recent items
│   │   │   ├── HistoryPage.jsx  # Searchable historical prompt browser
│   │   │   ├── SavedPage.jsx    # Bookmarked prompts collection
│   │   │   └── SettingsPage.jsx # AI status, live latency test & model config
│   │   ├── utils/
│   │   │   ├── clipboard.js     # Robust clipboard copy utility with fallback
│   │   │   └── formatDate.js    # Relative and absolute date formatting
│   │   ├── App.jsx              # Main React state & router
│   │   ├── main.jsx             # React entrypoint
│   │   └── index.css            # Tailwind directives and custom scrollbars
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js           # Vite dev server with proxy to backend
│   └── tailwind.config.js
├── .env.example                 # Example environment template
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

- **Python:** 3.10+ (tested on Python 3.12)
- **Node.js:** v18+ or v20+ (with `npm.cmd` on Windows)
- **PowerShell:** Windows PowerShell 5.1 or PowerShell 7+

---

## 🚀 Local Run Instructions (Windows PowerShell)

### 1. Configure Environment Variables

Create or verify the `.env` file inside `backend/`:

```powershell
# Copy the example file if needed
Copy-Item .env.example backend\.env
```

Ensure `backend\.env` contains your Gemini configuration:
```ini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-3.8-flash
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
PORT=8000
HOST=127.0.0.1
DATABASE_PATH=prompts.db
```

*Note: The API key is securely loaded in Python process memory and is never exposed to client-side bundles.*

---

### 2. Launch Backend Server

In a PowerShell terminal:

```powershell
# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The backend server is accessible at:
- **Main Web App / API:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

---

### 3. Launch Frontend Development Server (Optional)

If developing with Vite hot-reloading:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open your browser at: **`http://localhost:5173`**

*(Alternatively, the compiled production build in `frontend/dist/` is automatically served directly by FastAPI at `http://127.0.0.1:8000`)*

---

## 🧪 Testing Suite

### 1. Automated Pytest Test Suite
Runs all 8 unit and integration tests including validation, CRUD, special characters, missing credentials, mocked network failures, and live generation:

```powershell
python -m pytest backend/tests -v
```

### 2. Live End-to-End Server Verification
While the backend server is running, verify all 10 requirements live:

```powershell
python backend/tests/verify_live.py
```

---

## 💾 SQLite Database & Migrations

PromptCraft uses SQLite (`prompts.db`) with automatic table creation and backward-compatible schema migrations on startup.
- **Columns:** `id`, `original_idea`, `generated_prompt`, `purpose`, `context`, `output_format`, `constraints`, `language_detected`, `clarification_question`, `is_saved`, `created_at`, `updated_at`.
- **Indexing:** Indexes on `created_at DESC` and `is_saved` for rapid search and filter queries.
- **Persistence:** All records survive server restarts and database reconnections.

---

## 🔧 Troubleshooting

1. **`npm.ps1 cannot be loaded because running scripts is disabled`**:
   - On Windows, invoke `npm.cmd` directly instead of `npm`, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
2. **`Gemini API Error (503 / 429) Demand Spikes`**:
   - PromptCraft includes automated model failover: if `gemini-3.8-flash` encounters a temporary traffic surge or 429 rate limit, it automatically routes through `gemini-flash-lite-latest` or `gemini-flash-latest`.
3. **Clipboard Errors in Non-Secure Contexts**:
   - When running on non-localhost HTTP origins, modern browser security disables `navigator.clipboard`. PromptCraft includes an automatic `document.execCommand` textarea fallback and alerts the user if permissions are entirely blocked.

---

## 📄 License
MIT License. Built for high-reliability, intelligent AI prompt generation.
