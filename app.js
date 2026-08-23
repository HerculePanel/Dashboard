/* =========================================================
   L.A. CRIMES 4-SERVER CONTROL PANEL
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const OWNER = "LACServer";

const REPO = "LosAngelesCrimesServer";

const WORKFLOW = "main.yml";

const GIST_ID =
  "a6bd68866931ce5999003aa4f59d50b5";

const GIST_FILE =
  "servers.json";

const API =
  "https://api.github.com";

const API_VERSION =
  "2022-11-28";

const REF =
  "main";

const REFRESH_INTERVAL =
  10000;


/* =========================================================
   STATE
========================================================= */

let servers = [];

let activeRuns = {};

let refreshTimer = null;


/* =========================================================
   ELEMENTS
========================================================= */

const tokenInput =
  document.getElementById(
    "tokenInput"
  );

const saveTokenButton =
  document.getElementById(
    "saveTokenButton"
  );

const clearTokenButton =
  document.getElementById(
    "clearTokenButton"
  );

const tokenMessage =
  document.getElementById(
    "tokenMessage"
  );

const serversGrid =
  document.getElementById(
    "serversGrid"
  );

const refreshButton =
  document.getElementById(
    "refreshButton"
  );

const activityLog =
  document.getElementById(
    "activityLog"
  );

const activityStatus =
  document.getElementById(
    "activityStatus"
  );

const connectionDot =
  document.getElementById(
    "connectionDot"
  );

const connectionText =
  document.getElementById(
    "connectionText"
  );

const totalServers =
  document.getElementById(
    "totalServers"
  );

const onlineServers =
  document.getElementById(
    "onlineServers"
  );

const startingServers =
  document.getElementById(
    "startingServers"
  );

const availableServers =
  document.getElementById(
    "availableServers"
  );


/* =========================================================
   TOKEN
========================================================= */

const savedToken =
  sessionStorage.getItem(
    "lac_dashboard_token"
  );

if (savedToken) {
  tokenInput.value =
    savedToken;
}


saveTokenButton.addEventListener(
  "click",
  () => {

    const token =
      tokenInput.value.trim();

    if (!token) {

      showTokenMessage(
        "Enter a GitHub token first.",
        true
      );

      return;
    }

    sessionStorage.setItem(
      "lac_dashboard_token",
      token
    );

    showTokenMessage(
      "Token saved for this browser session."
    );

    refreshAll();
  }
);


clearTokenButton.addEventListener(
  "click",
  () => {

    sessionStorage.removeItem(
      "lac_dashboard_token"
    );

    tokenInput.value = "";

    showTokenMessage(
      "Token removed."
    );

    setConnection(
      false
    );
  }
);


function showTokenMessage(
  message,
  error = false
) {

  tokenMessage.textContent =
    message;

  tokenMessage.style.color =
    error
      ? "var(--red)"
      : "var(--muted)";
}


function getToken() {

  const token =
    tokenInput.value.trim();

  if (!token) {

    throw new Error(
      "Enter your GitHub token."
    );
  }

  return token;
}


/* =========================================================
   GITHUB API
========================================================= */

async function github(
  path,
  options = {}
) {

  const token =
    getToken();

  const response =
    await fetch(
      API + path,
      {
        ...options,

        headers: {
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            "Bearer " + token,

          "X-GitHub-Api-Version":
            API_VERSION,

          ...(options.headers || {})
        }
      }
    );


  if (!response.ok) {

    let message =
      response.statusText;

    try {

      const data =
        await response.json();

      if (data.message) {
        message =
          data.message;
      }

    } catch (_) {}

    throw new Error(
      `GitHub API ${response.status}: ${message}`
    );
  }


  if (response.status === 204) {
    return null;
  }


  return response.json();
}


/* =========================================================
   CONNECTION
========================================================= */

function setConnection(
  connected
) {

  if (connected) {

    connectionDot.classList.add(
      "connected"
    );

    connectionText.textContent =
      "Connected";

  } else {

    connectionDot.classList.remove(
      "connected"
    );

    connectionText.textContent =
      "Disconnected";
  }
}


/* =========================================================
   ACTIVITY
========================================================= */

function activity(
  text
) {

  const time =
    new Date().toLocaleTimeString();

  activityLog.textContent +=
    `\n[${time}] ${text}`;

  activityLog.scrollTop =
    activityLog.scrollHeight;

  activityStatus.textContent =
    text;
}


