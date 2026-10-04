# TaskFlow ✅

A To-Do app for Android with user accounts, made of two parts:

- **mobile/**: the app, built with React Native, Expo SDK 57 and TypeScript. It uses Expo Router for navigation and Redux Toolkit for state.
- **backend/**: a REST API built with Node.js, Express 5 and TypeScript. Tasks are stored in MongoDB through Mongoose. Logins use JWT tokens, and passwords are hashed with bcrypt.

The app uses a dark theme with violet-to-pink gradients and glowing background shapes.

---

## Features

### Core requirements
| Requirement | Where |
|---|---|
| Register with email + password | `mobile/src/app/register.tsx` → `POST /api/auth/register` |
| Log in | `mobile/src/app/login.tsx` → `POST /api/auth/login` |
| Add task with **title, description, date-time, deadline, priority** | `mobile/src/app/task-form.tsx` → `POST /api/tasks` |
| Mark completed | Tap the checkbox (optimistic update) → `PATCH /api/tasks/:id/toggle` |
| Delete | Trash icon, or the detail screen → `DELETE /api/tasks/:id` |
| List tasks with status | Home screen, with All / Active / Done tabs, an overdue indicator and an urgency bar |
| Node.js + MongoDB backend | `backend/` |
| State management | Redux Toolkit (`mobile/src/store/`) |

### Bonus features
- **Smart sort algorithm** that combines deadline, priority and scheduled time into one urgency score (explained below).
- **Five sort modes:** Smart, Deadline, Priority, Schedule, Newest.
- **Due dates and deadlines:** overdue tasks are highlighted, and times read as "in 3h" or "2d overdue". The form has one-tap deadline shortcuts (+1h, +3h, end of day, +1 day, +1 week).
- **Edit tasks:** the same form is used for creating and editing.
- **Undo delete:** a snackbar with an UNDO button appears after each delete.
- **Search** in task titles and descriptions, plus **category filters** (Personal, Work, Study, Health, Other).
- **Dashboard:** greeting, an animated progress bar and counts for done, due today and overdue.
- **Task detail screen:** a timeline (scheduled → deadline → completed) and a breakdown of the urgency score, so the user can see why a task is ranked where it is.
- **Profile screen:** statistics, a breakdown of open tasks by priority, completion rate and logout.
- **Session persistence:** the token is stored encrypted with `expo-secure-store`, and the session is restored when the app opens. An expired token logs the user out automatically.
- **Password strength meter** and inline validation on every form.
- **Haptic feedback**, pull-to-refresh, an animated checkbox and an animated progress bar.

---

## The smart sort algorithm

`mobile/src/utils/smartSort.ts`

Sorting by a single field gives poor results. A *low*-priority task due in 20 minutes is more urgent than a *high*-priority task due next month. But a *high* task due tomorrow should still come before a *low* task due tomorrow. So each open task gets a score:

```
score = 0.50 · deadlinePressure + 0.30 · priorityWeight + 0.20 · schedulePressure

deadlinePressure = 1 / (1 + hoursLeft / 24)      → 1.0 due now, 0.5 in 24h, 0.125 in a week
                   overdue: 1 + up to 0.5 bonus   (grows over the first 48h overdue)
priorityWeight   = high 1.0 · medium 0.6 · low 0.25
schedulePressure = 1 once the planned time has passed, else 1 / (1 + hoursUntil / 12)
```

- Completed tasks always go to the bottom of the list.
- Ties are broken by the earlier deadline, then by creation time.
- Scores are computed once per sort, in O(n), rather than inside the comparator.
- The home screen re-ranks the list every minute, so the order stays correct as deadlines get closer.
- Each card's urgency bar and the score breakdown on the detail screen both come from this same function.

---

## Project structure

```
taskflow/
├── backend/
│   └── src/
│       ├── server.ts         # entry: connect DB → listen
│       ├── app.ts            # express app, middleware, routes
│       ├── config/           # env validation, Mongo connection
│       ├── models/           # User (bcrypt hook), Task
│       ├── validators/       # zod schemas for every request body
│       ├── middleware/       # requireAuth (JWT), validateBody, error handler
│       ├── controllers/      # auth + task handlers
│       ├── routes/
│       └── utils/            # ApiError, jwt helpers
└── mobile/
    └── src/
        ├── app/              # Expo Router screens (file = route)
        │   ├── _layout.tsx   # Redux Provider + auth-guarded Stack
        │   ├── login.tsx · register.tsx
        │   ├── index.tsx     # home / task list
        │   ├── task-form.tsx # create + edit (modal)
        │   ├── task/[id].tsx # task detail
        │   └── profile.tsx
        ├── store/            # Redux Toolkit: authSlice, tasksSlice, typed hooks
        ├── api/              # fetch client (token + 401 handling), endpoints
        ├── components/       # TaskCard, GradientButton, TextField, Chip, …
        ├── utils/            # smartSort, dates, validation
        ├── theme/            # colours, gradients, spacing, typography
        └── types/
```

---

## Getting started

### Prerequisites
- Node.js 20 or later
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (the free tier is enough). Paste its connection string into `backend/.env` as `MONGODB_URI`, and under **Network Access** allow your IP address.
- On your Android phone, the **Expo Go** app. You can also use an Android emulator.

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # then edit MONGODB_URI / JWT_SECRET if needed
npm run dev               # → http://localhost:5000/api
```
To check that it's running, open `GET http://localhost:5000/api/health`.

### 2. Mobile app
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go. **Your phone and your computer must be on the same Wi-Fi network.**

**How the app finds the API:** by default, the app takes your computer's LAN IP from the Expo dev server and calls `http://<that-ip>:5000/api`, so no configuration is needed. To use a different address, create `mobile/.env` with:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api   # Android emulator → host machine
```
Restart Expo with `npx expo start -c` after changing `.env`.

> **Windows tip:** if the phone can't reach the API, allow Node.js through Windows Firewall on *private* networks. The app will show a message saying "Can't reach the server at …".

### Building an APK with EAS
A standalone APK has no Expo dev server, so it can't find your computer's IP by itself. The API address is built into the APK from `mobile/eas.json` (`EXPO_PUBLIC_API_URL` in the `preview` profile). Set it to your backend's address before building.

```bash
cd mobile
npx eas-cli@latest login                                # free Expo account
npx eas-cli@latest init                                 # links the project (adds projectId to app.json)
npx eas-cli@latest build -p android --profile preview   # cloud build → APK download link + QR code
```

- **Backend on your laptop (`http://<LAN-IP>:5000/api`):** the phone must be on the same Wi-Fi, and the backend must be running. Plain HTTP is allowed by the local config plugin `mobile/plugins/withCleartextTraffic.js`.
- **Deployed backend (for example Render or Railway with Atlas):** put its `https://` URL in `eas.json`. The APK then works on any network.
- **Play Store:** the `production` profile builds an `.aab` instead of an APK.

---

## API reference

All task routes need the header `Authorization: Bearer <token>`. Errors always have the form `{ "message": string, "details"?: [...] }`.

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `201 { token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | none | `{ user }` |
| GET | `/api/tasks?status=all\|active\|completed` | none | `{ tasks }` |
| POST | `/api/tasks` | `{ title, description?, dateTime, deadline, priority?, category? }` | `201 { task }` |
| GET | `/api/tasks/:id` | none | `{ task }` |
| PATCH | `/api/tasks/:id` | any task fields | `{ task }` |
| PATCH | `/api/tasks/:id/toggle` | none | `{ task }` |
| DELETE | `/api/tasks/:id` | none | `204` |

**Validation rules:**
- The password must be at least 6 characters and contain a letter and a number.
- `deadline` must be at or after `dateTime`.
- `priority` is one of `low`, `medium` or `high`.
- `category` is one of `personal`, `work`, `study`, `health` or `other`.

---

## Design decisions

- **Security:**
  - Passwords are hashed with bcrypt (cost 12). The hash has `select: false`, so queries never return it unless asked.
  - Login gives the same error for an unknown email and a wrong password, so the endpoint can't be used to find out which emails are registered.
  - Every task query is filtered by the logged-in user's id, so a user can't read or change someone else's task even by guessing its id.
  - The API uses `helmet` for security headers and caps request bodies at 100kb.
- **Validation in two places:** the app checks input for instant feedback, and the server checks it again with zod as the source of truth.
- **Redux Toolkit:**
  - Tasks are stored with `createEntityAdapter`, so finding or updating a task by id is fast.
  - Toggle and delete are *optimistic*: the screen updates at once, and the change is rolled back if the request fails.
  - The filtered and sorted list is computed with memoized `createSelector`s.
  - Logging out clears both slices, so one user's tasks never appear in the next user's session.
- **Auth flow:** Expo Router's `Stack.Protected` decides which screens exist. When the user logs in, logs out or their token expires, the guard moves them to the right screen and clears the navigation history.
- **No circular imports:** the API client doesn't import the store. Instead, the store registers two callbacks with it at startup: one that returns the current token, and one that logs the user out when the server answers 401.
