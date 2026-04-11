# Getting Started and Configuration

## 1-Minute Run

Use the root [README](../README.md) quickstart for the fastest first run.

## Config Reference

Static settings live in `src/server/.env` when you want to customize the demo defaults for your own organization:

| Env Variable | What it is |
|---|---|
| `AUTH_TOKEN` | GitHub personal access token (repo read access) |
| `ORGANIZATION` | Your GitHub org name |
| `ORGANIZATION_HOMEPAGE` | Org homepage URL |
| `ORGANIZATION_GITHUB_URL` | Org GitHub URL |
| `ADMIN_PASSWORD` | Password for the admin panel |
| `SERVER_PORT` | Internal backend port (default 62050) |

Dynamic settings live in `src/server/config.json` (created from `src/server/config-example.json` automatically if missing):

| Key | What it is |
|---|---|
| `delay` | Seconds between API calls per contributor (respect rate limits) |
| `startDate` | Filter contributions from this date onwards |
| `contributors` | Array of GitHub usernames to track |
| `includedRepositories` | Repos to include in contribution tracking |
| `spamPenaltyThreshold` | Penalty threshold used by ranking logic |

## Local Development

Two terminals:

```bash
# Terminal 1 - frontend with hot reload
NODE_OPTIONS=--openssl-legacy-provider npm start

# Terminal 2 - backend server
npm run serve
```

Frontend runs at http://localhost:8080.

To work on the admin panel, add a third terminal:

```bash
cd admin && npm start
```

## REST API

The full API reference is in [docs/rest-api.md](rest-api.md).