/* =========================================================
   LOAD GIST DATABASE
========================================================= */

async function loadDatabase() {

  const data =
    await github(
      `/gists/${GIST_ID}`
    );


  if (
    !data.files ||
    !data.files[GIST_FILE]
  ) {

    throw new Error(
      `${GIST_FILE} was not found in the Gist.`
    );
  }


  const raw =
    data.files[GIST_FILE].content;


  const parsed =
    JSON.parse(raw);


  if (
    !Array.isArray(
      parsed.servers
    )
  ) {

    throw new Error(
      "servers.json does not contain a servers array."
    );
  }


  servers =
    parsed.servers
      .sort(
        (a, b) =>
          Number(a.slot) -
          Number(b.slot)
      );


  return servers;
}


/* =========================================================
   LOAD ACTIVE WORKFLOW RUNS
========================================================= */

async function loadActiveRuns() {

  const data =
    await github(
      `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=100`
    );


  activeRuns = {};


  for (
    const run of
    data.workflow_runs || []
  ) {

    if (
      run.event !==
      "workflow_dispatch" &&
      run.event !==
      "repository_dispatch"
    ) {
      continue;
    }


    if (
      run.status !==
      "queued" &&
      run.status !==
      "in_progress"
    ) {
      continue;
    }


    /*
     * workflow_dispatch runs don't expose
     * the slot in a convenient top-level field.
     *
     * The workflow database remains the
     * authoritative source for the slot.
     */

    const possibleSlots =
      servers
        .filter(
          server =>
            server.status ===
              "starting" ||
            server.status ===
              "online"
        )
        .map(
          server =>
            Number(server.slot)
        );


    for (
      const slot of
      possibleSlots
    ) {

      if (
        !activeRuns[slot]
      ) {

        activeRuns[slot] =
          run;
      }
    }
  }
}


/* =========================================================
   RENDER SERVERS
========================================================= */

function renderServers() {

  serversGrid.innerHTML =
    "";


  if (!servers.length) {

    serversGrid.innerHTML =
      `
        <div class="loading">
          No servers found.
        </div>
      `;

    return;
  }


  for (
    const server of servers
  ) {

    const slot =
      Number(server.slot);

    const status =
      String(
        server.status ||
        "available"
      ).toLowerCase();


    const card =
      document.createElement(
        "div"
      );

    card.className =
      "server-card";


    let statusClass =
      "available";

    let statusText =
      "Available";


    if (
      status ===
      "starting"
    ) {

      statusClass =
        "starting";

      statusText =
        "Starting...";

    } else if (
      status ===
      "online"
    ) {

      statusClass =
        "online";

      statusText =
        "Online";

    } else if (
      status ===
      "error"
    ) {

      statusClass =
        "error";

      statusText =
        "Error";
    }


    const endpoint =
      server.endpoint;


    card.innerHTML =
      `
        <div class="server-top">

          <div>
            <div class="server-name">
              ${escapeHtml(
                server.name ||
                `Server ${slot}`
              )}
            </div>

            <div class="slot">
              Slot ${slot}
            </div>
          </div>

        </div>

        <div
          class="status-badge ${statusClass}"
        >
          ${statusText}
        </div>

        ${
          endpoint
            ? `
              <div class="endpoint">
                ${escapeHtml(
                  endpoint
                )}
              </div>
            `
            : `
              <div class="no-endpoint">
                No public endpoint.
              </div>
            `
        }

        <div class="server-actions">

          ${
            status ===
            "available"
              ? `
                <button
                  class="button primary"
                  onclick="startServer(${slot})"
                >
                  ▶ Start
                </button>
              `
              : ""
          }

          ${
            status ===
              "starting" ||
            status ===
              "online"
              ? `
                <button
                  class="button danger"
                  onclick="stopServer(${slot})"
                >
                  ■ Stop
                </button>
              `
              : ""
          }

        </div>
      `;


    serversGrid.appendChild(
      card
    );
  }


  updateStats();
}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  let online =
    0;

  let starting =
    0;

  let available =
    0;


  for (
    const server of servers
  ) {

    const status =
      String(
        server.status ||
        "available"
      ).toLowerCase();


    if (
      status ===
      "online"
    ) {

      online++;

    } else if (
      status ===
      "starting"
    ) {

      starting++;

    } else {

      available++;
    }
  }


  totalServers.textContent =
    servers.length;

  onlineServers.textContent =
    online;

  startingServers.textContent =
    starting;

  availableServers.textContent =
    available;
}


