"""
LLM Manager UI - Web application for managing Ollama LLM models.

This module initializes the FastAPI application with Socket.IO support,
static file serving, and route registration.
"""

import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import socketio

from llmm.api import api
from llmm.routes import pages
from llmm.extensions import sio, logger
from llmm.config import BASE_PATH

instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance")
os.makedirs(instance_path, exist_ok=True)

# Create FastAPI app with optional root_path for reverse proxy support
llmm = FastAPI(title="LLM Manager UI", root_path=BASE_PATH)

static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
llmm.mount("/static", StaticFiles(directory=static_path), name="static")

llmm.include_router(api)
llmm.include_router(pages)

logger.init_llmm(instance_path)

# Configure Socket.IO with the base path
sio_llmm = socketio.ASGIApp(sio, llmm, socketio_path=f"{BASE_PATH}/socket.io" if BASE_PATH else "socket.io")

from llmm import events  # noqa: E402, F401
