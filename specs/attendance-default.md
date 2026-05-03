# Attendance defaults to "show" on sign-up

## User Story

As an event organizer, when a volunteer signs up for one of my events, I want
the system to assume they will attend by default, so that I only have to record
exceptions (no-shows, excused absences) instead of confirming every single
attendee one by one.

## Why this matters

The previous default of `"pending"` meant the organizer had to touch every
attendee record after the event to mark attendance, which is slow enough at
real-world event sizes that the organizer maintains a parallel Excel sheet.
Flipping the default makes the platform's data trustworthy without per-attendee
clicks: the common case (the volunteer showed up) requires no action.

## Acceptance Scenarios

### Scenario 1 — New sign-up gets `show` by default

Given an open event,
When an authenticated user POSTs to `/api/attendee/:eventId` to join,
Then the created Attendee document has `attendance: "show"`.

### Scenario 2 — Organizer can still mark a no-show

Given an attendee with `attendance: "show"` (the new default),
When an organizer or admin PATCHes `/api/attendee/:attendeeId/attendance` with
  `{ attendance: "no-show" }`,
Then the document is updated and the response is 202.

### Scenario 3 — Historical "pending" records remain valid

Given an Attendee document persisted before this change with
  `attendance: "pending"`,
When the document is read back from the database,
Then validation passes (the enum still includes `"pending"`).

## Functional Requirements

- **FR-1**: The `Attendee.attendance` schema field MUST default to `"show"`.
- **FR-2**: The `Attendee.attendance` enum MUST continue to accept the four
  values `["pending", "show", "no-show", "excused"]` so historical records
  remain readable and the existing PATCH endpoint keeps working unchanged.
- **FR-3**: No data migration is performed. Records created before this
  change keep whatever `attendance` value they already had.

## Out of scope

- Removing `"pending"` from the enum (would break historical data).
- Any change to the PATCH `/api/attendee/:attendeeId/attendance` handler.
- Any change to the dropdown of statuses available to organizers (still four
  options on the client, including Pendiente for legacy records).
