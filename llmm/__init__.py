"""
LLM Manager UI - Web application for managing Ollama LLM models.

This module initializes the FastAPI application with Socket.IO support,
static file serving, and route registration.
"""

import os
import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import socketio

from llmm.api import api
from llmm.routes import pages
from llmm.extensions import sio, logger
from llmm.config import BASE_PATH
from llmm.services.ollama import ollama_service

instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance")
os.makedirs(instance_path, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    fixed_models_task = asyncio.create_task(ollama_service.ensure_fixed_models())
    try:
        yield
    finally:
        if not fixed_models_task.done():
            fixed_models_task.cancel()
            with suppress(asyncio.CancelledError):
                await fixed_models_task
        else:
            fixed_models_task.result()


class BasePathMiddleware:
    """Allow BASE_PATH routing with or without proxy prefix stripping."""

    def __init__(self, app, base_path: str):
        self.app = app
        self.base_path = base_path
        path_parts = [part for part in base_path.split("/") if part]
        self.base_path_candidates = ["/" + "/".join(path_parts[index:]) for index in range(len(path_parts))]

    async def __call__(self, scope, receive, send):
        if self.base_path and scope["type"] in {"http", "websocket"}:
            path = scope.get("path", "")
            for base_path in self.base_path_candidates:
                if path == base_path:
                    scope = {**scope, "path": "/"}
                    break
                if path.startswith(f"{base_path}/"):
                    scope = {**scope, "path": path[len(base_path) :]}
                    break

        await self.app(scope, receive, send)


# BASE_PATH is rendered into public URLs and stripped by BasePathMiddleware when
# a proxy forwards prefixed requests. Setting FastAPI.root_path as well breaks
# mounted StaticFiles when the proxy already strips the prefix.
llmm = FastAPI(title="LLM Manager UI", lifespan=lifespan)
llmm.add_middleware(BasePathMiddleware, base_path=BASE_PATH)

static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
llmm.mount("/static", StaticFiles(directory=static_path), name="static")

llmm.include_router(api)
llmm.include_router(pages)

logger.init_llmm(instance_path)

# Keep Socket.IO mounted at its app-relative path; the outer middleware accepts BASE_PATH-prefixed requests too.
sio_llmm = BasePathMiddleware(socketio.ASGIApp(sio, llmm, socketio_path="socket.io"), BASE_PATH)

from llmm import events  # noqa: E402, F401
