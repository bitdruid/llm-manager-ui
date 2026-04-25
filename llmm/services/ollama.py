"""Ollama API service for model management."""

from typing import Any

import httpx

from llmm.env import env
from llmm.extensions import logger


class OllamaService:
    """Service for interacting with the Ollama API.

    Provides methods for listing, pulling, deleting, and inspecting models.
    """

    def __init__(self):
        """Initialize the service with Ollama URL from environment."""
        self.base_url = env.ollama_url
        self.timeout = 300.0
        self.fixed_models = env.fixed_models

    async def list_models(self) -> dict[str, Any]:
        """List all available models.

        Returns:
            Dictionary containing models list or error.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return {"models": [], "error": str(e)}

    async def ensure_fixed_models(self) -> None:
        """Pull configured fixed models when they are not installed."""
        if not self.fixed_models:
            return

        installed_response = await self.list_models()
        if installed_response.get("error"):
            logger.error(f"Skipping fixed model checks: {installed_response['error']}")
            return

        installed_models = {
            self._normalize_model_name(model.get("name", ""))
            for model in installed_response.get("models", [])
            if model.get("name")
        }

        for model_name in self.fixed_models:
            normalized_model_name = self._normalize_model_name(model_name)
            if normalized_model_name in installed_models:
                logger.info(f"Fixed model already installed: {model_name}")
                continue

            logger.info(f"Pulling missing fixed model: {model_name}")
            async for line in self.pull_model_stream(model_name):
                logger.debug(f"Fixed model pull progress for {model_name}: {line}")
            installed_models.add(normalized_model_name)

    def is_fixed_model(self, model_name: str) -> bool:
        normalized_name = self._normalize_model_name(model_name)
        return any(self._normalize_model_name(model) == normalized_name for model in self.fixed_models)

    @staticmethod
    def _normalize_model_name(model_name: str) -> str:
        model_name = model_name.strip()
        if model_name and ":" not in model_name:
            return f"{model_name}:latest"
        return model_name

    async def get_running_models(self) -> dict[str, Any]:
        """Get currently running models.

        Returns:
            Dictionary containing running models or error.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/ps")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error getting running models: {e}")
            return {"models": [], "error": str(e)}

    async def pull_model_stream(self, model_name: str):
        """Pull a model from Ollama library with streaming progress.

        Args:
            model_name: Name of the model to pull.

        Yields:
            JSON strings with progress updates.
        """
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/pull",
                    json={"name": model_name},
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {e}")
            yield f'{{"status": "error", "error": "{str(e)}"}}'

    async def delete_model(self, model_name: str) -> dict[str, Any]:
        """Delete a model.

        Args:
            model_name: Name of the model to delete.

        Returns:
            Dictionary with status and message.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    "DELETE",
                    f"{self.base_url}/api/delete",
                    json={"name": model_name},
                )
                response.raise_for_status()
                return {"status": "success", "message": f"Model {model_name} deleted"}
        except Exception as e:
            logger.error(f"Error deleting model {model_name}: {e}")
            return {"status": "error", "message": str(e)}

    async def unload_model(self, model_name: str) -> dict[str, Any]:
        """Unload a running model from memory.

        Args:
            model_name: Name of the model to unload.

        Returns:
            Dictionary with status and message.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model_name,
                        "stream": False,
                        "keep_alive": 0,
                    },
                )
                response.raise_for_status()
                return {"status": "success", "message": f"Model {model_name} unloaded"}
        except Exception as e:
            logger.error(f"Error unloading model {model_name}: {e}")
            return {"status": "error", "message": str(e)}

    async def load_model(self, model_name: str) -> dict[str, Any]:
        """Load a model into memory.

        Args:
            model_name: Name of the model to load.

        Returns:
            Dictionary with status and message.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model_name,
                        "stream": False,
                        "keep_alive": -1,
                    },
                )
                response.raise_for_status()
                return {"status": "success", "message": f"Model {model_name} loaded"}
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {e}")
            return {"status": "error", "message": str(e)}

    async def show_model_info(self, model_name: str) -> dict[str, Any]:
        """Get detailed information about a model.

        Args:
            model_name: Name of the model to inspect.

        Returns:
            Dictionary with model details or error.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/show",
                    json={"name": model_name},
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error getting model info for {model_name}: {e}")
            return {"error": str(e)}

    async def chat_stream(
        self,
        model_name: str,
        messages: list[dict[str, str]],
        options: dict[str, Any] | None = None,
        think: bool = False,
    ):
        """Send a chat message to a model with streaming response.

        Args:
            model_name: Name of the model to chat with.
            messages: List of message objects with 'role' and 'content'.
            options: Optional model parameters (temperature, top_k, top_p, etc.)
            think: Enable thinking/reasoning mode for supported models.

        Yields:
            JSON strings with response chunks.
        """
        try:
            payload = {
                "model": model_name,
                "messages": messages,
                "stream": True,
            }
            if think:
                payload["think"] = True
            if options:
                payload["options"] = options
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line
        except Exception as e:
            logger.error(f"Error chatting with model {model_name}: {e}")
            yield f'{{"error": "{str(e)}"}}'

    async def generate_stream(
        self,
        model_name: str,
        prompt: str,
        options: dict[str, Any] | None = None,
    ):
        """Generate text from a model with streaming response.

        Args:
            model_name: Name of the model to use.
            prompt: The prompt to generate from.
            options: Optional model parameters (temperature, top_k, top_p, etc.)

        Yields:
            JSON strings with response chunks.
        """
        try:
            payload = {
                "model": model_name,
                "prompt": prompt,
                "stream": True,
            }
            if options:
                payload["options"] = options
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line
        except Exception as e:
            logger.error(f"Error generating with model {model_name}: {e}")
            yield f'{{"error": "{str(e)}"}}'


ollama_service = OllamaService()
