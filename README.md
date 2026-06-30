# Smart Cashless Self-Service Carwash System

Replaces coin-operated self-service carwash machines with QR-based digital payments.
A customer scans a bay's QR code, picks a service + duration, pays (simulated GCash for
the MVP), and receives a one-time activation token that the backend validates to "run"
the machine. Machine activation is **simulated with timers** in the MVP; the same API
is designed for ESP32/relay hardware later.

## Tech stack
- **Frontend:** HTML5, CSS3, JS (ES Modules), EJS views
- **Backend:** Node.js + Express (ES Modules, `"type": "module"`)
- **Database:** PostgreSQL (Neon)
- **Auth:** Passport.js + express-session (admin/technician only)
- **Deploy:** Render

## Architecture (MVC + service layer)
```
src/
  config/       env, db pool, session store, passport strategy
  controllers/  thin: parse request -> call service -> shape response
  middleware/   security, rate limiting, auth guards, 404, error handler
  models/       the ONLY layer that writes SQL
  routes/       URL -> controller wiring (no logic)
  services/     business logic lives here
  utils/        ApiError, asyncHandler, logger
  validators/   express-validator chains (added per feature)
  views/        EJS templates
  public/       css / js / images
  app.js        builds the Express app (middleware + routes)
  server.js     boots: verify DB, listen, graceful shutdown
database/
  schema.sql    full schema + seed data
```
**Request flow:** route -> middleware -> controller -> service -> model -> DB.
Controllers never contain business logic; models never contain business logic;
routes never contain either. This keeps each layer independently testable.

## Getting started
1. `npm install`
2. `cp .env.example .env` and fill in `DATABASE_URL` (Neon) + a strong `SESSION_SECRET`.
3. Load the schema into Neon:
   `psql "$DATABASE_URL" -f database/schema.sql`
4. `npm run dev` (auto-restart) or `npm start`.
5. Visit `http://localhost:3000` and `http://localhost:3000/health`.

## Notes
- **Customers are anonymous in the MVP** — no login. Optional `customer_reference`
  (phone/device id) on `transactions` supports "history" without accounts. Adding real
  customer accounts later is additive (extend the `role` check + add routes).
- `bcrypt` is a native module. If a deploy target struggles to build it, swap to
  `bcryptjs` (drop-in, pure JS) — only `services/authService.js` imports it.
- Activation/payment/machine endpoints are intentionally transport-agnostic so a future
  ESP32 can call the same routes without a refactor.

## Roadmap
- [x] Scaffold + database schema
- [x] Customer flow: QR -> service -> duration -> price -> simulated payment -> token
- [ ] Machine simulation (idle -> running -> finished via timers)
- [ ] Admin auth + dashboard (revenue, transactions, machines, logs, pricing)
- [ ] Reports & analytics
- [ ] ESP32 hardware integration
