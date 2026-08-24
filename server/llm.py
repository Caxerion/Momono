import json
import os
from collections.abc import AsyncIterator

import httpx
from config import DEFAULT_CONFIG


def load_config() -> dict:
    cfg = dict(DEFAULT_CONFIG)
    for key, value in cfg.items():
        env_val = os.environ.get(f"MOMONO_{key.upper()}")
        if env_val is not None:
            if isinstance(value, bool):
                cfg[key] = env_val.lower() in ("1", "true", "yes")
            elif isinstance(value, int):
                cfg[key] = int(env_val)
            elif isinstance(value, float):
                cfg[key] = float(env_val)
            else:
                cfg[key] = env_val
    return cfg


async def stream_chat(
    messages: list[dict], cfg: dict
) -> AsyncIterator[str]:
    if not cfg.get("api_key"):
        raise RuntimeError("MOMONO_API_KEY belum di-set")

    payload = {
        "model": cfg["model"],
        "messages": messages,
        "temperature": cfg["temperature"],
        "max_tokens": cfg["max_tokens"],
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client, client.stream(
        "POST",
        f"{cfg['api_base']}/chat/completions",
        headers=headers,
        json=payload,
    ) as resp:
        resp.raise_for_status()
        async for line in resp.aiter_lines():
            if not line or not line.startswith("data:"):
                continue
            data = line[len("data:") :].strip()
            if data == "[DONE]":
                break
            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue
            delta = chunk.get("choices", [{}])[0].get("delta", {})
            if content := delta.get("content"):
                yield content