/* =========================================================
   START SERVER
========================================================= */

async function startServer(
  slot
) {

  try {

    getToken();


    const server =
      servers.find(
        item =>
          Number(item.slot) ===
          Number(slot)
      );


    if (!server) {

      throw new Error(
        `Server slot ${slot} does not exist.`
      );
    }


    if (
      server.status !==
      "available"
    ) {

      throw new Error(
        `Server ${slot} is not available.`
      );
    }


    activity(
      `Starting Server ${slot}...`
    );


    await github(
      `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            ref: REF,

            inputs: {
              slot:
                String(slot)
            }
          })
      }
    );


    activity(
      `Workflow requested for Server ${slot}.`
    );


    /*
     * Give GitHub a moment to create
     * the workflow run.
     */

    await sleep(
      2500
    );


    await refreshAll();

  }

  catch (error) {

    activity(
      `Start Server ${slot} failed: ${error.message}`
    );

    alert(
      error.message
    );
  }
}


/* =========================================================
   STOP SERVER
========================================================= */

async function stopServer(
  slot
) {

  try {

    getToken();


    const confirmed =
      confirm(
        `Stop Server ${slot}?`
      );


    if (!confirmed) {
      return;
    }


    let run =
      activeRuns[slot];


    /*
     * If we don't have a remembered run,
     * search the active runs.
     */

    if (!run) {

      const data =
        await github(
          `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=100`
        );


      const candidates =
        data.workflow_runs ||
        [];


      run =
        candidates.find(
          item =>
            (
              item.status ===
                "queued" ||
              item.status ===
                "in_progress"
            ) &&
            (
              item.event ===
                "workflow_dispatch" ||
              item.event ===
                "repository_dispatch"
            )
        );
    }


    if (!run) {

      throw new Error(
        `No active workflow run was found for Server ${slot}.`
      );
    }


    activity(
      `Stopping Server ${slot}...`
    );


    await github(
      `/repos/${OWNER}/${REPO}/actions/runs/${run.id}/cancel`,
      {
        method:
          "POST"
      }
    );


    activity(
      `Cancellation requested for Server ${slot}.`
    );


    await sleep(
      2000
    );


    await refreshAll();

  }

  catch (error) {

    activity(
      `Stop Server ${slot} failed: ${error.message}`
    );

    alert(
      error.message
    );
  }
}


/* =========================================================
   REFRESH EVERYTHING
========================================================= */

async function refreshAll() {

  if (
    !tokenInput.value.trim()
  ) {

    setConnection(
      false
    );

    return;
  }


  try {

    refreshButton.disabled =
      true;


    activityStatus.textContent =
      "Refreshing...";


    await loadDatabase();


    await loadActiveRuns();


    setConnection(
      true
    );


    renderServers();


    activity(
      "Server database refreshed."
    );

  }

  catch (error) {

    setConnection(
      false
    );


    activity(
      `Refresh failed: ${error.message}`
    );


    serversGrid.innerHTML =
      `
        <div class="loading">
          ${escapeHtml(
            error.message
          )}
        </div>
      `;

  }

  finally {

    refreshButton.disabled =
      false;
  }
}


/* =========================================================
   REFRESH BUTTON
========================================================= */

refreshButton.addEventListener(
  "click",
  () => {

    refreshAll();

  }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
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


/* =========================================================
   SLEEP
========================================================= */

function sleep(
  milliseconds
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}


/* =========================================================
   AUTOMATIC REFRESH
========================================================= */

function startAutomaticRefresh() {

  if (refreshTimer) {

    clearInterval(
      refreshTimer
    );
  }


  refreshTimer =
    setInterval(
      refreshAll,
      REFRESH_INTERVAL
    );
}


/* =========================================================
   STARTUP
========================================================= */

window.addEventListener(
  "load",
  async () => {

    if (
      tokenInput.value.trim()
    ) {

      await refreshAll();

      startAutomaticRefresh();

    } else {

      setConnection(
        false
      );

      activityStatus.textContent =
        "Token required";
    }

  }
);
