# SwitchDesk: interview walkthrough

## Why this idea

The challenge rewards a complete, understandable product. SwitchDesk solves a concrete problem: IT requests scattered across conversations, without a clear owner or history. The distinctive feature is the complete journey from reporting an issue to assigning, discussing, and resolving it, supported by self-service guides.

## A five-minute demonstration

1. Start with the sign-in screen. Explain the calm forest, ivory, and amber identity and the responsive navigation. Open the local demo section and sign in as administrator.
2. On Overview, explain that the totals and chart come from stored records. The chart covers seven UTC dates; resolution events count transitions from active to resolved/closed. Reopening and resolving again records another resolution event.
3. Open Tickets. Search for VPN, change priority and status filters, switch between list and board, and export the current result to CSV. The board is a view; open a card to change its status.
4. Create a ticket. Show required fields and priority guidance. Open the new ticket, assign a technician, add a comment, and resolve it. Open History to show who made each change and when. Return to Insights and point out the changed counts.
5. Sign out and sign in as employee. Show that employees see only their own tickets and cannot update status or view the staff directory. The backend enforces this, even when a caller bypasses the interface.
6. Open Knowledge base, search for access, and read a guide. Explain that articles are curated local content, while ticket records are stored in SQL.
7. Resize to mobile. Show the navigation drawer, touch targets, and ticket details.

## Explain the code in your own words

- `frontend/src/App.tsx`: workspace shell, session state, and navigation. `src/pages/` contains the sign-in, overview, tickets, knowledge, and insights pages. `src/components/` holds reusable UI and ticket dialogs; `src/utils.ts` contains role and date helpers. CSV export lives beside the ticket page, while API calls remain in a separate module.
- `frontend/src/api.ts`: typed JSON requests and the bearer token header. Network and validation errors become readable messages. A protected request returning 401 ends the local session.
- `backend/app/main.py`: REST endpoints and authorization. `current_user` handles authentication; `staff`, `visible_tickets`, and `ticket_or_404` enforce permissions.
- `backend/app/models.py`: users, tickets, comments, and append-only ticket events. Mutations and their event records are committed in the same transaction.
- `backend/app/schemas.py`: request and response validation. Trims ordinary text, keeps passwords exact, rejects whitespace-only text and invalid state changes, and excludes hashes from responses.
- `backend/app/security.py`: Argon2 password hashing and JWT signing/verification. The token contains user ID and expiry; permissions come from the current database role.
- `backend/tests/test_workflow.py`: isolated integration tests for registration, access isolation, staff updates, history, analytics, validation, and invalid sessions.

## Decisions and tradeoffs

SQLite makes local evaluation easy. SQLAlchemy allows a PostgreSQL connection later. Tables are created on startup for the demo; production schema changes should use migrations.

The JWT is held in sessionStorage. This is simple for a demonstration, but JavaScript can read it, and logout does not revoke a copied token. A public product should use a reviewed cookie/session strategy with server-side revocation, CSRF protections where applicable, HTTPS, rate limits, and account recovery.

History is append-only through the application API, not a tamper-proof audit system. The demo has no role-management screen, attachments, email delivery, or live updates. Knowledge articles are static curated content. Ticket lists load all visible tickets for simplicity; a larger deployment should add server pagination.

## Useful practice changes

- Add a new knowledge article and explain why no database migration is needed.
- Change the ticket priority default in the create-ticket form.
- Add a new field to a ticket, identifying the model, schema, API, and UI changes.
- Explain why hiding the Team navigation item is insufficient without a server-side permission check.
- Explain why a resolved-to-closed change must not be counted as a second resolution.

## Submission preparation

Push the complete source to your own GitHub repository. Keep `.env`, `.dev-secret`, databases, virtual environments, and node_modules out of Git. Add the two reviewers named in the original challenge using verified GitHub usernames. Do not assume an email address is a GitHub username. Test the README from a clean checkout, inspect the final changes, and rehearse this walkthrough yourself.

The PDF labels the deadline “Friday, 31 October 2026”; the numerical date falls on a Saturday. Confirm the intended deadline with the organizer if this affects submission timing.
