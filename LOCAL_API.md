# Local SQLite API

The local frontend uses a Node.js API and a SQLite database at `data/kiptalent.sqlite`. Node.js 24 or newer is required because the API uses the built-in `node:sqlite` module. The database file is created automatically the first time the API starts.

Start the API and Vite frontend together with:

```sh
npm run dev
```

The frontend is served by Vite at `http://127.0.0.1:5173`; Vite forwards `/api` requests to the local API at `http://127.0.0.1:3001`.

## Routes

- `GET /api/health` — check that the API and SQLite are running.
- `GET /api/stats` — read live member, project, profile, and proposal totals for the landing page.
- `GET /api/preview` — view saved account names and email addresses in a local HTML table.
- `POST /api/auth/signup` — create an account and return a bearer session token.
- `POST /api/auth/login` — verify an account and return a bearer session token.
- `GET /api/auth/me` — return the current user (`Authorization: Bearer <token>`).
- `POST /api/auth/logout` — revoke the current session.
- `POST /api/auth/password-reset` — create a one-time reset token for an existing account. For local use, the token appears in the terminal running `npm run dev` and expires in 15 minutes.
- `PUT /api/auth/password` — update a password using that one-time reset token; all existing sessions are revoked.
- `GET /api/projects` — list open projects saved in SQLite, with their current proposal counts.
- `POST /api/projects` — create a project for the signed-in client. Requires a bearer token.
- `POST /api/projects/:id/proposals` — submit one proposal per signed-in freelancer and project. Requires a bearer token.
- `GET /api/projects/:id/proposals` — let a signed-in project owner review incoming proposals. Requires owner authorization.
- `GET /api/freelancers` — list public freelancer profiles saved in SQLite.
- `GET /api/profile` — read the signed-in user's freelancer profile. Requires a bearer token.
- `PUT /api/profile` — create or update the signed-in user's public freelancer profile. Requires a bearer token.

The six featured landing-page projects and freelancer profiles are seeded into SQLite at API startup. They use the same listing/profile routes as member content, and authenticated users can submit proposals to every open project. Featured project owners are system-only accounts and are excluded from the account preview and sign-in. Projects posted by signed-in members and profiles edited from the avatar menu are stored in the same database file. Payments/escrow and messaging are not connected to a payment or messaging provider.

Passwords are stored as salted scrypt hashes. Session and reset tokens are random and only their hashes are stored in SQLite. The API binds to localhost and is intended for local development. Reset tokens are printed to the local API terminal instead of being emailed; configure a mail provider and production safeguards before deploying this API.
