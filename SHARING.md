# Open SwitchDesk on another PC

Both methods below serve the built website and API together on port 5174. They use the same SQLite database as your local backend. Visitors sign in with the same accounts. The original PC must remain awake and connected.

## Start the sharing server

Complete the backend setup and seed steps in README.md first. Then, from the frontend folder:

```powershell
npm.cmd run build
npm.cmd run share
```

Leave this terminal open. This combined server serves both the website and API; it does not require a separate port-8000 backend. Your development backend can continue running independently.

On Windows you can also double-click Share-LAN.cmd in the project folder. Do not start a second copy if the sharing server is already running.

## Same Wi-Fi or network

Find this PC's Wi-Fi IPv4 address using ipconfig. On the other PC, open http://YOUR-IP:5174, replacing YOUR-IP with that IPv4 address. Use the same network, not a guest network that isolates connected devices. Do not use localhost on the other PC: that name refers to the other PC itself.

If Windows asks whether Node.js or Python can communicate on the network, allow the sharing server on your private network. If connection fails, check the network profile and firewall access for port 5174; do not disable the firewall.

## Different networks / internet

In another terminal, from frontend:

```powershell
npm.cmd run share:internet
```

The launcher reuses the sharing server on port 5174 when reachable. Otherwise it starts a local copy on port 5175, using the same backend database. On Windows, the first run downloads the official cloudflared connector into the ignored .tools directory. It then prints an HTTPS address ending in trycloudflare.com. Share that exact address with the other PC. The connector forwards the website and /api through the same origin, so visitors do not need backend configuration or a separate API URL.

You can also double-click Share-Internet.cmd in the project folder. Run this launcher through normal Windows File Explorer or a normal terminal. The restricted Codex runtime may block a connector from reaching the local origin even when other PCs can already access the Wi-Fi address.

This is a temporary demonstration link: anyone with the address can reach the sign-in page, and the link stops when the connector closes. Restarting it generates a new address. The application still enforces its normal account and role permissions. Demo credentials remain deliberately visible in the demo UI.

Cloudflare Quick Tunnels need no account or domain. Documentation: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

For a permanent address that works when this PC is off, deploy the frontend and Python backend to hosted services; this temporary sharing mode does not provide independent hosting.

## After changing the website

Rebuild with npm.cmd run build, then refresh the other PC. The sharing server serves the production build, not live development source files. Keep .tools, .env, .dev-secret, and database files out of Git and submission archives.
