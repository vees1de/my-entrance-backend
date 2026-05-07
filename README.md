# Мой подъезд — Backend

NestJS + Prisma + Postgres backend for the cleaning-feedback app.

## Quick start

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

API: http://localhost:3000, Swagger: http://localhost:3000/api/docs

## Default credentials (after `npm run seed`)

- Manager: `manager / manager123`
- Cleaners: `cleaner1..cleaner5 / cleaner123`

## Endpoints (high-level)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/login` | public | returns JWT |
| POST | `/reviews` | public, multipart | resident review with optional photo (5/h per IP) |
| GET  | `/reviews` | manager | filters: rating, entranceId, cleanerId, dateFrom, dateTo, hasPhoto |
| POST | `/cleanings` | cleaner, multipart | photo proof; entrance must be in cleaner's assignments |
| GET  | `/cleanings/today` | cleaner/manager | manager may pass `?cleanerId=` |
| GET  | `/entrances` | any | list with assignments |
| POST | `/entrances` | manager | create |
| POST | `/entrances/:id/assignments` | manager | M2M assign cleaner |
| DELETE | `/entrances/:id/assignments/:cleanerId` | manager | unassign |
| GET  | `/cleaners` | manager | dashboard aggregate |
| GET  | `/metrics/day` | manager | day-level numbers |
| GET  | `/qr/:entranceId/:floor` | manager | preview PNG |
| POST | `/qr/generate` | manager | PDF for printing |
| GET  | `/health` | public | liveness probe |

## Storage

`LocalStorageService` saves images to `uploads/{folder}/{yyyy-mm-dd}/{uuid}.jpg`,
compressed via `sharp` (max 1920px, JPEG q80) and exposed at `${APP_URL}/static/...`.
The `IStorageService` interface lets you swap to S3 later by replacing one provider
in `StorageModule`.

## Notes on M2M cleaner↔entrance

Assignments are many-to-many. When a public review is created, a row in `ReviewCleaner`
is written for every cleaner currently assigned to that entrance — this snapshot makes
`/reviews?cleanerId=…` and `/cleaners.badReviewsToday` return correct counts even when
an entrance has multiple cleaners.
