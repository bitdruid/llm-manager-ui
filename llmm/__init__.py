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

# Create FastAPI app with optional root_path for reverse proxy support
llmm = FastAPI(title="LLM Manager UI", root_path=BASE_PATH, lifespan=lifespan)

static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
llmm.mount("/static", StaticFiles(directory=static_path), name="static")

llmm.include_router(api)
llmm.include_router(pages)

logger.init_llmm(instance_path)

# Configure Socket.IO with the base path
sio_llmm = socketio.ASGIApp(sio, llmm, socketio_path=f"{BASE_PATH}/socket.io" if BASE_PATH else "socket.io")

from llmm import events  # noqa: E402, F401
