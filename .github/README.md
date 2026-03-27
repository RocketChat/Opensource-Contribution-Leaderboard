# GitHub Actions

## CI workflow

[`workflows/ci.yml`](workflows/ci.yml) runs on pull requests and pushes to `master`: install dependencies, `npm run lint`, and `npm test`.

It uses `npm ci` for both the repo root and `src/server`, matching the current lockfile-based setup on `master`.

## Require CI before merging (branch protection)

After this workflow is on the default branch:

1. In the GitHub repo, go to **Settings** → **Branches**.
2. Add or edit a rule for `master`.
3. Enable **Require status checks to pass before merging**.
4. Under **Status checks that are required**, select **CI / ci** (or the job name shown after the first run).

This blocks merging PRs until lint and tests pass.
