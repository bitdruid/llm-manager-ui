"""REST API endpoints for interacting with Ollama models."""

from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from llmm.extensions import logger
from llmm.services.ollama import ollama_service

api = APIRouter(prefix="/api")


@api.get("/models")
async def get_models():
    """Get list of all available models"""
    logger.debug("Fetching all models")
    return await ollama_service.list_models()


@api.get("/models/running")
async def get_running_models():
    """Get currently running models"""
    logger.debug("Fetching running models")
    return await ollama_service.get_running_models()


@api.post("/models/pull")
async def pull_model(data: dict[str, Any]):
    """Pull a new model with streaming progress"""
    model_name = data.get("name")
    if not model_name:
        return {"status": "error", "message": "Model name is required"}
    logger.info(f"Pulling model: {model_name}")

    async def stream_progress():
        async for line in ollama_service.pull_model_stream(model_name):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_progress(), media_type="text/event-stream")


@api.delete("/models/{model_name}")
async def delete_model(model_name: str):
    """Delete a model"""
    logger.info(f"Deleting model: {model_name}")
    return await ollama_service.delete_model(model_name)


@api.get("/models/{model_name}/info")
async def get_model_info(model_name: str):
    """Get detailed information about a model"""
    logger.info(f"Fetching info for model: {model_name}")
    return await ollama_service.show_model_info(model_name)


@api.post("/chat")
async def chat(data: dict[str, Any]):
    """Chat with a model using streaming response"""
    model_name = data.get("model")
    messages = data.get("messages", [])
    options = data.get("options")
    think = data.get("think", False)
    if not model_name:
        return {"error": "Model name is required"}
    if not messages:
        return {"error": "Messages are required"}
    logger.info(f"Chat with model: {model_name}, options: {options}, think: {think}")

    async def stream_response():
        async for line in ollama_service.chat_stream(model_name, messages, options, think):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@api.post("/generate")
async def generate(data: dict[str, Any]):
    """Generate text from a model using streaming response"""
    model_name = data.get("model")
    prompt = data.get("prompt", "")
    options = data.get("options")
    if not model_name:
        return {"error": "Model name is required"}
    if not prompt:
        return {"error": "Prompt is required"}
    logger.info(f"Generate with model: {model_name}, options: {options}")

    async def stream_response():
        async for line in ollama_service.generate_stream(model_name, prompt, options):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@api.post("/models/update")
async def update_model(data: dict[str, Any]):
    """Update a model with streaming progress"""
    model_name = data.get("name")
    if not model_name:
        return {"status": "error", "message": "Model name is required"}
    logger.info(f"Updating model: {model_name}")

    async def stream_progress():
        async for line in ollama_service.pull_model_stream(model_name):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_progress(), media_type="text/event-stream")
