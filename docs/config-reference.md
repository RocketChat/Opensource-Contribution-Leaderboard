## Config Reference

Static settings live in `.env`:

| Env Variable | What it is |
|---|---|
| `AUTH_TOKEN` | GitHub personal access token (repo read access) |
| `ORGANIZATION` | Your GitHub org name |
| `ORGANIZATION_HOMEPAGE` | Org homepage URL |
| `ORGANIZATION_GITHUB_URL` | Org GitHub URL |
| `ADMIN_PASSWORD` | Password for the admin panel |
| `SERVER_PORT` | Internal backend port (default 62050) |

Dynamic settings live in `config.json` (modifiable via admin panel):

| Key | What it is |
|---|---|
| `delay` | Seconds between API calls per contributor (respect rate limits) |
| `startDate` | Filter contributions from this date onwards |
| `contributors` | Array of GitHub usernames to track |
| `includedRepositories` | Repos to include in contribution tracking |
