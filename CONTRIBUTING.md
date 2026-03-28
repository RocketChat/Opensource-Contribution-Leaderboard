# Contributing to Opensource Contribution Leaderboard

Thank you for your interest in contributing! This project tracks open source contributions across a GitHub organization and we welcome help of all kinds: bug fixes, features, documentation, and testing.

This project embraces AI-assisted development — we built parts of it with AI tools and encourage contributors to use them responsibly.

## Ways to Contribute

- **Bug reports** — Open an issue describing the problem, steps to reproduce, and expected behavior.
- **Feature requests** — Open an issue to discuss before implementing.
- **Code** — Fix bugs or implement features. See the workflow below.
- **Documentation** — Improve the README, AGENTS.md, GEMINI.md, or inline comments.
- **Testing** — Try deploying it, report what breaks, suggest improvements.

For substantial new features, please open an issue first to discuss the approach. This prevents wasted effort.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Opensource-Contribution-Leaderboard.git
   cd Opensource-Contribution-Leaderboard
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/RocketChat/Opensource-Contribution-Leaderboard.git
   ```

## Development Setup

```bash
# Install all dependencies (root + server + admin)
npm run add

# Terminal 1 — frontend with hot reload
NODE_OPTIONS=--openssl-legacy-provider npm start

# Terminal 2 — backend server
npm run serve
```

Frontend at http://localhost:8080.

For production build:
```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
cd dist/server
node app.js
```

See [README.md](README.md) for full config setup.

## Making Changes

### Branching

Always branch off `main` and target `main` in your PR:

```bash
git checkout main
git pull upstream main
git checkout -b your-feature-branch
```

Use descriptive branch names: `fix/dark-mode-flash`, `feat/new-api-endpoint`, `docs/update-readme`.

### Commits

- Write clear, concise commit messages in English.
- Use the imperative mood: "Add dark mode" not "Added dark mode".
- Reference related issues when relevant: `Fix table rendering (#42)`.
- Keep commits focused — one logical change per commit.

### Keeping Up to Date

Rebase your branch onto upstream `main` before opening a PR:

```bash
git fetch upstream
git rebase upstream/main
```

## Design Decisions You Must Respect

1. **Hidden rank column** — The rank column and some stats are intentionally invisible. Admins can select-all and copy the table for one-stroke data capture. Do not "fix" this visibility.

2. **Keep it simple** — Avoid over-engineering. no unnecessary abstractions.

## AI-Assisted Contributions

We fully embrace AI-assisted development (Copilot, Cursor, Windsurf, Gemini, ChatGPT, Claude, etc.). The project includes context files specifically for AI agents:

- [AGENTS.md](AGENTS.md) — context for AI coding agents
- [GEMINI.md](GEMINI.md) — context for Google Gemini

### Disclosure

When opening a PR with AI-assisted code, please note the level of AI involvement:

| Level | Meaning |
|---|---|
| **Fully AI-generated** | AI wrote the code; you reviewed and validated it |
| **Mostly AI-generated** | AI produced the draft; you made significant modifications |
| **AI-assisted** | You led the work; AI provided suggestions or completions |
| **Human-written** | No AI involvement |

There is no stigma attached to any level — what matters is the quality of the contribution.

### You Are Responsible for What You Submit

Using AI to generate code does not reduce your responsibility as the contributor. Before opening a PR with AI-generated code:

- **Read and understand every line** of the generated code.
- **Test it locally** — run `npm start` + `npm run serve` and verify your changes work.
- **Check for security issues** — AI models can generate subtly insecure code. Review carefully.
- **Verify correctness** — AI-generated logic can be plausible-sounding but wrong. Validate behavior, not just syntax.
- **Respect the design decisions** above — AI agents love to "improve" things that are intentional.

PRs where it is clear the contributor has not read or tested the AI-generated code will be closed without review.

### AI-Generated Code Quality Standards

AI-generated contributions are held to the same quality bar as human-written code:

- It must work. Test it locally before submitting.
- It must be consistent with the existing codebase style.
- It must not introduce unnecessary abstractions, dead code, or over-engineering.
- It must respect the project's design decisions (hidden rank column, no database, no containers).

## Pull Request Process

1. **Before opening a PR**: Test your changes locally (`npm start` + `npm run serve`).
2. **Keep PRs focused** — one logical change per PR. Don't bundle unrelated changes.
3. **Prefer small PRs** — 200 lines across 5 files is much easier to review than 2000 lines across 30 files.
4. **Fill in the PR description** — explain what the change does and why.
5. **Note AI involvement** — use the disclosure levels above.
6. **Link related issues** if applicable.

## Code Review

### For Contributors

- Respond to review comments within a reasonable time.
- When you update a PR in response to feedback, note what changed.
- If you disagree with feedback, engage respectfully and explain your reasoning.

### For Reviewers

Review for:

1. **Correctness** — Does the code do what it claims?
2. **Security** — Especially for AI-generated code.
3. **Simplicity** — Is there a simpler solution? Does this add unnecessary complexity?
4. **Consistency** — Does it match the existing codebase style?
5. **Design decisions** — Does it respect the hidden rank column, no-database, and no-container rules?

## Communication

- **GitHub Issues** — Bug reports, feature requests, design discussions.
- **Pull Request comments** — Code-specific feedback.
- **[Rocket.Chat open server](https://open.rocket.chat)** — General discussion.

When in doubt, open an issue before writing code.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
