# AI Coding Agents — Opensource Contribution Leaderboard

This file provides context for any AI coding agent (Copilot, Cursor, Windsurf, Cline, Aider, etc.) working on this project.

## Quick Orientation

| What | Where |
|---|---|
| Frontend entry | `src/index.js` |
| Frontend HTML | `index.html` |
| Backend server | `src/server/app.js` |
| GitHub data fetcher | `src/server/refresh.js` |
| GitHub API wrapper | `src/server/util/API.js` |
| Utility helpers | `src/server/util/Util.js` |
| Config template | `src/server/config-example.json` |
| Live config (gitignored) | `src/server/config.json` |
| Admin panel | `admin/` (separate webpack build) |
| Webpack config (main) | `build/webpack.config.js` |
| Webpack config (admin) | `admin/build/webpack.config.js` |
| REST API docs | `REST-API.md` |
| Cached leaderboard data | `src/assets/data/data.json` (auto-generated) |

## npm Scripts

| Command | What it does |
|---|---|
| `npm run add` | Installs dependencies for root, server, and admin |
| `npm start` | Dev mode — webpack-dev-server with hot reload on :8080 |
| `npm run serve` | Starts the backend server (run in separate terminal during dev) |
| `npm run build` | Production build — compiles admin + main frontend |
| `npm run lint` | ESLint |

## How It Works (in plain english)

1. `app.js` starts an Express server on port 8080
2. It spawns `refresh.js` as a child process
3. `refresh.js` reads `config.json`, loops through the `contributors` array, and calls the GitHub API for each one
4. Results are written to `src/assets/data/data.json`
5. The frontend fetches `/data` endpoint which serves `data.json`
6. Real-time updates via socket.io
7. The API endpoints (`/api/stats`, `/api/rank`, `/api/contributor`) read from the same `data.json`

## Critical Design Decisions

### Hidden Rank Column
The rank column and some aggregate stats are rendered with invisible/white text. This is **intentional** — admins can select-all and copy the table to get full stats in one stroke. Do not "fix" this visibility.

## Production Deployment (the only path)

```bash
git clone <repo-url> && cd Opensource-Contribution-Leaderboard
cp src/server/config-example.json src/server/config.json
cp src/server/.env.example src/server/.env
# Edit .env with your GitHub token, org, admin password, etc.
# Edit config.json with your contributors list
npm run add
npm run build
cd dist/server
node app.js
```

Serves on port 8080.

## Development Workflow

Terminal 1:
```bash
npm start    # webpack-dev-server with hot reload
```

Terminal 2:
```bash
npm run serve  # backend API server
```

Frontend: http://localhost:8080
Backend port: whatever `SERVER_PORT` is set to in .env (default 62050)

## Config Reference

Static/environment settings live in `.env` (copy from `src/server/.env.example`):

```bash
AUTH_TOKEN=ghp_YOUR_GITHUB_TOKEN      # required — GitHub personal access token
ORGANIZATION=YourOrg                  # required — GitHub org name
ORGANIZATION_HOMEPAGE=https://yourorg.com/
ORGANIZATION_GITHUB_URL=https://github.com/YourOrg
ADMIN_PASSWORD=change-this            # required — admin panel password
SERVER_PORT=62050                     # backend API port
```

Dynamic/runtime values stay in `config.json` (modifiable via admin panel):

```json
{
  "delay": "10",
  "startDate": "2025-06-01",
  "contributors": ["user1", "user2"],
  "includedRepositories": ["Repo1", "Repo2"]
}
```

- `delay` — seconds between API calls per contributor (respect rate limits).
- `startDate` — filter contributions from this date onwards.
- `contributors` — array of GitHub usernames to track.
- `includedRepositories` — repos to include in contribution tracking.

## Rules for Agents

1. **Do not modify code unless explicitly instructed.** Documentation and config changes are the norm.
2. **Keep it simple.** If the change feels like over-engineering, it probably is.
3. **Respect the hidden-data design.** White-on-white text in the leaderboard is intentional.
4. **Test locally before suggesting production changes.** `npm start` + `npm run serve` is the dev loop.
