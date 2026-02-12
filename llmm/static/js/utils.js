/**
 * LLM Manager UI - Utility Functions
 * @description Shared utilities for theme, API calls, and formatting.
 */

// Initialize markdown-it with highlight.js
let md;

function initializeMarkdown() {
    if (typeof markdownit !== "undefined" && typeof hljs !== "undefined") {
        console.log("Initializing markdown-it with highlight.js");
        md = markdownit({
            html: false,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(str, { language: lang }).value;
                    } catch (__) {}
                }
                return "";
            },
        });
        console.log("Markdown-it initialized successfully");
    } else {
        console.warn("markdown-it or highlight.js not available", {
            markdownit: typeof markdownit,
            hljs: typeof hljs,
        });
    }
}

// Try to initialize immediately
initializeMarkdown();

/**
 * Initialize theme from localStorage or default to light.
 */
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
}

/**
 * Set the application theme.
 * @param {string} theme - Theme name ('light' or 'dark').
 */
function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcon(theme);
}

/**
 * Update the theme toggle button icon.
 * @param {string} theme - Current theme name.
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (icon) {
        icon.textContent = theme === "dark" ? "☀" : "☽";
    }
}

/**
 * Toggle between light and dark themes.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
}

/**
 * Make an API request to the backend.
 * @param {string} endpoint - API endpoint path.
 * @param {Object} options - Fetch options.
 * @returns {Promise<Object>} Response data or error object.
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        });
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { error: error.message };
    }
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes - Byte count.
 * @returns {string} Formatted string (e.g., "1.5 GB").
 */
function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

/**
 * Format date string to locale date.
 * @param {string} dateString - ISO date string.
 * @returns {string} Formatted locale date.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

/**
 * Show a temporary notification message.
 * @param {string} message - Message to display.
 * @param {string} type - Bootstrap alert type (success, danger, info, warning).
 */
function showNotification(message, type = "info") {
    const statusDiv = document.getElementById("pull-status");
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            statusDiv.innerHTML = "";
        }, 3000);
    } else {
        alert(message);
    }
}

/**
 * Escape HTML special characters.
 * @param {string} text - Text to escape.
 * @returns {string} Escaped text.
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
