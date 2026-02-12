/**
 * LLM Manager UI - Chat/Prompt Tab
 * @description Handles chat interface and model interactions.
 */

// Chat state
let chatMessages = [];
let isGenerating = false;

/**
 * Get the current prompt mode (always chat now).
 * @returns {string} 'chat'
 */
function getPromptMode() {
    return "chat";
}

/**
 * Get prompt options from the UI.
 * @returns {Object} Options object for Ollama API
 */
function getPromptOptions() {
    const options = {};

    const temperature = document.getElementById("opt-temperature");
    if (temperature && temperature.value) {
        options.temperature = parseFloat(temperature.value);
    }

    const topK = document.getElementById("opt-top-k");
    if (topK && topK.value) {
        options.top_k = parseInt(topK.value);
    }

    const topP = document.getElementById("opt-top-p");
    if (topP && topP.value) {
        options.top_p = parseFloat(topP.value);
    }

    const repeatPenalty = document.getElementById("opt-repeat-penalty");
    if (repeatPenalty && repeatPenalty.value) {
        options.repeat_penalty = parseFloat(repeatPenalty.value);
    }

    const seed = document.getElementById("opt-seed");
    if (seed && seed.value) {
        options.seed = parseInt(seed.value);
    }

    const numPredict = document.getElementById("opt-num-predict");
    if (numPredict && numPredict.value) {
        options.num_predict = parseInt(numPredict.value);
    }

    const numCtx = document.getElementById("opt-num-ctx");
    if (numCtx && numCtx.value) {
        options.num_ctx = parseInt(numCtx.value);
    }

    return options;
}

/**
 * Check if a model supports reasoning/thinking mode.
 * @param {string} modelName - Name of the model to check.
 * @returns {Promise<boolean>} True if model supports reasoning.
 */
async function modelSupportsReasoning(modelName) {
    try {
        const data = await fetchAPI(`/models/${encodeURIComponent(modelName)}/info`);
        if (data.error) {
            return false;
        }

        if (Array.isArray(data.capabilities) && data.capabilities.includes("thinking")) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

/**
 * Load models into the chat model selector.
 */
async function loadChatModelSelect() {
    const select = document.getElementById("chat-model-select");
    if (!select) return;

    const data = await fetchAPI("/models");
    if (data.error || !data.models) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Select model...</option>';
    data.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model.name;
        option.textContent = model.name;
        select.appendChild(option);
    });

    // Restore previous selection if still available
    if (currentValue && data.models.some((m) => m.name === currentValue)) {
        select.value = currentValue;
    }
}

/**
 * Render chat messages in the chat container.
 */
function renderChatMessages() {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="text-muted text-center py-4">
                Select a model and start chatting
            </div>
        `;
        return;
    }

    container.innerHTML = chatMessages
        .map((msg) => {
            const isUser = msg.role === "user";
            const bgClass = isUser ? "bg-primary text-white" : "bg-body-secondary";
            const alignClass = isUser ? "ms-auto" : "me-auto";
            const label = isUser ? "You" : "Assistant";
            // Handle thinking content
            let content = msg.content;
            if (msg.thinking) {
                const thinkingContent = md ? md.render(msg.thinking) : escapeHtml(msg.thinking);
                const messageContent = md ? md.render(msg.content) : escapeHtml(msg.content);
                content = `<details class="mb-2"><summary class="text-muted small">Thinking...</summary><div class="small text-muted">${thinkingContent}</div></details>${messageContent}`;
            } else {
                content = md ? md.render(msg.content) : escapeHtml(msg.content);
            }
            return `
                <div class="d-flex mb-2">
                    <div class="${alignClass} ${bgClass} rounded p-2 px-3" style="max-width: 80%;">
                        <div class="small fw-medium mb-1">${label}</div>
                        <div class="markdown-content">${content}</div>
                    </div>
                </div>
            `;
        })
        .join("");

    container.scrollTop = container.scrollHeight;
}

/**
 * Send a message in chat mode.
 */
async function sendChatMessage() {
    const modelSelect = document.getElementById("chat-model-select");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-chat-btn");

    const model = modelSelect?.value;
    const message = chatInput?.value.trim();
    const options = getPromptOptions();

    if (!model) {
        alert("Please select a model first");
        return;
    }

    if (!message) {
        return;
    }

    if (isGenerating) {
        return;
    }

    // Add user message
    chatMessages.push({ role: "user", content: message });
    chatInput.value = "";
    renderChatMessages();

    // Prepare for assistant response
    isGenerating = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "...";

    // Add placeholder for assistant message
    const assistantMsg = { role: "assistant", content: "", thinking: "" };
    chatMessages.push(assistantMsg);
    renderChatMessages();

    try {
        // Check if model supports reasoning before enabling think mode
        const supportsReasoning = await modelSupportsReasoning(model);

        const endpoint = `/api/chat`;
        const body = {
            model: model,
            messages: chatMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
            options: options,
        };

        // Only enable thinking if model supports it
        if (supportsReasoning) {
            body.think = true;
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.error) {
                            chatMessages[chatMessages.length - 1].content = `Error: ${data.error}`;
                            renderChatMessages();
                            break;
                        }

                        // Chat mode response
                        if (data.message && data.message.content) {
                            chatMessages[chatMessages.length - 1].content += data.message.content;
                            renderChatMessages();
                        }
                        // Handle thinking content if present
                        if (data.message && data.message.thinking) {
                            chatMessages[chatMessages.length - 1].thinking += data.message.thinking;
                            renderChatMessages();
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (error) {
        chatMessages[chatMessages.length - 1].content = `Error: ${error.message}`;
        renderChatMessages();
    }

    isGenerating = false;
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
}

/**
 * Clear the chat history.
 */
function clearChat() {
    chatMessages = [];
    renderChatMessages();
}
