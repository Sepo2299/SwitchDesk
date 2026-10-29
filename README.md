# SwitchDesk Enterprise

**A little less chaos. A lot more clarity.**

Source repository: https://github.com/Sepo2299/SwitchDesk

SwitchDesk is a full-stack IT service desk for teams whose support requests need a clear owner, conversation, and resolution. Employees report issues and track their own requests. Technicians and administrators triage the shared queue, assign work, and record progress.

## What makes it useful

- Six navigable sections: Overview, Tickets, Knowledge base, Insights, Team members (staff only), and Account settings.
- Responsive forest-green, ivory, and amber interface with keyboard-accessible dialogs, a collapsible desktop sidebar, and mobile navigation. Use the sidebar icon beside the page breadcrumb to open or close navigation; the mobile drawer also closes with Escape or a tap outside it.
- Email/password registration and sign-in; Argon2 password hashes and twelve-hour JWT bearer sessions.
- Search by title, description, ticket ID, reporter, or assignee; status and priority filters; list and board views.
- Global ticket search with Ctrl/Cmd+K, and CSV export of the current filtered results.
- Ticket creation, staff assignment, status/priority changes, and persistent discussion.
- Ticket history records the actor, change, and timestamp in the same transaction as each mutation.
- Actual database analytics: status, category, priority, resolution rate, unassigned active tickets, and seven days of creation/resolution activity.
- Six searchable, curated help articles with an escalation path to a new support ticket.
- Meaningful validation, readable network/API errors, retry controls, and local session expiry handling.

## Technologies

| Layer | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Lucide, Recharts, CSS |
| Backend | Python 3.11+, FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite for local evaluation; PostgreSQL via DATABASE_URL |
| Authentication | pwdlib/Argon2, PyJWT/HS256 |
| Tests | pytest, HTTPX, FastAPI TestClient |

## Run on Windows

Requirements: Python 3.11+ and Node.js 20.19+ or 22+. Use two terminals. No cloud accounts or paid services are required.

### Get the source

~~~powershell
git clone https://github.com/Sepo2299/SwitchDesk.git
cd SwitchDesk
~~~

### Backend

From this project's root:

~~~powershell
cd backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe seed.py
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
~~~

API health: http://127.0.0.1:8000/api/health

Interactive API documentation: http://127.0.0.1:8000/docs

A private development signing key is generated in backend/.dev-secret if SECRET_KEY is empty. This file is ignored by Git. It keeps local sessions valid between restarts. In production, APP_ENV=production requires an explicitly configured random SECRET_KEY of at least 32 characters.

### Frontend

In terminal two, from the project root:

~~~powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
~~~

Open http://127.0.0.1:5173. Local development and Vite preview forward /api requests to http://127.0.0.1:8000, so opening the frontend through localhost or 127.0.0.1 works. Keep the backend terminal running while using the website. To connect to a separately hosted backend, copy frontend/.env.example to frontend/.env, set VITE_API_URL, and restart Vite. When using that override, backend CORS_ORIGINS must include the frontend's exact origin. Open the port printed by Vite.

If PowerShell blocks npm.ps1, use npm.cmd instead of npm; no execution-policy changes are needed. After changing vite.config.ts or frontend/.env, restart the frontend and refresh the browser.

If sign-in reports that the support server cannot be reached, open http://127.0.0.1:8000/api/health. It should return {"status":"ok"}. Start the backend terminal above if it does not. Then check http://127.0.0.1:5173/api/health to verify the frontend proxy; if that fails, restart Vite. Leave VITE_API_URL empty for the local setup.

On macOS/Linux, use python3 -m venv .venv, .venv/bin/python, and cp .env.example .env instead. Frontend commands are the same.

## Local demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@switchdesk.local | Admin123! |
| Technician | tech@switchdesk.local | Tech12345! |
| Employee | employee@switchdesk.local | Employee123! |
| Employee | sam@switchdesk.local | Employee123! |
| Technician | mia@switchdesk.local | Tech12345! |

Open “Exploring the local demo?” on the sign-in screen to fill a role's credentials. These are deliberately public local demo accounts. Demo seeding is disabled when APP_ENV=production. Never deploy demo accounts publicly.

seed.py creates missing demo users, preserves existing passwords and records, and adds twelve sample tickets only to a completely empty users-and-tickets database. Sample timestamps are relative to the first seed run. Charts query those stored records; they do not display invented weekly numbers. Existing imported tickets get a clearly labeled creation entry; earlier changes cannot be reconstructed.

## Validation and tests

