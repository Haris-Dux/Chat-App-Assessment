# Concierge

AI-assisted appointment booking for a small clinic. A customer writes something like "follow-up next Tuesday around 3pm". The assistant picks out the service, day and time, checks availability, and fills in a booking ticket next to the chat. Nothing is booked until the customer confirms the ticket. If the AI can't help, the same ticket works as a normal form.

![Homepage](docs/screenshots/homepage.png)

Demo login: `demo@lumenphysio.test` / `demo12345`

## Stack

- **Frontend:** React 19, Vite, TanStack Router and Query, Tailwind CSS, Motion, Socket.IO client
- **Backend:** NestJS 12, Drizzle ORM, Socket.IO, Zod, Pino
- **Database:** PostgreSQL 17
- **AI:** Mistral (`ministral-8b-latest`)

It's a pnpm workspace:

```
apps/api             NestJS API
apps/web             React app
packages/contracts   Zod schemas and types shared by both
docs/database.md     Schema, indexes and performance notes
```

## Running locally

Start by creating the API's env file. Set `JWT_SECRET` and `MISTRAL_API_KEY` in it (see [Environment variables](#environment-variables)):

```bash
cp apps/api/.env.example apps/api/.env
```

### With Docker

```bash
docker compose up -d --build
docker compose exec api node dist/database/tasks.js seed
```

Open http://localhost:7080.

### Without Docker

You need:

- Node 22.12+
- pnpm (`corepack enable`)
- PostgreSQL 15+ running locally

Create the database first. The values match the default `DATABASE_URL`.

```bash
sudo -u postgres psql -c "CREATE USER concierge WITH PASSWORD 'concierge'"
sudo -u postgres psql -c "CREATE DATABASE concierge OWNER concierge"
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

The web app runs on http://localhost:5173 and the API on port 3000. Vite proxies `/api` and `/socket.io`, so both share one origin. If you'd rather not install PostgreSQL, `docker compose up -d db` starts just the database on port 7432; point `DATABASE_URL` at `localhost:7432`.

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

Without a `MISTRAL_API_KEY` the app still works, but every message falls back to the ticket form.

### Environment variables

Set these in `apps/api/.env`:

| Variable             | Default                                                   | Purpose                                                    |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`       | `postgres://concierge:concierge@localhost:5432/concierge` | PostgreSQL connection. Docker Compose overrides it.        |
| `JWT_SECRET`         | none                                                      | At least 32 characters; used to sign sessions              |
| `JWT_TTL_SECONDS`    | `28800`                                                   | Session length (8 hours)                                   |
| `COOKIE_SECURE`      | `false`                                                   | Set to `true` behind HTTPS                                 |
| `MISTRAL_API_KEY`    | empty                                                     | Mistral API key                                            |
| `MISTRAL_MODEL`      | `ministral-8b-latest`                                     | Model used for chat interpretation                         |
| `MISTRAL_TIMEOUT_MS` | `15000`                                                   | Timeout for one AI call                                    |
| `NODE_ENV`           | `development`                                             | `production` disables pretty logs. Docker Compose sets it. |
| `PORT`, `LOG_LEVEL`  | `3000`, `info`                                            |                                                            |

The web app reads `VITE_BUSINESS_SLUG` from `apps/web/.env`. It is already set to the seeded business.

## Architecture

```
Browser ── REST /api ─────────▶ nginx ──▶ NestJS API ──▶ PostgreSQL
   ▲                                          │
   └──────── Socket.IO /socket.io ◀───────────┤
                                              └──▶ Mistral API
```

- The API has six modules: auth, businesses, appointments, chat, ai and realtime. Each follows controller → service → repository, and only repositories touch the database.
- Modules talk through events. For example, `appointments` emits `appointment.saved`. `chat` then posts the "you're booked" message, and the realtime gateway pushes the change to the user's open tabs.
- Sending a message returns `202` as soon as it's saved. The reply is produced in the background and pushed over the socket, so a slow LLM never blocks the UI.
- The web app doesn't cache queries (`staleTime` and `gcTime` are 0, and every screen refetches on mount). Socket events update whatever screen is open.
- Messages, new conversations, bookings and cancellations show up immediately and are rolled back if the request fails.

## How the AI is used

The model only interprets; the server decides.

1. On each turn the model receives:
   - the business hours and service list;
   - today's date;
   - the booking draft so far;
   - the last 12 messages.

   It returns JSON: intent, service, date, time, notes, the phrases it matched, and a short reply.

