# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Patas Arriba Server is the Node.js/Express API backend for the Fundación Patas Arriba volunteer coordination platform. It handles authentication, event management, car group coordination, messaging, and push notifications.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with nodemon hot reload)
npm run dev

# Start production server
npm start

# Generate VAPID keys for push notifications
npm run generate-vapid-keys
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Required variables: `ORIGIN`, `TOKEN_SECRET`, `MONGODB_URI` (defaults to `mongodb://127.0.0.1:27017/patas-arriba`)
3. Optional: `EMAIL`, `EMAIL_PASSWORD` (Brevo), `CLOUDINARY_*`, `PUSH_*` (VAPID)

## Architecture Overview

### Tech Stack
- **Framework**: Express 4 (CommonJS modules)
- **Database**: MongoDB via Mongoose ODM
- **Auth**: JWT (Bearer tokens in Authorization header)
- **Real-time**: Socket.io
- **Push Notifications**: web-push with VAPID
- **Email**: Brevo (formerly Sendinblue)
- **File Storage**: Cloudinary
- **Deployment**: Fly.io with Docker, GitHub Actions CI/CD

### API Routes (all under `/api`)
- `/api/auth` — signup, login, verify (public)
- `/api/user` — profile management (authenticated)
- `/api/event` — CRUD for events (authenticated)
- `/api/attendee` — event attendance (authenticated)
- `/api/car-group` — carpool coordination (authenticated)
- `/api/message` — user messaging (authenticated)
- `/api/pushsubscription` — push notification subscriptions (authenticated)

### Data Models
- **User** — email, username, hashed password, role (user/organizer/admin)
- **Event** — title, location, date, category, status (open/closed/cancelled), owner
- **Attendee** — links users to events
- **CarGroup** — carpool groups for events
- **Message** — user-to-user messaging
- **Notification** — push notification records
- **PushSubscription** — web push endpoints

### Key Patterns
- Middleware-based auth: `isAuthenticated`, `isAdmin`, `isOrganizerOrAdmin`
- Entry point: `server.js` (HTTP + Socket.io) requires `app.js` (Express config)
- Config in `config/index.js` (CORS, morgan logger, body parsing)
- DB connection in `db/index.js`
- Error handling in `error-handling/index.js`

### User Roles
- **user** — regular volunteer
- **organizer** — can create/manage events
- **admin** — full platform access

## Important Notes

- Server listens on PORT 5005 by default
- CORS origin must match the client URL
- Socket.io is used for real-time event updates
- The production Dockerfile uses Node 18 (needs updating to 24)
