// ============================================
// LACSERVER DASHBOARD
// ============================================

// Your Cloudflare Worker URL
const API_URL =
    "https://bold-butterfly-9e61.amir-fazel-3333.workers.dev";

const serverGrid =
    document.getElementById("serverGrid");

const usageCount =
    document.getElementById("usageCount");

const toast =
    document.getElementById("toast");


// ============================================
// API
// ============================================

async function api(path, options = {}) {

    const response = await fetch(
        API_URL + path,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "The server returned an invalid response."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Request failed."
        );
    }

    return data;
}


// ============================================
// TOAST
// ============================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// ============================================
// LOAD SERVERS
// ============================================

async function loadServers() {

    try {

        const data =
            await api("/servers");

        const servers =
            data.servers || [];

        renderServers(servers);

    } catch (error) {

        console.error(error);

        serverGrid.innerHTML = `
            <div class="server-card error-card">

                <div class="server-header">
                    <div class="server-name">
                        Backend Error
                    </div>

                    <span class="status offline">
                        ERROR
                    </span>
                </div>

                <div class="server-info">
                    ${escapeHtml(error.message)}
                </div>

                <div class="server-actions">

                    <button
                        onclick="loadServers()"
                    >
                        Retry
                    </button>

                </div>

            </div>
        `;
    }
}


// ============================================
// RENDER
// ============================================

function renderServers(servers) {

    const used =
        servers.filter(
            server =>
                server.status !== "available"
        ).length;

    usageCount.textContent =
        `${used} / ${servers.length}`;

    serverGrid.innerHTML =
        servers
            .map(renderServer)
            .join("");
}


function renderServer(server) {

    const status =
        server.status || "available";

    // ----------------------------------------
    // AVAILABLE
    // ----------------------------------------

    if (status === "available") {

        return `
            <article
                class="server-card"
            >

                <div class="server-header">

                    <div class="server-name">
                        Server ${server.slot}
                    </div>

                    <span
                        class="status available"
                    >
                        AVAILABLE
                    </span>

                </div>

                <div class="server-info">

                    This server slot is
                    available for use.

                </div>

                <div class="server-actions">

                    <button
                        class="primary"
                        onclick="createServer(${server.id})"
                    >
                        + Create Server
                    </button>

                </div>

            </article>
        `;
    }


    // ----------------------------------------
    // USED SERVER
    // ----------------------------------------

    let endpointHTML = "";

    if (server.playit_endpoint) {

        endpointHTML = `
            <span class="endpoint">
                ${escapeHtml(
                    server.playit_endpoint
                )}
            </span>
        `;
    }


    return `
        <article
            class="server-card"
        >

            <div class="server-header">

                <div class="server-name">
                    ${escapeHtml(
                        server.name
                    )}
                </div>

                <span
                    class="status ${escapeHtml(status)}"
                >
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>

            <div class="server-info">

                <div>
                    Slot ${server.slot}
                </div>

                ${endpointHTML}

            </div>

            <div class="server-actions">

                ${
                    server.playit_endpoint
                    ?
                    `
                        <button
                            onclick="copyEndpoint(
                                '${escapeJs(
                                    server.playit_endpoint
                                )}'
                            )"
                        >
                            Copy Address
                        </button>
                    `
                    :
                    ""
                }

                <button
                    class="danger"
                    onclick="releaseServer(
                        ${server.id}
                    )"
                >
                    Release
                </button>

            </div>

        </article>
    `;
}


// ============================================
// CREATE SERVER
// ============================================

async function createServer(id) {

    const name =
        prompt(
            "Enter a name for your server:",
            "My LAC Server"
        );

    if (!name) {
        return;
    }

    if (name.trim().length < 2) {

        showToast(
            "Server name is too short."
        );

        return;
    }

    try {

        await api(
            "/servers",
            {
                method: "POST",

                body: JSON.stringify({
                    name: name.trim(),

                    // Temporary owner.
                    // We'll replace this with
                    // real authentication later.
                    owner: "guest"
                })
            }
        );

        showToast(
            "Server slot reserved!"
        );

        await loadServers();

    } catch (error) {

        console.error(error);

        showToast(
            error.message
        );
    }
}


// ============================================
// RELEASE SERVER
// ============================================

async function releaseServer(id) {

    const confirmed =
        confirm(
            "Release this server slot?\n\n" +
            "The slot will become available again."
        );

    if (!confirmed) {
        return;
    }

    try {

        await api(
            `/servers/${id}`,
            {
                method: "DELETE"
            }
        );

        showToast(
            "Server slot released."
        );

        await loadServers();

    } catch (error) {

        console.error(error);

        showToast(
            error.message
        );
    }
}


// ============================================
// COPY PUBLIC ADDRESS
// ============================================

async function copyEndpoint(endpoint) {

    try {

        await navigator.clipboard.writeText(
            endpoint
        );

        showToast(
            "Server address copied!"
        );

    } catch {

        showToast(
            "Could not copy the address."
        );
    }
}


// ============================================
// SECURITY HELPERS
// ============================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeJs(value) {

    return String(value)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}


// ============================================
// START
// ============================================

loadServers();


// Refresh dashboard every 10 seconds.

setInterval(
    loadServers,
    10000
);
