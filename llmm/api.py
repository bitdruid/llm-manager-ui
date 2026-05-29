"""REST API endpoints for interacting with Ollama models."""

from typing import Any

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse

from llmm.extensions import logger
from llmm.services.endpoints import Endpoint, registry
from llmm.services.ollama import ollama_service

api = APIRouter(prefix="/api")


async def resolve_endpoint(x_ollama_url: str | None = Header(default=None)) -> Endpoint:
    """Resolve the target endpoint from the X-Ollama-Url header.

    The header is validated against the configured allowlist; unknown or
    missing values fall back to the default endpoint.
    """
    return registry.resolve(x_ollama_url)


@api.get("/endpoints")
async def get_endpoints():
    """List configured Ollama endpoints and flag the default."""
    default_url = registry.default.url
    return {
        "endpoints": [
            {"name": endpoint.name, "url": endpoint.url, "default": endpoint.url == default_url}
            for endpoint in registry.endpoints
        ],
        "default": default_url,
    }


@api.get("/models")
async def get_models(endpoint: Endpoint = Depends(resolve_endpoint)):
    """Get list of all available models"""
    logger.debug(f"Fetching all models from {endpoint.url}")
    return await ollama_service.list_models(endpoint.url)


@api.get("/models/running")
async def get_running_models(endpoint: Endpoint = Depends(resolve_endpoint)):
    """Get currently running models"""
    logger.debug(f"Fetching running models from {endpoint.url}")
    return await ollama_service.get_running_models(endpoint.url)


@api.get("/models/fixed")
async def get_fixed_models(endpoint: Endpoint = Depends(resolve_endpoint)):
    """Get configured fixed models.

    Fixed models are managed only on the default endpoint, so other endpoints
    report none.
    """
    if not registry.is_default(endpoint.url):
        return {"models": []}
    return {"models": ollama_service.fixed_models}


@api.post("/models/pull")
async def pull_model(data: dict[str, Any], endpoint: Endpoint = Depends(resolve_endpoint)):
    """Pull a new model with streaming progress"""
    model_name = data.get("name")
    if not model_name:
        return {"status": "error", "message": "Model name is required"}
    logger.info(f"Pulling model: {model_name} on {endpoint.url}")

    async def stream_progress():
        async for line in ollama_service.pull_model_stream(endpoint.url, model_name):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_progress(), media_type="text/event-stream")


@api.delete("/models/{model_name:path}")
async def delete_model(model_name: str, endpoint: Endpoint = Depends(resolve_endpoint)):
    """Delete a model"""
    # FIXED_MODELS are only protected on the default endpoint, where they are
    # managed; elsewhere the same name is just a regular, deletable model.
    if registry.is_default(endpoint.url) and ollama_service.is_fixed_model(model_name):
        return {"status": "error", "message": f"Model {model_name} is configured in FIXED_MODELS"}

    logger.info(f"Deleting model: {model_name} on {endpoint.url}")
    return await ollama_service.delete_model(endpoint.url, model_name)


@api.post("/models/{model_name:path}/unload")
async def unload_model(model_name: str, endpoint: Endpoint = Depends(resolve_endpoint)):
    """Unload a running model from memory"""
    logger.info(f"Unloading model: {model_name} on {endpoint.url}")
    return await ollama_service.unload_model(endpoint.url, model_name)


@api.post("/models/{model_name:path}/load")
async def load_model(model_name: str, endpoint: Endpoint = Depends(resolve_endpoint)):
    """Load a model into memory"""
    logger.info(f"Loading model: {model_name} on {endpoint.url}")
    return await ollama_service.load_model(endpoint.url, model_name)


@api.get("/models/{model_name:path}/info")
async def get_model_info(model_name: str, endpoint: Endpoint = Depends(resolve_endpoint)):
    """Get detailed information about a model"""
    logger.info(f"Fetching info for model: {model_name} on {endpoint.url}")
    return await ollama_service.show_model_info(endpoint.url, model_name)


@api.post("/chat")
async def chat(data: dict[str, Any], endpoint: Endpoint = Depends(resolve_endpoint)):
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
        async for line in ollama_service.chat_stream(endpoint.url, model_name, messages, options, think):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@api.post("/generate")
async def generate(data: dict[str, Any], endpoint: Endpoint = Depends(resolve_endpoint)):
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
        async for line in ollama_service.generate_stream(endpoint.url, model_name, prompt, options):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@api.post("/models/update")
async def update_model(data: dict[str, Any], endpoint: Endpoint = Depends(resolve_endpoint)):
    """Update a model with streaming progress"""
    model_name = data.get("name")
    if not model_name:
        return {"status": "error", "message": "Model name is required"}
    logger.info(f"Updating model: {model_name} on {endpoint.url}")

    async def stream_progress():
        async for line in ollama_service.pull_model_stream(endpoint.url, model_name):
            yield f"data: {line}\n\n"

    return StreamingResponse(stream_progress(), media_type="text/event-stream")
