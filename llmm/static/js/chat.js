/**
 * LLM Manager UI - Chat/Prompt Tab
 * @description Handles chat interface and model interactions.
 */

// Chat state
let chatMessages = [];
let isGenerating = false;

// Empty placeholder tool sent to tool-capable models: no arguments, no return.
const EMPTY_TOOL_TEMPLATE = {
    type: "function",
    function: {
        name: "placeholder",
        description: "Takes no arguments and returns nothing.",
        parameters: { type: "object", properties: {} },
    },
};

const SYSTEM_PROMPT_KEY = "systemPrompt";

/**
 * Get the saved system prompt, trimmed (empty string when unset).
 * @returns {string}
 */
function getSystemPrompt() {
    return (localStorage.getItem(SYSTEM_PROMPT_KEY) || "").trim();
}

/**
 * Persist (or clear) the system prompt and refresh the options indicator.
 * @param {string} text - System prompt text.
 */
function setSystemPrompt(text) {
    const value = (text || "").trim();
    if (value) {
        localStorage.setItem(SYSTEM_PROMPT_KEY, value);
    } else {
        localStorage.removeItem(SYSTEM_PROMPT_KEY);
    }
    updateSystemPromptIndicator();
}

/**
 * Reflect whether a system prompt is set as the button's active state.
 */
function updateSystemPromptIndicator() {
    const btn = document.getElementById("system-prompt-btn");
    if (btn) {
        btn.classList.toggle("active", Boolean(getSystemPrompt()));
    }
}

/**
 * Wire up the System Prompt modal (prefill, save, clear).
 */
function initSystemPrompt() {
    const input = document.getElementById("system-prompt-input");
    const saveBtn = document.getElementById("system-prompt-save");
    const clearBtn = document.getElementById("system-prompt-clear");

    if (input) {
        input.value = getSystemPrompt();
    }
    if (saveBtn) {
        saveBtn.addEventListener("click", () => setSystemPrompt(input ? input.value : ""));
    }
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (input) input.value = "";
            setSystemPrompt("");
        });
    }
    updateSystemPromptIndicator();
}

const THINKING_KEY = "thinkingEnabled";

/**
 * Whether thinking mode is currently toggled on.
 * @returns {boolean}
 */
function getThinkingEnabled() {
    return localStorage.getItem(THINKING_KEY) === "true";
}

/**
 * Persist the thinking toggle and refresh the button's active state.
 * @param {boolean} enabled
 */
function setThinkingEnabled(enabled) {
    localStorage.setItem(THINKING_KEY, enabled ? "true" : "false");
    updateThinkingButton();
}

/**
 * Reflect the thinking toggle as the button's active state.
 */
