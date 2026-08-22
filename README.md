LACServer Dashboard

A free game-server hosting dashboard built around GitHub Pages, Cloudflare, GitHub Actions, and Playit.

The goal is to let friends create and manage game servers through a simple web dashboard while keeping a limited number of server slots available.

🌐 Project

GitHub: "LACServer/Dashboard"

GitHub Pages: "https://lacserver.github.io/Dashboard/"

✨ Features

- 🎮 Create game servers
- 🟢 Live server status
- 📊 Server slot counter
- 🌐 Public Playit address display
- 📋 One-click address copying
- ▶️ Start servers
- ⏹️ Stop servers
- 🔄 Restart servers
- 👥 Player count
- 📝 Server information
- 📜 Server logs
- 📱 Mobile-friendly dashboard
- ☁️ Cloudflare backend
- ⚡ GitHub Actions server runners
- 🔗 Playit public tunnels

📁 Project Structure

Dashboard/
│
├── index.html
├── style.css
├── app.js
│
├── cloudflare/
│   ├── worker.js
│   └── schema.sql
│
├── .github/
│   └── workflows/
│       └── main.yml
│
└── README.md

🏗️ Architecture

┌──────────────────────┐
│     GitHub Pages     │
│                      │
│ index.html           │
│ style.css            │
│ app.js               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Cloudflare Worker  │
│        API           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Cloudflare D1     │
│                      │
│ Server slots         │
│ Status               │
│ Ownership             │
│ Endpoints            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    GitHub Actions    │
│                      │
│ L.A. Crimes server   │
│ Playit agent         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│        Playit        │
│                      │
│ Public UDP tunnel    │
└──────────────────────┘

🎯 Server Slots

The dashboard is designed around a limited number of available hosting slots.

Example:

1 / 4 SERVERS USED

🟢 Server 1 — ONLINE
⚪ Server 2 — AVAILABLE
⚪ Server 3 — AVAILABLE
⚪ Server 4 — AVAILABLE

When all slots are occupied:

4 / 4 SERVERS USED

No free server slots.

⚙️ Components

GitHub Pages

Hosts the frontend:

- "index.html"
- "style.css"
- "app.js"

The frontend contains no private API credentials.

Cloudflare Worker

Acts as the backend API.

It will handle:

- Server creation
- Server deletion
- Slot allocation
- Server status
- GitHub Actions requests
- Public endpoint information

Cloudflare D1

Stores persistent server information.

Example records include:

server_id
server_name
status
owner
github_run_id
playit_endpoint
created_at
updated_at

GitHub Actions

Runs the actual game server.

The existing workflow is:

.github/workflows/main.yml

It starts:

- L.A. Crimes
- Playit
- The configured server

Playit

Provides the public network tunnel so players outside the GitHub runner can connect to the game server.

🔐 Security

Private credentials must never be placed inside:

index.html
style.css
app.js

Secrets should be stored using:

- GitHub Actions Secrets
- Cloudflare Worker Secrets

In particular, never commit:

PLAYIT_SECRET
GITHUB_TOKEN
CLOUDFLARE_API_TOKEN

to the repository.

🚧 Project Status

Currently building.

Completed

- [x] GitHub repository
- [x] GitHub Pages structure
- [x] L.A. Crimes GitHub Actions server
- [x] Playit agent
- [x] Playit tunnel
- [x] Public game-server connectivity

In progress

- [ ] Dashboard UI
- [ ] Cloudflare Worker
- [ ] D1 database
- [ ] Server slot management
- [ ] GitHub Actions API integration
- [ ] Automatic Playit endpoint detection
- [ ] Start/stop controls
- [ ] Automatic offline-server cleanup

📜 License

This project is intended for personal/friends-only game-server hosting.

---

LACServer Dashboard
Free game-server hosting for friends.
