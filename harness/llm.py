"""LLM provider layer.

The experiment code only talks to `LLMProvider.generate()`, so swapping the
model (e.g. Gemini free tier -> a paid model after the pilot) changes this file
and the --provider/--model flags, nothing else.

Every call returns an `LLMResult` that carries everything the protocol needs to
log: raw text, token usage (including thinking tokens), latency, the model
version string reported by the server, and every failed attempt.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class LLMResult:
    ok: bool
    text: str
    provider: str
    model_requested: str
    model_version: Optional[str]
    latency_s: float
    attempts: int
    errors: List[str] = field(default_factory=list)
    usage: Dict[str, Optional[int]] = field(default_factory=dict)


class LLMProvider:
    name = "base"

    def __init__(self, model: str, timeout_s: float = 180.0, max_attempts: int = 4):
        self.model = model
        self.timeout_s = timeout_s
        self.max_attempts = max_attempts

    def generate(self, prompt: str) -> LLMResult:  # pragma: no cover - interface
        raise NotImplementedError


class GeminiProvider(LLMProvider):
    """Google Gemini via the google-genai SDK (AI Studio key in GEMINI_API_KEY).

    SDK-internal retries are disabled so that every failed attempt (503
    overload, 429 quota, timeout) is visible and logged here; the protocol
    classifies a call that never succeeds as `environment_error`.
    Sampling parameters are left at the model defaults (recorded in run.json).
    """

    name = "gemini"
    BACKOFF_S = (10, 30, 60, 120)

    def __init__(self, model: str, timeout_s: float = 180.0, max_attempts: int = 4):
        super().__init__(model, timeout_s, max_attempts)
        from google import genai
        from google.genai import types

        self._types = types
        self._client = genai.Client(
            http_options=types.HttpOptions(
                timeout=int(timeout_s * 1000),
                retry_options=types.HttpRetryOptions(attempts=1),
            )
        )

    @staticmethod
    def _text_of(resp: Any) -> str:
        # Join visible text parts only (skip thought parts / signatures).
        parts = []
        for cand in (resp.candidates or [])[:1]:
            content = getattr(cand, "content", None)
            for p in (getattr(content, "parts", None) or []):
                if getattr(p, "thought", False):
                    continue
                if getattr(p, "text", None):
                    parts.append(p.text)
        return "".join(parts)

    def generate(self, prompt: str) -> LLMResult:
        errors: List[str] = []
        t0 = time.time()
        for attempt in range(1, self.max_attempts + 1):
            try:
                resp = self._client.models.generate_content(model=self.model, contents=prompt)
                um = resp.usage_metadata
                usage = {
                    "input_tokens": getattr(um, "prompt_token_count", None),
                    "output_tokens": getattr(um, "candidates_token_count", None),
                    "thinking_tokens": getattr(um, "thoughts_token_count", None),
                    "cached_tokens": getattr(um, "cached_content_token_count", None),
                    "total_tokens": getattr(um, "total_token_count", None),
                }
                return LLMResult(
                    ok=True,
                    text=self._text_of(resp),
                    provider=self.name,
                    model_requested=self.model,
                    model_version=getattr(resp, "model_version", None),
                    latency_s=round(time.time() - t0, 3),
                    attempts=attempt,
                    errors=errors,
                    usage=usage,
                )
            except Exception as e:  # noqa: BLE001 - every failure is data
                errors.append(f"{type(e).__name__}: {str(e)[:500]}")
                if attempt < self.max_attempts:
                    time.sleep(self.BACKOFF_S[min(attempt - 1, len(self.BACKOFF_S) - 1)])
        return LLMResult(
            ok=False,
            text="",
            provider=self.name,
            model_requested=self.model,
            model_version=None,
            latency_s=round(time.time() - t0, 3),
            attempts=self.max_attempts,
            errors=errors,
        )


PROVIDERS = {"gemini": GeminiProvider}


def get_provider(name: str, model: str, **kw: Any) -> LLMProvider:
    if name not in PROVIDERS:
        raise SystemExit(f"unknown provider {name!r}; available: {sorted(PROVIDERS)}")
    if name == "gemini" and not os.environ.get("GEMINI_API_KEY"):
        raise SystemExit("GEMINI_API_KEY is not set (expected in StudyFlow/.env)")
    return PROVIDERS[name](model, **kw)
