/**
 * LLM Manager UI - Main Application
 * @description Initializes the application and sets up event listeners.
 */

function autoResizeChatInput() {
    const chatInput = document.getElementById("chat-input");
    if (!chatInput) return;

    chatInput.style.height = "auto";
    const maxHeight = parseFloat(getComputedStyle(chatInput).maxHeight) || Infinity;
    const nextHeight = Math.min(chatInput.scrollHeight, maxHeight);
    chatInput.style.height = `${nextHeight}px`;
    chatInput.classList.toggle("has-overflow", chatInput.scrollHeight > maxHeight + 1);
}

/**
 * Initialize page functionality on DOM load.
 */
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded, initializing application");

    // Ensure markdown-it is initialized
    if (!md) {
        initializeMarkdown();
    }

    // Initialize theme
    initTheme();

    // Set up theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }

    // Load all dashboard data
    console.log("Loading dashboard data");
    initializeModelNameCopyHandlers();
    loadRunningModels();
    loadTotalModels();
    loadTotalStorage();
    loadFixedModels().then(loadModelsList);
    loadChatModelSelect();

    // Set up refresh intervals
    setInterval(() => loadRunningModels(), 3000);
    setInterval(() => {
        loadTotalModels();
        loadTotalStorage();
    }, 30000); // 30 seconds - reduced from 10s to minimize log noise

    // Set up model pull functionality
    const pullBtn = document.getElementById("pull-model-btn");
    if (pullBtn) {
        pullBtn.addEventListener("click", pullModel);
    }

    const modelInput = document.getElementById("model-name-input");
    if (modelInput) {
        modelInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                pullModel();
            }
        });
    }

    // Set up reset sort button
    const resetSortBtn = document.getElementById("reset-sort-btn");
    if (resetSortBtn) {
        resetSortBtn.innerHTML = `<span class="icon-btn">${renderIcon("arrow-up-wide-narrow")}</span>`;
        resetSortBtn.addEventListener("click", resetTableSort);
    }

    const promptOptionsIcon = document.getElementById("prompt-options-icon");
    if (promptOptionsIcon) {
        promptOptionsIcon.innerHTML = renderIcon("settings");
    }

    // Set up chat functionality
    const sendChatBtn = document.getElementById("send-chat-btn");
    if (sendChatBtn) {
        sendChatBtn.addEventListener("click", sendChatMessage);
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        autoResizeChatInput();
        chatInput.addEventListener("input", autoResizeChatInput);
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    const clearChatBtn = document.getElementById("clear-chat-btn");
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", clearChat);
    }
});

// Socket.io event handlers
if (typeof socket !== "undefined") {
    socket.on("connect", function () {
        console.log("Connected to server");
    });

    socket.on("model_update", function (data) {
        console.log("Model update received:", data);
        loadFixedModels().then(loadModelsList);
        loadRunningModels();
        loadTotalModels();
        loadTotalStorage();
        loadChatModelSelect();
    });
}
