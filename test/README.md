# Regression tests

This directory holds automated regression tests for stable leaderboard behavior.

`leaderboard-e2e.test.js` starts the current server code against a fixed Rocket.Chat snapshot and verifies that `/stats`, `/rank`, and selected `/contributor` and `/rank?username=` responses still match the checked-in expected output.

Node version used:

- Node.js `v25.4.0`

Fixtures:

- `../contrib/rocketchat/gsoc/2025/gsoc2025final.json` is the canonical snapshot used as the fixed leaderboard input.
- `fixtures/gsoc2025final.expected.json` is the checked-in golden output generated from the current stable ranking logic and used for regression comparisons.

Run from the repo root:

```bash
npm i
npm --prefix src/server install
npm test
```

Note: `npm i` at the repo root installs only root dependencies. The regression test boots `src/server/app.js`, so `src/server` dependencies must also be installed before running `npm test`.

The test itself uses the env/path override support already available in the upstream dotenv-based server setup (`CONFIG_PATH`, `DATA_PATH`, `LOG_PATH`, `ADMINDATA_PATH`, `CONFIG_BACKUP_PATH`, `SERVER_PORT`) and does not require additional source changes under `src/server`.
