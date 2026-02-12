/**
 * LLM Manager UI - Models Tab
 * @description Handles models list, running models, and model operations.
 */

/**
 * Load and display running models on the dashboard.
 */
async function loadRunningModels() {
    const container = document.getElementById("running-models-list");
    if (!container) return;

    const data = await fetchAPI("/models/running");

    if (data.error) {
        container.innerHTML = `<div class="alert alert-danger py-1">Error: ${data.error}</div>`;
        return;
    }

    if (!data.models || data.models.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">No models running</p>';
        return;
    }

    container.innerHTML = data.models
        .map((model) => {
            const details = model.details || {};
            const params = details.parameter_size || "-";
            const quant = details.quantization_level || "-";
            return `
        <div class="running-model-item">
            <div>
                <span class="fw-medium">${model.name}</span>
                <small class="text-muted ms-2">${params} | ${quant}</small>
            </div>
            <span class="badge bg-success status-badge">${model.size ? formatBytes(model.size) : "Active"}</span>
        </div>
    `;
        })
        .join("");
}

/**
 * Load and display total models count on the dashboard.
 */
async function loadTotalModels() {
    const container = document.getElementById("total-models");
    if (!container) return;

    const data = await fetchAPI("/models");

    if (data.error) {
        container.innerHTML = `<div class="alert alert-danger py-1">Error: ${data.error}</div>`;
        return;
    }

    const count = data.models ? data.models.length : 0;
    container.innerHTML = `
        <h3 class="mb-0">${count}</h3>
        <small class="text-muted">models installed</small>
    `;

    return data;
}

/**
 * Load and display total storage used by models.
 */
async function loadTotalStorage() {
    const container = document.getElementById("total-storage");
    if (!container) return;

    const data = await fetchAPI("/models");

    if (data.error) {
        container.innerHTML = `<div class="alert alert-danger py-1">Error: ${data.error}</div>`;
        return;
    }

    const totalBytes = data.models ? data.models.reduce((sum, model) => sum + (model.size || 0), 0) : 0;
    container.innerHTML = `
        <h3 class="mb-0">${formatBytes(totalBytes)}</h3>
        <small class="text-muted">total disk usage</small>
    `;
}

/**
 * Load and display the models list table.
 */
async function loadModelsList() {
    const container = document.getElementById("models-list");
    if (!container) return;

    container.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-3">Loading...</td></tr>';

    const data = await fetchAPI("/models");

    if (data.error) {
        container.innerHTML = `<tr><td colspan="6" class="text-center py-3"><div class="alert alert-danger mb-0">Error: ${data.error}</div></td></tr>`;
        return;
    }

    if (!data.models || data.models.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-3">No models installed</td></tr>';
        return;
    }

    container.innerHTML = data.models
        .map((model) => {
            const details = model.details || {};
            const params = details.parameter_size || "-";
            const format = details.format || "-";
            const quant = details.quantization_level || "-";
            // Ensure size is a number, default to 0 if not available
            const sizeBytes = parseInt(model.size) || 0;
            const sizeDisplay = sizeBytes > 0 ? formatBytes(sizeBytes) : "-";

            return `
        <tr>
            <td data-sort="${model.name.toLowerCase()}">${model.name}</td>
            <td data-sort="${sizeBytes}">${sizeDisplay}</td>
            <td data-sort="${params.toLowerCase()}">${params}</td>
            <td data-sort="${format.toLowerCase()}">${format}</td>
            <td data-sort="${quant.toLowerCase()}">${quant}</td>
            <td class="text-end no-sort">
                <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteModel('${model.name}')" title="Delete">
                    ✕
                </button>
            </td>
        </tr>
    `;
        })
        .join("");

    // Trigger a custom event to indicate table content has been updated
    const table = document.getElementById("models-table");
    if (table) {
        table.dispatchEvent(new Event("content-loaded"));
    }
}

/**
 * Pull a new model with streaming progress display.
 */
async function pullModel() {
    const input = document.getElementById("model-name-input");
    const statusDiv = document.getElementById("pull-status");
    const btn = document.getElementById("pull-model-btn");

    const modelName = input.value.trim();

    if (!modelName) {
        statusDiv.innerHTML = '<div class="alert alert-warning">Please enter a model name</div>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = "Pulling...";
    statusDiv.innerHTML = `
        <div class="alert alert-info mb-0">
            <div class="d-flex justify-content-between align-items-center">
                <span id="pull-status-text">Starting pull...</span>
                <span id="pull-progress-percent"></span>
            </div>
            <div class="progress mt-2" style="height: 6px;">
                <div class="progress-bar" id="pull-progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
        </div>
    `;

    const statusText = document.getElementById("pull-status-text");
    const progressBar = document.getElementById("pull-progress-bar");
    const progressPercent = document.getElementById("pull-progress-percent");

    try {
        const response = await fetch(`/api/models/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: modelName }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lastStatus = "";

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
                            statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
                            btn.disabled = false;
                            btn.innerHTML = "Pull";
                            return;
                        }

                        if (data.status) {
                            lastStatus = data.status;
                            if (statusText) statusText.textContent = data.status;
                        }

                        if (data.total && data.completed !== undefined) {
                            const percent = Math.round((data.completed / data.total) * 100);
                            const completedStr = formatBytes(data.completed);
                            const totalStr = formatBytes(data.total);
                            if (progressBar) progressBar.style.width = percent + "%";
                            if (progressPercent)
                                progressPercent.textContent = `${completedStr} / ${totalStr} (${percent}%)`;
                        }
                    } catch (e) {}
                }
            }
        }

        statusDiv.innerHTML = `<div class="alert alert-success">Model "${modelName}" pulled successfully!</div>`;
        input.value = "";
        loadModelsList();

        setTimeout(() => {
            statusDiv.innerHTML = "";
        }, 3000);
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }

    btn.disabled = false;
    btn.innerHTML = "Pull";
}

/**
 * Delete a model after confirmation.
 * @param {string} modelName - Name of the model to delete.
 */
async function deleteModel(modelName) {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) {
        return;
    }

    const result = await fetchAPI(`/models/${encodeURIComponent(modelName)}`, {
        method: "DELETE",
    });

    if (result.status === "success") {
        showNotification(`Model "${modelName}" deleted successfully!`, "success");
        loadModelsList();
    } else {
        showNotification(`Error deleting model: ${result.message}`, "danger");
    }
}

/**
 * Reset the table sort order to default.
 */
function resetTableSort() {
    const table = document.getElementById("models-table");
    if (!table) return;

    // Remove all aria-sort attributes from headers
    const headers = table.querySelectorAll("th[aria-sort]");
    headers.forEach((th) => th.removeAttribute("aria-sort"));

    // Reload the models list to restore original order
    loadModelsList();
}
