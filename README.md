# Alex — Insurance Assistant (Frontend)

A React + Vite chat UI for **Alex**, a conversational insurance assistant. It
talks to a Spring AI backend that walks the user through a life-insurance
application, asking one question at a time.

## Tech stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/) (dev server + build)

## Prerequisites

- **Node.js 18+** (developed against Node 22)
- The **backend** running locally — a Spring Boot + Spring AI (OpenAI) service.
  See the separate `openai/` project. By default this app expects it at
  `http://localhost:8080`.

## Getting started

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5174)
npm run dev
```

Then open <http://localhost:5174> and chat with Alex.

> **Port note:** this app runs on **5174**. The Rules Authoring Workbench web UI
> uses 5173, so the two can run side by side without clashing.

### Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 5174       |
| `npm run build`   | Produce a production build in `dist/`        |
| `npm run preview` | Serve the production build locally           |

## How it connects to the backend

To avoid CORS during development, Vite proxies backend paths to the Spring Boot
app so the browser only ever makes same-origin requests. See
[`vite.config.js`](vite.config.js):

- `/termlife_api/*` → backend (the live insurance agent)
- `/api/*` → backend (other demo endpoints)

The chat calls **`GET /termlife_api/interview?message=<user text>`** (see
[`src/api.js`](src/api.js)), which is handled by the backend's
`InterviewController`. A stable `X-Conversation-Id` header keeps each visitor's
answers isolated. The controller orchestrates phrasing/extraction around the
workbench rules engine, which drives the questions and the eligibility decision.

### Pointing at a different backend

The proxy target defaults to `http://localhost:8080`. Override it with the
`VITE_BACKEND` environment variable, e.g. to reach a backend on the LAN:

```bash
# PowerShell
$env:VITE_BACKEND = "http://10.0.0.126:8080"; npm run dev
```

```bash
# bash
VITE_BACKEND=http://10.0.0.126:8080 npm run dev
```

## Project structure

```
insurance-chat/
├── index.html          # Vite entry HTML
├── vite.config.js      # dev server + backend proxy config
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # chat UI + conversation state
│   ├── api.js          # backend client (sendMessage)
│   └── styles.css      # styling
└── package.json
```

## Notes

- Each browser session gets a unique conversation id (sent as the
  `X-Conversation-Id` header) so intake stays isolated per visitor.
- The backend requires a valid OpenAI API key to return real responses; if it
  isn't configured, chat requests will fail server-side.
