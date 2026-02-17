"""Configuration settings for the LLM Manager application."""

import os
from importlib.metadata import metadata


def get_base_path() -> str:
    """
    Get the base path for the application from environment variable.
    """
    base_path = os.environ.get("BASE_PATH", "").strip()

    if base_path:
        if not base_path.startswith("/"):
            base_path = "/" + base_path
        base_path = base_path.rstrip("/")

    return base_path


def get_project_config() -> dict:
    meta = metadata("llm-manager-ui")

    version = meta["Version"]

    author = meta.get("Author")
    if not author:
        author_email = meta.get("Author-email", "")
        author = author_email.split("<")[0].strip()
    author = author or "Unknown"

    url = meta.get("Home-page")
    if not url:
        for project_url in meta.get_all("Project-URL", []):
            label, value = project_url.split(",", 1)
            if label.strip().lower() == "homepage":
                url = value.strip()
                break
    url = url or ""

    return {
        "version": version,
        "author": author,
        "github_url": url,
    }


cfg = get_project_config()

BASE_PATH = get_base_path()
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

VERSION = cfg["version"]
AUTHOR = cfg["author"]
GITHUB_URL = cfg["github_url"]
