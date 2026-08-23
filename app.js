const GIST_ID = "a6bd68866931ce5999003aa4f59d50b5";

const GIST_URL =
"https://gist.githubusercontent.com/" +
"LACServer/${GIST_ID}/raw/servers.json";

const serverGrid =
document.getElementById("serverGrid");

const usageCount =
document.getElementById("usageCount");

const toast =
document.getElementById("toast");

async function loadServers() {

try {

    serverGrid.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <span>Loading servers...</span>
        </div>
    `;


    const response =
        await fetch(
            `${GIST_URL}?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {
        throw new Error(
            `Gist returned ${response.status}`
        );
    }


    const data =
        await response.json();


    if (
        !data ||
        !Array.isArray(data.servers)
    ) {
        throw new Error(
            "Invalid servers.json"
        );
    }


    renderServers(data.servers);


} catch (error) {

    console.error(
        "Dashboard error:",
        error
    );


    serverGrid.innerHTML = `
        <div class="loading-card error-card">

            <strong>
                Backend Error
            </strong>

            <span>
                Failed to load server status.
            </span>

            <button
                class="refresh-button"
                onclick="loadServers()"
                type="button"
            >
                Try Again
            </button>

        </div>
    `;

    updateUsage([]);
}

}

function renderServers(servers) {

const sorted =
    [...servers].sort(
        (a, b) =>
            Number(a.slot) -
            Number(b.slot)
    );


const used =
    sorted.filter(
        server =>
            server.status !==
            "available"
    ).length;


updateUsage(sorted);


serverGrid.innerHTML =
    sorted.map(
        server =>
            createServerCard(server)
    ).join("");

}

function updateUsage(servers) {

const used =
    servers.filter(
        server =>
            server.status !==
            "available"
    ).length;


usageCount.textContent =
    `${used} / 4`;

}

function createServerCard(server) {

const status =
    String(
        server.status ||
        "available"
    ).toLowerCase();


let statusText =
    "AVAILABLE";


if (status === "starting") {
    statusText = "STARTING";
}

if (status === "online") {
    statusText = "ONLINE";
}

if (status === "offline") {
    statusText = "OFFLINE";
}


const endpoint =
    server.endpoint
        ? `
            <span class="endpoint">
                ${escapeHTML(
                    server.endpoint
                )}
            </span>
          `
        : "";


const available =
    status === "available";


const actions =
    available
        ? `
            <div class="server-actions">
                <button
                    class="primary"
                    type="button"
                    onclick="showComingSoon()"
                >
                    Create Server
                </button>
            </div>
          `
        : `
            <div class="server-actions">
                ${
                    server.endpoint
                        ? `
                            <button
                                type="button"
                                onclick="copyEndpoint('${escapeAttribute(server.endpoint)}')"
                            >
                                Copy Address
                            </button>
                          `
                        : ""
                }
            </div>
          `;


return `
    <article class="server-card">

        <div class="server-header">

            <div class="server-name">
                ${escapeHTML(
                    server.name ||
                    `Server ${server.slot}`
                )}
            </div>

            <span
                class="status ${escapeHTML(status)}"
            >
                ${statusText}
            </span>

        </div>


        <div class="server-info">

            ${
                available
                    ? "This server slot is available."
                    : "This server slot is currently in use."
            }

            ${endpoint}

        </div>


        ${actions}

    </article>
`;

}

function showComingSoon() {

showToast(
    "Server creation will be connected next."
);

}

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

function showToast(message) {

toast.textContent =
    message;

toast.classList.add(
    "show"
);


clearTimeout(
    showToast.timeout
);


showToast.timeout =
    setTimeout(
        () => {
            toast.classList.remove(
                "show"
            );
        },
        2500
    );

}

function escapeHTML(value) {

return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function escapeAttribute(value) {

return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");

}

loadServers();

setInterval(
loadServers,
15000
);
