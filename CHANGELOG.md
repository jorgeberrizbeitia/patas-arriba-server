# Changelog

## 2026-05-03

### Vitest + Supertest integration test harness

- Introduced Vitest configuration (`vitest.config.js`) and a shared setup
  file (`tests/setup.js`) that loads `dotenv` and closes the Mongoose
  connection after the suite. `npm test` and `npm run test:watch` are
  wired to run the suite.
- Seeded the harness with two integration suites covering authentication
  middleware (`tests/middleware/auth.middleware.test.js`) and the auth
  route (`tests/routes/auth.routes.test.js`).
- Tests run against a real MongoDB instance (the devcontainer's `mongodb`
  service); `MONGODB_URI` should point at it.

### Attendance default flipped to "show"

- New attendees joining an event now default to `attendance: "show"` instead
  of `"pending"`. Organizers only have to record exceptions (no-shows,
  excused) rather than confirming every attendee individually.
- The `attendance` enum still accepts `["pending", "show", "no-show",
  "excused"]` for backward compatibility — historical records are unaffected
  and no data migration is performed.
- Added integration test (`tests/routes/attendee.routes.test.js`) pinning
  the new default at the HTTP boundary.
- See `specs/attendance-default.md` for the user story, acceptance scenarios,
  and functional requirements.
