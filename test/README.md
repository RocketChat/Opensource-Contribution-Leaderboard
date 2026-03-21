# Regression tests

This directory holds **automated regression tests** for server behavior (starting with invalid JSON handling for admin `POST` bodies and related error-handling work).

Tests are run with Node’s built-in test runner (`node --test`). **Node.js 18+** is required.

`npm test` runs `test/**/*.test.js` so new files can be added without changing the script.

Some tests were initially drafted with AI assistance; they are **kept in the repository on purpose** so the project builds a lasting regression suite instead of generating tests only to discard them after a green run.

From the repo root:

```bash
npm test
```
