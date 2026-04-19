/**
 * Shared SVG icon helpers.
 */
function renderIcon(name) {
    if (name === "rotate-cw") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw-icon lucide-rotate-cw" aria-hidden="true" focusable="false">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
            </svg>
        `;
    }

    if (name === "x") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
            </svg>
        `;
    }

    if (name === "upload") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload-icon lucide-upload" aria-hidden="true" focusable="false">
                <path d="M12 3v12"></path>
                <path d="m17 8-5-5-5 5"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            </svg>
        `;
    }

    if (name === "download") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download" aria-hidden="true" focusable="false">
                <path d="M12 15V3"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <path d="m7 10 5 5 5-5"></path>
            </svg>
        `;
    }

    if (name === "arrow-up-wide-narrow") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-wide-narrow-icon lucide-arrow-up-wide-narrow" aria-hidden="true" focusable="false">
                <path d="m3 8 4-4 4 4"></path>
                <path d="M7 4v16"></path>
                <path d="M11 12h10"></path>
                <path d="M11 16h7"></path>
                <path d="M11 20h4"></path>
            </svg>
        `;
    }

    if (name === "settings") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings" aria-hidden="true" focusable="false">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 1.6l-.16.8a2 2 0 0 1-1.47 1.49l-.8.2a2 2 0 0 0-1.28 3l.43.75a2 2 0 0 1 0 2l-.43.75a2 2 0 0 0 1.28 3l.8.2a2 2 0 0 1 1.47 1.49l.16.8a2 2 0 0 0 2 1.6h.44a2 2 0 0 0 2-1.6l.16-.8a2 2 0 0 1 1.47-1.49l.8-.2a2 2 0 0 0 1.28-3l-.43-.75a2 2 0 0 1 0-2l.43-.75a2 2 0 0 0-1.28-3l-.8-.2a2 2 0 0 1-1.47-1.49l-.16-.8a2 2 0 0 0-2-1.6z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }

    if (name === "sun") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
        `;
    }

    if (name === "moon") {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon-icon lucide-moon" aria-hidden="true" focusable="false">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"></path>
            </svg>
        `;
    }

    return "";
}
