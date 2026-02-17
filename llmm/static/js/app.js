/**
 * LLM Manager UI - Main Application
 * @description Initializes the application and sets up event listeners.
 */

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
    loadRunningModels();
    loadTotalModels();
    loadTotalStorage();
    loadModelsList();
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
        resetSortBtn.addEventListener("click", resetTableSort);
    }

    // Set up chat functionality
    const sendChatBtn = document.getElementById("send-chat-btn");
    if (sendChatBtn) {
        sendChatBtn.addEventListener("click", sendChatMessage);
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
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
        loadModelsList();
        loadRunningModels();
        loadTotalModels();
        loadTotalStorage();
        loadChatModelSelect();
    });
}
