"""Configuration settings for the LLM Manager application."""

import os


def get_base_path() -> str:
    """
    Get the base path for the application from environment variable.

    For example, if the app is served at https://example.com/llm-manager/,
    set BASE_PATH=/llm-manager

    The base path should:
    - Start with a forward slash (e.g., /llm-manager)
    - NOT end with a forward slash
    - Be empty string for root deployment

    Returns:
        str: The normalized base path
    """
    base_path = os.environ.get("BASE_PATH", "").strip()

    if base_path:
        if not base_path.startswith("/"):
            base_path = "/" + base_path
        base_path = base_path.rstrip("/")

    return base_path


# Global config values
BASE_PATH = get_base_path()
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

# Project metadata
VERSION = "1.0.0"
AUTHOR = "bitdruid"
GITHUB_URL = "https://github.com/bitdruid/llm-manager-ui"
