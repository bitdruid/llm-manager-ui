"""Page routes for the LLM Manager UI."""

import os
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from llmm.extensions import logger
from llmm.config import BASE_PATH, VERSION, AUTHOR, GITHUB_URL

pages = APIRouter()
templates_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
templates = Jinja2Templates(directory=templates_path)


@pages.get("/")
async def root(request: Request):
    """Render the main dashboard page."""
    logger.info("Rendering dashboard")
    return templates.TemplateResponse(
        "main.jinja2",
        {
            "request": request,
            "base_path": BASE_PATH,
            "version": VERSION,
            "author": AUTHOR,
            "github_url": GITHUB_URL,
        },
    )


# Keep /home for backward compatibility
@pages.get("/home")
async def home():
    """Redirect to root for backward compatibility."""
    return RedirectResponse(url=f"{BASE_PATH}/")


# Keep /models for backward compatibility
@pages.get("/models")
async def models():
    """Redirect to root for backward compatibility."""
    return RedirectResponse(url=f"{BASE_PATH}/")
