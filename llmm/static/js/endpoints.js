/**
 * LLM Manager UI - Endpoint Switcher
 * @description Loads the configured Ollama endpoints and lets the user switch
 * between them. The selection is stored client-side and sent with every
 * request via the X-Ollama-Url header (see requestHeaders in utils.js).
 */

/**
 * Reload every endpoint-scoped section of the dashboard.
 */
function refreshAllData() {
    loadRunningModels();
    loadTotalModels();
    loadTotalStorage();
    loadFixedModels().then(loadModelsList);
    loadChatModelSelect();
}

/**
 * Fetch configured endpoints and populate the navbar switcher.
 * @returns {Promise<void>} Resolves once the switcher is ready.
 */
async function loadEndpoints() {
    const select = document.getElementById("endpoint-select");
    if (!select) return;

    const data = await fetchAPI("/endpoints");
    const endpoints = (data && data.endpoints) || [];
    if (!endpoints.length) {
        select.classList.add("d-none");
        return;
    }

    // Drop any stored selection that is no longer configured, falling back to
    // the server-reported default.
    const defaultUrl = data.default || endpoints[0].url;
    const stored = getSelectedEndpoint();
    const current = endpoints.some((e) => e.url === stored) ? stored : defaultUrl;
    setSelectedEndpoint(current);

    select.innerHTML = endpoints
        .map((endpoint) => {
            const label = endpoint.default ? `${endpoint.name} [Default]` : endpoint.name;
            const selected = endpoint.url === current ? " selected" : "";
            return `<option value="${escapeHtml(endpoint.url)}"${selected}>${escapeHtml(label)}</option>`;
        })
        .join("");

    // A switcher only makes sense with more than one endpoint.
    select.classList.toggle("d-none", endpoints.length <= 1);

    select.addEventListener("change", () => {
        setSelectedEndpoint(select.value);
        refreshAllData();
    });
}
