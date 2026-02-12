"""Shared extensions and singletons for the LLM Manager application."""

import socketio
from llmm.services.system.log import Log

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
logger = Log()
