"""Socket.IO event handlers for real-time communication."""

from llmm.extensions import sio, logger


@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def refresh_models(sid):
    """Handle client request to refresh model data."""
    logger.info(f"Client {sid} requested model refresh")
    await sio.emit("model_update", {"refresh": True}, room=sid)
