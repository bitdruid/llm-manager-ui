/**
 * LLM Manager UI - Request Helpers
 * @description Shared request functions for chat and generate endpoints.
 */

/**
 * Send a streaming chat request.
 * @param {Object} params - Request params.
 * @param {string} params.model - Model name.
 * @param {Array<Object>} params.messages - Chat messages.
 * @param {Object} [params.options] - Optional Ollama options.
 * @param {boolean} [params.think] - Enable thinking mode when supported.
 * @returns {Promise<Response>} Fetch response.
 */
async function chat({ model, messages, options = {}, think = false }) {
    const body = { model, messages, options };
    if (think) {
        body.think = true;
    }

    return fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

/**
 * Send a streaming generate request.
 * @param {Object} params - Request params.
 * @param {string} params.model - Model name.
 * @param {string} params.prompt - Prompt text.
 * @param {Object} [params.options] - Optional Ollama options.
 * @returns {Promise<Response>} Fetch response.
 */
async function generate({ model, prompt, options = {} }) {
    return fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, options }),
    });
}