~~~powershell
cd backend
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.venv\Scripts\python.exe -m pytest -q
~~~

Tests use an isolated in-memory database, not your local demo data. They cover forced employee registration, hashed passwords, duplicate accounts, employee ownership across tickets/comments/history/analytics, staff assignment and resolution, prevention of duplicate resolution counts, invalid updates, whitespace validation, and missing/forged/expired JWTs.

~~~powershell
cd frontend
npm run build
~~~

The build runs TypeScript checking and writes frontend/dist. For a local production-build preview, run npm run preview -- --host 127.0.0.1 while keeping the backend running and adding http://127.0.0.1:4173 to CORS_ORIGINS.

## Request flow and permissions

React calls frontend/src/api.ts, which sends JSON to FastAPI and attaches Authorization: Bearer after login. current_user verifies the signature and required token claims, loads the user from SQL, and returns the user's current role. Each endpoint then checks staff permissions or ticket ownership before accessing records.

Employees create requests and see/comment on their own tickets. Technicians and administrators see all tickets, manage assignment/status/priority, and access the team directory. Public registration always sets employee on the server. Ticket history and analytics follow the same ownership restrictions. Unknown or inaccessible tickets return 404.

The browser stores the token in sessionStorage. Logout clears the token and interface state. Tokens are signed, not encrypted; they contain a user ID, issue time, and expiry. No password or role is embedded. No raw password is stored in SQL or returned by the API.

## Analytics definitions

- Resolution rate: tickets currently Resolved or Closed divided by all visible tickets.
- Created series: tickets whose creation date falls on each of the last seven UTC dates.
- Resolved series: recorded transitions from Open/In Progress into Resolved/Closed. Resolved → Closed does not add a second event. Reopening and resolving again does add a new event, so this measures resolution activity rather than unique tickets.
- Unassigned: active tickets with no assignee.

Dates in ticket details use the visitor's local timezone; chart date buckets use UTC. Demo data is identified here and is stored in the database. Knowledge articles are curated static content and require no third-party API.

## Project map

~~~text
backend/
  app/main.py           REST endpoints, authorization, analytics
  app/security.py       Password hashing and JWTs
  app/models.py         Users, tickets, comments, ticket events
  app/schemas.py        Input validation and public responses
  app/database.py       Environment loading and SQL sessions
  tests/test_workflow.py Integration coverage
  seed.py               Optional local demo fixtures
frontend/
  src/App.tsx           Workspace shell, session state, navigation
  src/pages/            Overview, tickets, knowledge, insights, sign-in
  src/components/       Shared UI and ticket dialogs
  src/utils.ts          Ticket labels, dates, and role helpers
  src/api.ts            Types and API client
  src/style.css         Responsive visual system
  public/favicon.svg    Brand asset
DEMO_GUIDE.md            Interview walkthrough and implementation notes
VERIFICATION.md          Checks performed for this delivery
~~~

## Scope and deployment

This is a local-first internship submission with a real Python server and SQL database. A static frontend deployment alone cannot run the backend. For hosting, deploy FastAPI on a Python-capable service and the built frontend on a static host; configure HTTPS, VITE_API_URL, DATABASE_URL, SECRET_KEY, APP_ENV, and CORS_ORIGINS. PostgreSQL uses postgresql+psycopg://... in DATABASE_URL.

Production follow-ups include migrations, rate limiting, account recovery, reviewed secure cookie/session handling with revocation, audit retention, pagination, and automated UI tests. sessionStorage is accessible to JavaScript, and logout does not revoke a copied JWT. There is no attachment upload, email notification service, drag-and-drop board, account editing, or live socket update. Staff roles are managed outside the public application. These boundaries keep the demonstration understandable and complete.

## Challenge and submission

To open the site on another PC, see SHARING.md. Share-LAN.cmd starts a combined website/API server for your Wi-Fi network. With that server running, Share-Internet.cmd creates a temporary HTTPS demo link for PCs on other networks.

The supplied challenge asks for at least three sections, clear navigation, meaningful interaction, a usable responsive design, validation/error handling, a complete GitHub project, and installation instructions. This project addresses each through its core support workflow. See DEMO_GUIDE.md for a five-minute presentation and practice questions.

The project is maintained in Sepo2299/SwitchDesk. Add the challenge reviewers (erich@goldenswitchtech.com and quincy@goldenswitchtech.com) using their verified GitHub usernames; an email address alone is not a verified GitHub account. Check that they can access the repository, and test these instructions from a clean checkout. The challenge allows AI assistance but requires you to understand and explain your submission.
