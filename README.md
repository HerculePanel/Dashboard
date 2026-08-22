# 🎮 L.A. Crimes Server

A free L.A. Crimes dedicated-server experiment using:

- GitHub Actions
- L.A. Crimes Linux server
- Rustunnel UDP tunneling
- GitHub Pages dashboard

## How it works

```text
GitHub Pages
     ↓
GitHub API
     ↓
GitHub Actions
     ↓
L.A. Crimes :7777
     ↓
Rustunnel UDP
     ↓
Players

Setup

1. Create a Rustunnel account

Create a Rustunnel account and create an API key.

Do not put the key in "index.html".

2. Add the GitHub secret

Open:

Repository
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret

Create:

Name:
RUSTUNNEL_TOKEN

Value:
YOUR_RUSTUNNEL_TOKEN

3. Workflow

The server workflow is:

.github/workflows/main.yml

It:

1. Installs Rustunnel.
2. Downloads L.A. Crimes.
3. Creates the server configuration.
4. Sets the map to City.
5. Starts L.A. Crimes on UDP 7777.
6. Starts a Rustunnel UDP tunnel.
7. Detects the "tunnel_ready" event.
8. Extracts the public address.
9. Prints:

SERVER_STATUS=ONLINE
SERVER_READY=true
MAP=City
LOCAL_UDP=7777
PUBLIC_ENDPOINT=...

10. Keeps the server alive.

Rustunnel

The project uses the managed Rustunnel service.

The free plan currently supports multiple concurrent tunnels and UDP, but it has a bandwidth limit. Check the current Rustunnel pricing before relying on it for long-running servers.

Dashboard

"index.html" is intended for GitHub Pages.

The dashboard should communicate with a secure backend that performs the GitHub API operations.

Do not put a GitHub personal access token directly inside "index.html".

Important limitations

GitHub-hosted runners are temporary.

The server is therefore not guaranteed to stay online permanently.

The workflow also has a maximum runtime.

This project is intended for testing and playing with friends rather than permanent commercial hosting.

Files

.github/workflows/main.yml
    GitHub Actions server workflow

index.html
    Web dashboard

README.md
    Project documentation

Map

Current default map:

City

Local server port

7777/UDP

License

This repository contains configuration and automation created for the server setup. L.A. Crimes itself remains the property of its respective creators.
