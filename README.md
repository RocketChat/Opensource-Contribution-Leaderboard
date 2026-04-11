# Opensource Contribution Leaderboard

A real-time leaderboard that tracks open source contributions (PRs and issues) across your GitHub organization. Built with Node.js, Express, and vanilla frontend. 

![](./docs/images/demo.png)

## What It Does

- Tracks open PRs, merged PRs, and issues per contributor across all repos in a GitHub org
- Updates automatically in the background — no manual refresh needed
- Contributors can be added before they've made their first contribution
- Built-in admin panel for managing the contributor list
- REST API for programmatic access to leaderboard data

## Get It Running (1 minute)

No manual configuration is needed to get started. The app uses the default contributor list and automatically creates `src/server/config.json` from `src/server/config-example.json` whenever `config.json` is missing.

The quickstart runs with built-in demo defaults, so you do not need a `.env` file to try it locally. If you want to customize organization or admin settings, use the optional setup step below.

```bash
git clone https://github.com/RocketChat/Opensource-Contribution-Leaderboard.git && cd Opensource-Contribution-Leaderboard
npm run add
NODE_OPTIONS=--openssl-legacy-provider npm start
```

Open **http://localhost:8080**.

To customize organization/admin settings, create `.env` from the example (or create it manually):

```bash
cp src/server/.env.example src/server/.env
```

For setup details, local development, and API docs, see [docs/getting-started.md](docs/getting-started.md).

## How It Works Under the Hood

1. `app.js` starts Express on port 8080 and spawns `refresh.js` as a background process
2. `refresh.js` loops through your `contributors` list, calling the GitHub API for each
3. Results are written to `src/assets/data/data.json` — no database needed
4. The frontend and REST API both read from `data.json`, so they're always in sync
5. Real-time updates are pushed to connected clients via socket.io

## AI Agents & Vibe Coding

This project is set up for AI-assisted development. See:

- [AGENTS.md](AGENTS.md) — context for any AI coding agent (Copilot, Cursor, Windsurf, Cline, etc.)
- [GEMINI.md](GEMINI.md) — context for Google Gemini

These files give AI agents the full project layout, design decisions, and ground rules so they can help without breaking things.

## License
This project is open source under the Licence [MIT](./LICENSE).
