import sqlite3
import datetime
from typing import Optional, List, Dict, Any
from .config import settings

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS prompts (
                    id TEXT PRIMARY KEY,
                    original_idea TEXT NOT NULL,
                    generated_prompt TEXT NOT NULL,
                    purpose TEXT,
                    context TEXT,
                    output_format TEXT,
                    constraints TEXT,
                    language_detected TEXT,
                    clarification_question TEXT,
                    is_saved INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)

            # Safe backward-compatible migration for existing databases
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(prompts)")
            existing_cols = {row["name"] for row in cursor.fetchall()}

            for col_name in ["purpose", "context", "output_format", "constraints", "device_id"]:
                if col_name not in existing_cols:
                    conn.execute(f"ALTER TABLE prompts ADD COLUMN {col_name} TEXT")

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prompts_is_saved ON prompts(is_saved);
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_prompts_device_id ON prompts(device_id);
            """)
    finally:
        conn.close()

def insert_prompt(
    prompt_id: str,
    original_idea: str,
    generated_prompt: str,
    purpose: Optional[str] = None,
    context: Optional[str] = None,
    output_format: Optional[str] = None,
    constraints: Optional[str] = None,
    language_detected: Optional[str] = None,
    clarification_question: Optional[str] = None,
    is_saved: bool = False,
    device_id: Optional[str] = None
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO prompts (
                    id, original_idea, generated_prompt, purpose, context,
                    output_format, constraints, language_detected,
                    clarification_question, is_saved, device_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    prompt_id,
                    original_idea,
                    generated_prompt,
                    purpose,
                    context,
                    output_format,
                    constraints,
                    language_detected,
                    clarification_question,
                    1 if is_saved else 0,
                    device_id,
                    now,
                    now
                )
            )
        return get_prompt_by_id(prompt_id, device_id=device_id)
    finally:
        conn.close()

def get_prompt_by_id(prompt_id: str, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if device_id:
            cursor.execute("SELECT * FROM prompts WHERE id = ? AND (device_id = ? OR device_id IS NULL)", (prompt_id, device_id))
        else:
            cursor.execute("SELECT * FROM prompts WHERE id = ?", (prompt_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
    finally:
        conn.close()

def list_prompts(
    search: Optional[str] = None,
    saved_only: bool = False,
    device_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM prompts WHERE 1=1"
        params: list = []

        if device_id:
            query += " AND (device_id = ?)"
            params.append(device_id)

        if saved_only:
            query += " AND is_saved = 1"

        if search:
            query += " AND (original_idea LIKE ? OR generated_prompt LIKE ? OR purpose LIKE ? OR context LIKE ?)"
            term = f"%{search.strip()}%"
            params.extend([term, term, term, term])

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def count_prompts(search: Optional[str] = None, saved_only: bool = False, device_id: Optional[str] = None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT COUNT(*) FROM prompts WHERE 1=1"
        params: list = []

        if device_id:
            query += " AND (device_id = ?)"
            params.append(device_id)

        if saved_only:
            query += " AND is_saved = 1"

        if search:
            query += " AND (original_idea LIKE ? OR generated_prompt LIKE ? OR purpose LIKE ? OR context LIKE ?)"
            term = f"%{search.strip()}%"
            params.extend([term, term, term, term])

        cursor.execute(query, params)
        return cursor.fetchone()[0]
    finally:
        conn.close()

def update_prompt_text(prompt_id: str, new_prompt_text: str, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            if device_id:
                cursor.execute(
                    "UPDATE prompts SET generated_prompt = ?, updated_at = ? WHERE id = ? AND (device_id = ? OR device_id IS NULL)",
                    (new_prompt_text, now, prompt_id, device_id)
                )
            else:
                cursor.execute(
                    "UPDATE prompts SET generated_prompt = ?, updated_at = ? WHERE id = ?",
                    (new_prompt_text, now, prompt_id)
                )
            if cursor.rowcount == 0:
                return None
        return get_prompt_by_id(prompt_id, device_id=device_id)
    finally:
        conn.close()

def toggle_save_prompt(prompt_id: str, explicit_save: Optional[bool] = None, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if device_id:
            cursor.execute("SELECT is_saved FROM prompts WHERE id = ? AND (device_id = ? OR device_id IS NULL)", (prompt_id, device_id))
        else:
            cursor.execute("SELECT is_saved FROM prompts WHERE id = ?", (prompt_id,))
        row = cursor.fetchone()
        if not row:
            return None
        
        current_state = bool(row["is_saved"])
        new_state = explicit_save if explicit_save is not None else not current_state
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        with conn:
            if device_id:
                conn.execute(
                    "UPDATE prompts SET is_saved = ?, updated_at = ? WHERE id = ? AND (device_id = ? OR device_id IS NULL)",
                    (1 if new_state else 0, now, prompt_id, device_id)
                )
            else:
                conn.execute(
                    "UPDATE prompts SET is_saved = ?, updated_at = ? WHERE id = ?",
                    (1 if new_state else 0, now, prompt_id)
                )
        return get_prompt_by_id(prompt_id, device_id=device_id)
    finally:
        conn.close()

def delete_prompt(prompt_id: str, device_id: Optional[str] = None) -> bool:
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            if device_id:
                cursor.execute("DELETE FROM prompts WHERE id = ? AND (device_id = ? OR device_id IS NULL)", (prompt_id, device_id))
            else:
                cursor.execute("DELETE FROM prompts WHERE id = ?", (prompt_id,))
            return cursor.rowcount > 0
    finally:
        conn.close()
