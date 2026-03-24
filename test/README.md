# Regression tests

This directory holds automated regression tests for stable leaderboard behavior.

`leaderboard-e2e.test.js` starts the current server code against a fixed Rocket.Chat snapshot and verifies that `/stats`, `/rank`, and selected `/contributor` and `/rank?username=` responses still match the checked-in expected output.

Fixtures:

- `fixtures/gsoc2025final.data.json` is copied from `contrib/rocketchat/gsoc/2025/gsoc2025final.json`.
- `fixtures/gsoc2025final.expected.json` is the checked-in golden output generated from the current stable ranking logic and used for regression comparisons.

Run from the repo root:

```bash
npm test
```
