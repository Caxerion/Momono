import uuid
from datetime import datetime, timezone

from db import connect, init_db
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from llm import load_config, stream_chat

app = FastAPI()
cfg = load_config()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "model": cfg["model"]}


@app.get("/api/conversations")
def list_conversations(persona_id: str | None = None):
    with connect() as conn:
        if persona_id:
            rows = conn.execute(
                "SELECT * FROM conversations WHERE persona_id=? ORDER BY updated_at DESC",
                (persona_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM conversations ORDER BY updated_at DESC"
            ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/conversations")
async def create_conversation(req: Request):
    data = await req.json()
    cid = str(uuid.uuid4())
    title = data.get("title", "New Chat")
    persona_id = data.get("persona_id")
    ts = now()
    with connect() as conn:
        conn.execute(
            "INSERT INTO conversations (id, title, persona_id, created_at, updated_at) VALUES (?,?,?,?,?)",
            (cid, title, persona_id, ts, ts),
        )
        conn.commit()
    return {"id": cid, "title": title, "persona_id": persona_id}


@app.get("/api/conversations/{cid}/messages")
def get_messages(cid: str):
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id=? ORDER BY id ASC",
            (cid,),
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/conversations/{cid}/messages")
async def add_message(cid: str, req: Request):
    data = await req.json()
    role = data.get("role", "user")
    content = data.get("content", "")
    with connect() as conn:
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)",
            (cid, role, content, now()),
        )
        conn.commit()
    return {"ok": True}


@app.post("/api/chat")
async def chat(req: Request):
    data = await req.json()
    cid = data.get("conversation_id")
    user_msg = data.get("message", "")
    persona_id = data.get("persona_id")
    persona_prompt = data.get("system_prompt", "")
    is_regenerate = data.get("is_regenerate", False)
    regenerate_index = data.get("regenerate_index", 0)
    if persona_id:
        with connect() as conn:
            row = conn.execute(
                "SELECT about, system_prompt, greeting, personality FROM personas WHERE id=?", (persona_id,)
            ).fetchone()
        if row:
            persona_about = row["about"] or row["system_prompt"] or ""
            greeting = row["greeting"] or ""
            personality = row["personality"] or ""
            parts = [p for p in [persona_about, personality] if p]
            if parts:
                persona_prompt = "\n\n".join(parts) + "\n\n" + persona_prompt
        else:
            greeting = ""
    else:
        greeting = ""

    history = []
    if cid:
        with connect() as conn:
            rows = conn.execute(
                "SELECT role, content FROM messages WHERE conversation_id=? ORDER BY id ASC",
                (cid,),
            ).fetchall()
        history = [{"role": r["role"], "content": r["content"]} for r in rows]

    if not history and greeting:
        history = [{"role": "assistant", "content": greeting}]

    messages = []
    if persona_prompt:
        messages.append({"role": "system", "content": persona_prompt})
    messages.extend(history)
    messages.append({"role": "user", "content": user_msg})

    async def event_stream():
        acc = ""
        if cid and not is_regenerate:
            with connect() as conn:
                conn.execute(
                    "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?,?,?,?)",
                    (cid, "user", user_msg, now()),
                )
                conn.commit()
        async for piece in stream_chat(messages, cfg):
            acc += piece
            yield piece
        if cid:
            with connect() as conn:
                conn.execute(
                    "INSERT INTO messages (conversation_id, role, content, regenerate_index, created_at) VALUES (?,?,?,?,?)",
                    (cid, "assistant", acc, regenerate_index, now()),
                )
                conn.execute(
                    "UPDATE conversations SET updated_at=? WHERE id=?",
                    (now(), cid),
                )
                conn.commit()

    return StreamingResponse(event_stream(), media_type="text/plain")

@app.get("/api/personas")
def list_personas():
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM personas ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/personas")
async def create_persona(req: Request):
    data = await req.json()
    pid = str(uuid.uuid4())
    name = data.get("name", "Untitled Bot")
    title = data.get("title", "")
    about = data.get("about", "")
    greeting = data.get("greeting", "")
    personality = data.get("personality", "")
    with connect() as conn:
        conn.execute(
            "INSERT INTO personas (id, name, title, system_prompt, about, greeting, personality, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (pid, name, title, about, about, greeting, personality, now()),
        )
        conn.commit()
    return {"id": pid, "name": name}

@app.put("/api/personas/{pid}")
async def update_persona(pid: str, req: Request):
    data = await req.json()
    about = data.get("about", "")
    personality = data.get("personality", "")
    with connect() as conn:
        conn.execute(
            "UPDATE personas SET name=?, title=?, system_prompt=?, about=?, greeting=?, personality=? WHERE id=?",
            (data.get("name", ""), data.get("title", ""), about, about, data.get("greeting", ""), personality, pid),
        )
        conn.commit()
    return {"ok": True}
@app.delete("/api/personas/{pid}")
def delete_persona(pid: str):
    with connect() as conn:
        conn.execute("DELETE FROM personas WHERE id=?", (pid,))
        conn.commit()
    return {"ok": True}


@app.delete("/api/conversations/persona/{pid}")
def delete_persona_conversations(pid: str):
    with connect() as conn:
        conn.execute("DELETE FROM conversations WHERE persona_id=?", (pid,))
        conn.commit()
    return {"ok": True}