function updateThinkingButton() {
    const btn = document.getElementById("thinking-toggle-btn");
    if (btn) {
        const enabled = getThinkingEnabled();
        btn.classList.toggle("active", enabled);
        btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
}

/**
 * Wire up the Thinking toggle button.
 */
function initThinking() {
    const btn = document.getElementById("thinking-toggle-btn");
    if (btn) {
        btn.addEventListener("click", () => setThinkingEnabled(!getThinkingEnabled()));
    }
    updateThinkingButton();
}

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

    // Preserve which thinking accordions the user has expanded. The full
    // innerHTML rebuild below recreates the <details> elements on every
    // streamed chunk and would otherwise collapse them again immediately.
    const openThinking = new Set(
        Array.from(container.querySelectorAll("details[data-thinking-index][open]")).map(
            (el) => el.dataset.thinkingIndex,
        ),
    );

    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="text-muted text-center py-4">
                Select a model and start chatting
            </div>
        `;
        return;
    }

    container.innerHTML = chatMessages
        .map((msg, index) => {
            const isUser = msg.role === "user";
            const bgClass = isUser ? "bg-primary text-white" : "bg-body-secondary";
            const alignClass = isUser ? "ms-auto" : "me-auto";
            const label = isUser ? "You" : "Assistant";
            const messageContent = md ? md.render(msg.content) : escapeHtml(msg.content);
            let content = "";
            if (msg.thinking) {
                const thinkingContent = md ? md.render(msg.thinking) : escapeHtml(msg.thinking);
                content += `<details data-thinking-index="${index}" class="mb-2"><summary class="text-muted small">Thinking...</summary><div class="small text-muted ms-3 ps-2 border-start" data-thinking-body="${index}">${thinkingContent}</div></details>`;
            }
            content += `<div data-message-body="${index}">${messageContent}</div>`;
            const resendButton = isUser
                ? `<div class="mt-2 d-flex gap-2">
                       <button type="button" class="btn btn-sm btn-outline-light py-0 px-2" onclick="resendMessage(${index})">Resend</button>
                       <button type="button" class="btn btn-sm btn-outline-light py-0 px-2" onclick="deleteMessage(${index})">Delete</button>
                   </div>`
                : "";
            return `
                <div class="d-flex mb-2">
                    <div class="${alignClass} ${bgClass} rounded p-2 px-3" style="max-width: 80%;">
                        <div class="small fw-medium mb-1">${label}</div>
                        <div class="markdown-content">${content}</div>
                        ${resendButton}
                    </div>
                </div>
            `;
        })
        .join("");

    // Re-expand any thinking accordions that were open before the rebuild.
    openThinking.forEach((idx) => {
        const el = container.querySelector(`details[data-thinking-index="${idx}"]`);
        if (el) el.open = true;
    });

    container.scrollTop = container.scrollHeight;
}

/**
 * Update only the streaming message's thinking and content in place.
 *
 * Rebuilding the whole container per token (renderChatMessages) destroys and
 * recreates the <details> element on every chunk, so a click meant to expand
 * the thinking accordion never lands on a live element. Updating just the text
 * nodes keeps the accordion persistent and clickable while the model streams.
 * @param {number} index - Index of the message being streamed.
 */
function updateStreamingMessage(index) {
    const container = document.getElementById("chat-messages");
    if (!container) return;
    const msg = chatMessages[index];
    if (!msg) return;

    // First thinking token: the accordion isn't in the DOM yet, so do one full
    // render to insert it. Every subsequent update is in place.
    if (msg.thinking && !container.querySelector(`details[data-thinking-index="${index}"]`)) {
        renderChatMessages();
        return;
    }

    // Only keep pinned to the bottom if the user hasn't scrolled up to read.
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    if (msg.thinking) {
        const body = container.querySelector(`[data-thinking-body="${index}"]`);
        if (body) body.innerHTML = md ? md.render(msg.thinking) : escapeHtml(msg.thinking);
    }
    const msgBody = container.querySelector(`[data-message-body="${index}"]`);
    if (msgBody) msgBody.innerHTML = md ? md.render(msg.content) : escapeHtml(msg.content);

    if (nearBottom) container.scrollTop = container.scrollHeight;
}

/**
 * Send a message in chat mode.
 */
async function sendChatMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput?.value.trim();
    if (!message) return;

    chatInput.value = "";
    if (typeof autoResizeChatInput === "function") {
        autoResizeChatInput();
    }
    await sendMessage(message);
}

/**
 * Resend a previous user message, truncating newer chat context first.
 * @param {number} messageIndex - Index of the user message to resend.
 */
async function resendMessage(messageIndex) {
    if (isGenerating) {
        return;
    }

    const selectedMessage = chatMessages[messageIndex];
    if (!selectedMessage || selectedMessage.role !== "user") {
        return;
    }

    chatMessages = chatMessages.slice(0, messageIndex);
    renderChatMessages();
    await sendMessage(selectedMessage.content);
}

/**
 * Delete a user message together with its assistant response.
 * @param {number} messageIndex - Index of the user message to delete.
 */
function deleteMessage(messageIndex) {
    if (isGenerating) {
        return;
    }

    const selectedMessage = chatMessages[messageIndex];
    if (!selectedMessage || selectedMessage.role !== "user") {
        return;
    }

    // Remove the user message and the assistant reply that follows it, if any.
    const removeCount = chatMessages[messageIndex + 1]?.role === "assistant" ? 2 : 1;
    chatMessages.splice(messageIndex, removeCount);
    renderChatMessages();
}

/**
 * Send chat message content with current context.
 * @param {string} message - User message text.
 */
async function sendMessage(message) {
    const modelSelect = document.getElementById("chat-model-select");
    const sendBtn = document.getElementById("send-chat-btn");
    const model = modelSelect?.value;
    const options = getPromptOptions();

    if (!model) {
        alert("Please select a model first");
        return;
    }

    if (!message || isGenerating) {
        return;
    }

    // Add user message
    chatMessages.push({ role: "user", content: message });
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
        // Thinking is controlled by the manual toggle; tools stay capability-driven.
        const capabilities = await fetchModelCapabilities(model);
        const supportsTools = capabilities.includes("tools");
        const promptMode = getPromptMode();
        const contextMessages = chatMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

        // Prepend the system prompt (if set) so it leads the chat query.
        const systemPrompt = getSystemPrompt();
        if (systemPrompt) {
            contextMessages.unshift({ role: "system", content: systemPrompt });
        }

        const response =
            promptMode === "generate"
                ? await generate({
                      model: model,
                      prompt: message,
                      options: options,
                  })
                : await chat({
                      model: model,
                      messages: contextMessages,
                      options: options,
                      think: getThinkingEnabled(),
                      // Tool-capable models get an empty placeholder tool that
                      // takes no args and returns nothing, so the tools path is
                      // exercised without changing the conversation.
                      tools: supportsTools ? [EMPTY_TOOL_TEMPLATE] : null,
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
                            updateStreamingMessage(chatMessages.length - 1);
                        }

                        // Handle thinking content if present
                        if (data.message && data.message.thinking) {
                            chatMessages[chatMessages.length - 1].thinking += data.message.thinking;
                            updateStreamingMessage(chatMessages.length - 1);
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (error) {
        chatMessages[chatMessages.length - 1].content = `Error: ${error.message}`;
        renderChatMessages();
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
    }
}

/**
 * Clear the chat history.
 */
function clearChat() {
    chatMessages = [];
    renderChatMessages();
}
