"""Environment parsing and application configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _get_str(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _get_list(name: str, default: list[str] | None = None) -> list[str]:
    raw_value = _get_str(name)
    if not raw_value:
        return list(default or [])

    return [value.strip() for value in raw_value.split(",") if value.strip()]


def _get_base_path() -> str:
    base_path = _get_str("BASE_PATH")

    if base_path:
        if not base_path.startswith("/"):
            base_path = "/" + base_path
        base_path = base_path.rstrip("/")

    return base_path


@dataclass(frozen=True)
class EnvConfig:
    base_path: str
    fixed_models: list[str]
    log_level: str
    ollama_url: str


def load_env() -> EnvConfig:
    return EnvConfig(
        base_path=_get_base_path(),
        fixed_models=_get_list("FIXED_MODELS"),
        log_level=_get_str("LOG_LEVEL", "INFO").upper(),
        ollama_url=_get_str("OLLAMA_URL", "http://localhost:11434"),
    )


env = load_env()
