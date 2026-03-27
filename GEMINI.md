# Gemini AI Context — Opensource Contribution Leaderboard

## What This Project Is

A real-time open source contributor leaderboard. It tracks PRs (open + merged) and issues across a GitHub organization's repositories. Uses Node.js, Express, and vanilla frontend. 

Built originally for Rocket.Chat's GSoC contributor tracking, but works for any GitHub organization.

## Project Architecture (keep it simple)

```
index.html          ← frontend (vanilla HTML, rendered via webpack)
src/index.js        ← frontend JS entry point (axios + socket.io-client)
src/server/app.js   ← Express server (serves static files + proxies API + spawns refresh)
src/server/refresh.js ← background worker that polls GitHub API and writes data.json
src/server/config.json ← YOUR config (copy from config-example.json)
src/server/util/API.js  ← GitHub API calls
src/server/util/Util.js ← helper utilities
admin/              ← admin panel (separate webpack build)
```

## Deployment — The Only Path That Matters

There is exactly one deployment path. Plain Node.js.

```bash
git clone <repo-url>
cd Opensource-Contribution-Leaderboard
cp src/server/config-example.json src/server/config.json
# Edit src/server/config.json — add your GitHub auth token, org name, contributors
npm run add       # installs deps for root + server + admin
npm run build     # builds frontend + admin panel
cd dist/server
node app.js
```

Runs on port 8080. That's it.

For local development:
```bash
npm start         # webpack-dev-server on :8080
npm run serve     # backend on :62050 (in a second terminal)
```

## Config

Static/environment settings live in `.env` (copy from `src/server/.env.example`):

```bash
AUTH_TOKEN=ghp_...              # GitHub personal access token
ORGANIZATION=YourOrg             # GitHub org name
ORGANIZATION_HOMEPAGE=https://yourorg.com/
ORGANIZATION_GITHUB_URL=https://github.com/YourOrg
ADMIN_PASSWORD=change-this       # admin panel password
SERVER_PORT=62050                # backend API port
```

Dynamic/runtime values stay in `config.json` (modifiable via admin panel):

```json
{
  "delay": "10",
  "startDate": "2025-06-01",
  "contributors": ["username1", "username2"],
  "includedRepositories": ["Repo1", "Repo2"]
}
```

- `delay` — seconds between each contributor's API poll
- `startDate` — filter contributions from this date onwards
- `contributors` — GitHub usernames to track
- `includedRepositories` — repos to include in tracking

## Design Decisions You Must Respect

1. **No code changes without explicit request.** This project favors documentation and configuration changes. Keep the codebase stable.
2. **Hidden rank column.** The rank column and some metadata are intentionally invisible on-screen. Admins can scrape the full stats by mouse-drag selecting the leaderboard table and copying — that's a one-stroke capture by design. Do not "fix" this by changing CSS or rendering logic.
3. **Simplicity over complexity.** Avoid over-engineering. 

## REST API

Endpoints at `/api/`:
- `GET /api/stats` — total contributors, open PRs, merged PRs, issues
- `GET /api/rank?username=X&parameter=mergedprs|openprs|issues` — get rank
- `GET /api/contributor?username=X&rank=N&parameter=...` — get contributor details

See `REST-API.md` for full docs.

## Key Dependencies

- **express** — HTTP server
- **axios** — GitHub API calls
- **jsonfile** — JSON file read/write
- **socket.io** / **socket.io-client** — real-time updates
- **webpack 4** — frontend bundling

## What NOT To Do

- Don't change the hidden-rank-column behavior
- Don't over-engineer — this project values simplicity
- Don't modify code unless explicitly asked to