2. The output is validated with Zod. Unknown service ids and malformed values are dropped.
3. `BookingFlow` is plain code. It merges the draft, checks opening hours and clashes, and suggests nearby free times. It writes every message about availability itself; the model's text is only used to ask for missing details.
4. A booking only happens when the customer confirms the ticket, which goes through the normal `POST /appointments` validation.
5. The ticket switches to form mode, keeping whatever was understood, when:
   - the call fails, times out or returns bad JSON;
   - the request is ambiguous;
   - two turns pass without progress.
6. Every call is logged to the `ai_interactions` table with the prompt, response, status, latency and token counts.

## API

All routes are under `/api`. Errors share one shape: `{ statusCode, error, message, details? }`.

| Method   | Path                                        | Notes                                                    |
| -------- | ------------------------------------------- | -------------------------------------------------------- |
| POST     | `/auth/signup`, `/auth/login`               | Sets an httpOnly session cookie. 10 requests per minute. |
| POST     | `/auth/logout`                              |                                                          |
| GET      | `/auth/me`                                  |                                                          |
| GET      | `/businesses/:slug`                         | Public. Opening hours and services.                      |
| GET      | `/appointments?scope=upcoming\|history`     |                                                          |
| GET      | `/appointments/availability?serviceId&date` | Free start times for a day                               |
| POST     | `/appointments`                             | 409 if the slot is taken, 422 if closed or in the past   |
| POST     | `/appointments/:id/cancel`                  |                                                          |
| GET/POST | `/chat/sessions`                            | List or create conversations                             |
| GET      | `/chat/sessions/:id`                        | Messages plus a `replying` flag                          |
| POST     | `/chat/sessions/:id/messages`               | Returns 202. 20 requests per minute.                     |

Socket events: `message:upserted`, `session:updated`, `assistant:status`, `appointment:upserted`.

Requests go through:

- Zod validation pipes;
- pino-http request logging;
- rate limiting, 120 requests per minute by default;
- helmet security headers;
- a global exception filter.

## Database

The schema has seven tables: `businesses`, `users`, `services`, `appointments`, `chat_sessions`, `chat_messages` and `ai_interactions`. Every tenant-owned table has a `business_id`.

An exclusion constraint on `appointments` stops two confirmed bookings from overlapping, even when requests race. The API turns a violation into a 409.

The DDL is in `apps/api/database/migrations`, and sample inserts are in `apps/api/database/seed.sql`. Indexing and performance notes are in [docs/database.md](docs/database.md).

## Decisions and tradeoffs

- **REST for commands, sockets for updates.** Commands get proper validation, status codes and rate limits. The socket carries replies and keeps tabs in sync.
- **JWT in an httpOnly cookie.** Scripts can't read it, and the socket handshake reuses it. The catch is that the app and API must share one origin, which nginx (or the Vite proxy) provides. There are no refresh tokens; a session lasts 8 hours.
- **The browser generates ids for messages, conversations and bookings.** Optimistic updates need no id swapping, and retries can't create duplicates.
- **The database prevents double-booking,** with a constraint rather than locks in the app.
- **Booking details are stored as a draft on the conversation,** instead of relying on the model to remember them.
- **Drizzle with plain SQL migrations.** The schema stays reviewable SQL, and Postgres error codes come through directly.

## Assumptions and limitations

- One business is seeded, and it has a single provider, so its appointments can't overlap.
- Times are in the business timezone (`Asia/Karachi`). Slots start every 30 minutes and must end by closing time.
- The homepage is public; chat and booking need an account. The assistant answers every conversation, and bookings are confirmed automatically.
- There is no admin side, rescheduling (you cancel and rebook), password reset or refresh token.
- It runs as a single instance: the reply queue and socket rooms live in memory. Scaling out would need the Socket.IO Redis adapter and a job queue.
- Free slots aren't pushed when other customers book. They refresh on load and when a booking is rejected with 409.
- Unit tests cover availability, the booking flow and the AI boundary. There are no browser end-to-end tests.

## Deployment

- **Server:** an AWS EC2 instance running the Docker Compose stack: Postgres, the API, and an nginx container that serves the frontend.
- **Domain and HTTPS:** nginx on the host maps the domain to the web container and handles HTTPS with Let's Encrypt.
- **Config:** set `COOKIE_SECURE=true` in `apps/api/.env` when serving over HTTPS.
