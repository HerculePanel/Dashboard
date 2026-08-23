const GITHUB_OWNER = "LACServer";
const GITHUB_REPO = "Dashboard";

/*

* TEST ONLY
* 
* Put your temporary GitHub token here.
* 
* IMPORTANT:
* This token is visible to anyone who can inspect
* the deployed GitHub Pages JavaScript.
* 
* DELETE/REVOKE THE TOKEN AFTER TESTING.
  */
  const GITHUB_TOKEN = "PASTE_YOUR_TEMPORARY_TOKEN_HERE";

const GIST_URL =
"https://gist.githubusercontent.com/LACServer/a6bd68866931ce5999003aa4f59d50b5/raw/servers.json";

const serverGrid =
document.getElementById("serverGrid");

const usageCount =
document.getElementById("usageCount");

const toast =
document.getElementById("toast");

/* ==========================================
LOAD SERVERS FROM GIST
========================================== */

async function loadServers() {

try {

    const response =
        await fetch(
            `${GIST_URL}?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {
        throw new Error(
            `Gist HTTP ${response.status}`
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


    renderServers(
        data.servers
    );


} catch (error) {

    console.error(
        "Failed to load servers:",
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

    usageCount.textContent =
        "0 / 4";
}

}

/* ==========================================
RENDER SERVERS
========================================== */

function renderServers(
servers
) {

const sorted =
    [...servers].sort(
        (a, b) =>
            Number(a.slot) -
            Number(b.slot)
    );


const used =
    sorted.filter(
        server =>
            String(
                server.status ||
                "available"
            ).toLowerCase() !==
            "available"
    ).length;


usageCount.textContent =
    `${used} / 4`;


serverGrid.innerHTML =
    sorted
        .map(
            server =>
                createServerCard(
                    server
                )
        )
        .join("");

}

/* ==========================================
CREATE SERVER CARD
========================================== */

function createServerCard(
server
) {

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
            <div class="endpoint">
                ${escapeHTML(
                    server.endpoint
                )}
            </div>
        `
        : "";


let button;


if (status === "available") {

    button = `
        <button
            class="primary"
            type="button"
            onclick="createServer(${Number(server.slot)})"
        >
            Create Server
        </button>
    `;

} else if (server.endpoint) {

    button = `
        <button
            type="button"
            onclick="copyEndpoint('${escapeAttribute(server.endpoint)}')"
        >
            Copy Address
        </button>
    `;

} else {

    button = "";
}


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
                status === "available"
                    ? "This server slot is available."
                    : "This server slot is currently in use."
            }

            ${endpoint}

        </div>


        <div class="server-actions">

            ${button}

        </div>

    </article>
`;

}

/* ==========================================
CREATE SERVER
========================================== */

async function createServer(
slot
) {

slot =
    Number(slot);


if (
    ![1, 2, 3, 4].includes(slot)
) {

    showToast(
        "Invalid server slot."
    );

    return;
}


if (
    !GITHUB_TOKEN ||
    GITHUB_TOKEN ===
    "PASTE_YOUR_TEMPORARY_TOKEN_HERE"
) {

    showToast(
        "GitHub token has not been configured."
    );

    console.error(
        "Set GITHUB_TOKEN in app.js for this test."
    );

    return;
}


const confirmed =
    confirm(
        `Start L.A. Crimes Server ${slot}?`
    );


if (!confirmed) {
    return;
}


showToast(
    `Starting Server ${slot}...`
);


try {

    const response =
        await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
            {
                method: "POST",

                headers: {
                    "Accept":
                        "application/vnd.github+json",

                    "Authorization":
                        `Bearer ${GITHUB_TOKEN}`,

                    "X-GitHub-Api-Version":
                        "2022-11-28",

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    event_type:
                        "create-server",

                    client_payload: {

                        slot:
                            String(slot)

                    }

                })
            }
        );


    if (
        response.status !== 204
    ) {

        let details = "";

        try {
            details =
                await response.text();
        } catch {
            details = "";
        }


        throw new Error(
            `GitHub HTTP ${response.status} ${details}`
        );
    }


    showToast(
        `Server ${slot} is starting!`
    );


    /*
     * Give GitHub Actions a moment to start,
     * then refresh the status.
     */

    setTimeout(
        loadServers,
        5000
    );


    setTimeout(
        loadServers,
        15000
    );


    setTimeout(
        loadServers,
        30000
    );


} catch (error) {

    console.error(
        "Failed to start server:",
        error
    );


    showToast(
        "Failed to start server."
    );
}

}

/* ==========================================
COPY ADDRESS
========================================== */

async function copyEndpoint(
endpoint
) {

try {

    await navigator.clipboard
        .writeText(endpoint);

    showToast(
        "Server address copied!"
    );

} catch {

    showToast(
        "Could not copy the address."
    );
}

}

/* ==========================================
TOAST
========================================== */

function showToast(
message
) {

if (!toast) {
    console.log(message);
    return;
}


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
        3000
    );

}

/* ==========================================
HTML ESCAPING
========================================== */

function escapeHTML(
value
) {

return String(value)

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );

}

function escapeAttribute(
value
) {

return String(value)

    .replaceAll(
        "\\",
        "\\\\"
    )

    .replaceAll(
        "'",
        "\\'"
    );

}

/* ==========================================
INITIAL LOAD
========================================== */

loadServers();

/* ==========================================
AUTOMATIC REFRESH
========================================== */

setInterval(
loadServers,
15000
);
