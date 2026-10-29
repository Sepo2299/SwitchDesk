# Hosting SwitchDesk

The Docker image serves the React build and FastAPI API from one address. PostgreSQL stores account and ticket data separately from the web service.

## Render deployment

The repository includes render.yaml with a web service and PostgreSQL database on Render's free plans.

1. Open https://render.com/deploy?repo=https://github.com/Sepo2299/SwitchDesk and sign in to Render.
2. Review the Blueprint. The web service and database should both use the Free plan.
3. Deploy the Blueprint and wait for the web service health check to pass.
4. Open the HTTPS address shown by Render.

The build compiles the frontend and installs the Python dependencies. The service listens on Render's assigned PORT and exposes /api/health for health checks.

## First sign-in

The Blueprint creates a random signing key and a random administrator password in the service environment.

- Email: admin@switchdesk.local
- Password: the BOOTSTRAP_ADMIN_PASSWORD value in the Render service's environment settings

The first administrator is created on an empty database. Restarting the service does not reset an existing administrator's password. Public registration continues to create employee accounts only. Local demo account shortcuts are excluded from the hosted frontend build.

The hosted database starts separately from the local SQLite database. Local test accounts, tickets, and signing keys are not uploaded.

## Settings

| Variable | Purpose |
| --- | --- |
| APP_ENV | Set to production. |
| DATABASE_URL | Managed PostgreSQL connection string. |
| SECRET_KEY | Random signing secret, at least 32 characters. |
| BOOTSTRAP_ADMIN_EMAIL | Initial administrator's sign-in email. |
| BOOTSTRAP_ADMIN_PASSWORD | Initial administrator's private password, at least 12 characters. |
| PORT | Port assigned by the host. |

The frontend uses the same origin as the API, so a separate VITE_API_URL is not required for this deployment.

## Free-plan limits

Render's free web service can sleep after inactivity and take about a minute to wake. Its free PostgreSQL database expires after 30 days. These plans suit a short demonstration; choose a suitable database plan before the expiry date for longer-term use.

Reference: https://render.com/docs/free

## Other Docker hosts

Build the image from the repository root:

```sh
docker build -t switchdesk .
```

Provide the environment values listed above, connect a PostgreSQL database, and route the host's HTTPS address to the configured PORT. Environment files, local databases, installed dependencies, and development keys are excluded from the image.
