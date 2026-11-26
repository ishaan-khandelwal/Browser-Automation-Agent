# BrowseAI — frontend

The web interface for the Browser Automation Agent. You describe a task in
plain words; the agent plans it, drives a real Chromium window, and this page
shows every step it takes, including a screenshot of the page with the element
it acted on outlined.

It is a Next.js app and talks to the
[`browser-agent-backend`](https://github.com/Abhishek9639/browser-agent-backend)
over REST and a WebSocket.

## Running it locally

You need the backend running first — this app shows the backend's work and has
nothing to display without it.

### 1. Start the backend

In the backend repo, either bring up the whole stack in Docker — Postgres, the
API and the demo site together:

```bash
make up
```

or, if you already have Postgres running locally, just the API:

```bash
make dev
```

Check it answers before going on:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

You want `{"status":"ok", ... "db":"ok"}`. If `db` is not `ok`, the database is
not up yet.

### 2. Point this app at it

```bash
cp .env.example .env.local
```

The defaults assume the backend is on `127.0.0.1:8000`. Edit `.env.local` if
yours is somewhere else. The file explains why there are two variables.

### 3. Start this app

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. Port 3000 in use? `npm run dev -- -p 3001`.

### 4. Make an account and run something

Sign in creates the account on your backend, so the first run needs a
registration. Passwords must be at least 10 characters and not all digits —
that is the backend's rule, and the form checks it before sending.

## Trying it without touching the open web

The backend ships a demo flight site. `make up` already serves it; with
`make dev`, start it yourself in the backend repo:

```bash
make skyfare
```

Either way it is on `127.0.0.1:8200`. In this app, open **Start URL** in the task
box, put `http://127.0.0.1:8200/` in it, and give the agent something like
*"Find the cheapest flight from Delhi to Bengaluru and tell me the fare"*. The
whole run then stays on your machine, which makes it a good first test and a
fast way to check a UI change against real data.

## How the live view works

The backend's `step` events carry a base64 JPEG screenshot, the `bbox` of the
element acted on, and the `viewport` those coordinates are in.
`src/app/components/LiveBrowser.jsx` draws the screenshot and places the box
over it as a percentage of the viewport, so the highlight lands on the right
element at any window size. `approval_required` carries the same pair, which is
why a pending approval takes over the view: you should see what you are being
asked to approve.

`docs/api.md` in the backend repo is the authoritative event contract. If a
field here looks wrong, check it there first.

## Layout

```
src/app/
  page.jsx                 the shell and all run state, fed by the stream
  globals.css              the whole theme and every component class
  lib/api.js               REST calls, token refresh, the WebSocket
  lib/auth-context.js      who is signed in
  components/
    Scene3D.jsx            the 3D background (CSS 3D, no WebGL)
    LiveBrowser.jsx        the agent's browser, with the element highlight
    ExecutionTimeline.jsx  the plan and the steps taken
    AIThinking.jsx         the agent's reasoning and its current phase
    ApprovalCard.jsx       payment / sign-in / details hand-offs
    QuestionCard.jsx       a question the agent cannot answer itself
    RightPanel.jsx         tool calls, page facts, run stats
    ...
```

## Checks

```bash
npm run lint
```

```bash
npm run build
```
