# SwitchDesk Enterprise

SwitchDesk is an IT helpdesk and ticket management website. It gives employees a clear way to report technical problems and helps support staff organise, assign, and resolve requests.

The application keeps each ticket, its discussion, and its change history in one place. A knowledge base provides guidance for common IT problems, while the dashboard shows the current support workload.

## Features

- **Dashboard:** View ticket totals, open requests, work in progress, and recent activity.
- **Ticket management:** Create requests, assign support staff, and update ticket status and priority.
- **Search and filters:** Find tickets by subject, description, ticket ID, reporter, or assignee. Filter by status and priority.
- **List and board views:** View requests in a table or grouped by their current status.
- **Discussion and history:** Add comments and see who changed a ticket and when.
- **Knowledge base:** Search practical guides for common network, software, hardware, and access issues.
- **Insights:** View ticket categories, priorities, resolution rate, and seven days of recorded activity.
- **CSV export:** Download the tickets shown by the current filters.
- **Responsive navigation:** Use the site on desktop or mobile and open or close the sidebar.

## User roles

| Role | Access |
| --- | --- |
| Employee | Create tickets, view their own requests, and comment on their own tickets. |
| Technician | View all tickets, manage status and priority, assign staff, and access the team directory. |
| Administrator | Access the same support management features as technicians. |

New registrations receive the employee role. Permissions are checked by the API as well as reflected in the interface.

## Technologies

| Area | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, CSS |
| Charts and icons | Recharts, Lucide |
| Backend | Python, FastAPI, Pydantic |
| Database | SQLite, SQLAlchemy; optional PostgreSQL support |
| Authentication | Argon2 password hashing, JWT bearer tokens |
| Testing | pytest, HTTPX, FastAPI TestClient |
| Automated checks | GitHub Actions |

## Requirements

- Git
- Python 3.11 or later
- Node.js 20.19+ or 22+ and npm

SQLite is used by default, so a separate database installation is not required for local use.

## Installation

### 1. Clone the repository

~~~powershell
git clone https://github.com/Sepo2299/SwitchDesk.git
cd SwitchDesk
~~~

### 2. Set up and start the backend

Run these commands from the project folder:

~~~powershell
cd backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe seed.py
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
~~~

The seed command creates sample accounts and adds sample tickets to an empty database. Existing accounts, passwords, and tickets are preserved when it is run again.

Keep this terminal open.

### 3. Start the frontend

Open a second terminal in the project folder:

~~~powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
~~~

Open **http://127.0.0.1:5173** in a browser.

The frontend forwards local API requests to the backend on port 8000. Both terminals must remain running.

On macOS or Linux, use python3 instead of py, .venv/bin/python instead of .venv\Scripts\python.exe, cp instead of Copy-Item, and npm instead of npm.cmd.

## Sample accounts

After running the seed command, sign in with one of these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@switchdesk.local | Admin123! |
| Technician | tech@switchdesk.local | Tech12345! |
| Employee | employee@switchdesk.local | Employee123! |

The sign-in screen also has a local demo section that fills these credentials. These accounts are for testing and demonstrations.

## Configuration

Backend settings are read from backend/.env.

| Setting | Purpose |
| --- | --- |
| DATABASE_URL | Database connection string. Defaults to sqlite:///./switchdesk.db. |
| SECRET_KEY | Secret used to sign authentication tokens. |
| APP_ENV | Application environment: development or production. |
| CORS_ORIGINS | Comma-separated frontend origins allowed to call the API directly. |

For local development, leaving SECRET_KEY empty generates a private key in backend/.dev-secret. For production, set APP_ENV to production and provide a random SECRET_KEY of at least 32 characters.

To use PostgreSQL, set DATABASE_URL to a PostgreSQL connection string using the postgresql+psycopg driver. To use a separately hosted backend, set VITE_API_URL in frontend/.env and restart the frontend.

Environment files, signing keys, databases, and installed dependency folders are excluded from Git.

## Access from another PC

Build the frontend, then start the combined website and API server:

~~~powershell
cd frontend
npm.cmd run build
npm.cmd run share
~~~

On another PC connected to the same network, open http://YOUR-IP:5174 using the host PC's IPv4 address. On Windows, ipconfig shows this address.

Share-LAN.cmd provides the same startup option from the project folder. Share-Internet.cmd creates a temporary HTTPS link for access from another network. The host PC and sharing processes must remain running.

See [SHARING.md](SHARING.md) for the full instructions.

## Tests and build

Run the backend tests from the backend folder:

~~~powershell
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.venv\Scripts\python.exe -m pytest -q
~~~

The tests cover registration, password hashing, login tokens, ticket ownership, staff permissions, assignment, comments, history, analytics, and input validation. They use an isolated in-memory database.

Build the frontend from the frontend folder:

~~~powershell
npm.cmd run build
~~~

This checks TypeScript and creates the production files in frontend/dist. GitHub Actions runs the frontend build and backend tests on pushes and pull requests.

## Project structure

~~~text
SwitchDesk/
  backend/
    app/
      database.py       Database connection and sessions
      main.py           API routes and permissions
      models.py         Users, tickets, comments, and ticket history
      schemas.py        Request and response validation
      security.py       Password hashing and authentication
    tests/              Backend integration tests
    seed.py             Sample accounts and tickets
    serve.py            Combined website and API server
    requirements.txt    Backend dependencies
  frontend/
    public/             Static assets
    scripts/            Sharing commands
    src/
      components/       Shared interface and ticket dialogs
      pages/            Application pages
      App.tsx           Navigation and application state
      api.ts            API client and TypeScript types
      style.css         Responsive styles
  Share-LAN.cmd
  Share-Internet.cmd
  SHARING.md
~~~

## API documentation

With the backend running, open **http://127.0.0.1:8000/docs** for the interactive API documentation.

The health endpoint is **http://127.0.0.1:8000/api/health**. If the sign-in screen cannot reach the server, check that the backend is running and that this endpoint returns a status of ok.
