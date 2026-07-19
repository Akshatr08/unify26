# UNIFY/26 — Contributing Guide

Thank you for your interest in contributing to UNIFY/26! This is an open-source project for the Google Prompt Wars 2026 hackathon.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/unify26.git`
3. Install dependencies: `bun install` (or `npm install`)
4. Copy the env example: `cp .env.example .env` and fill in your `GEMINI_API_KEY`
5. Start the dev server: `bun run dev`

## Development Workflow

- `bun run dev` — start dev server at `http://localhost:3000`
- `bun run test` — run the Vitest test suite (no API key required)
- `bun run lint` — run ESLint
- `bun run format` — run Prettier

## Project Structure

See `README.md § Project Structure` for a full breakdown of the codebase.

## Coding Standards

- **TypeScript strict mode** — no `any`, all types must be explicit.
- **Zod for validation** — all server function inputs must use Zod schemas.
- **Server-only files** — anything reading `process.env` must live in a `.server.ts` file and never be imported by client components.
- **Tests** — all new utility functions must have corresponding Vitest tests in `src/lib/*.test.ts`.
- **Accessibility** — all interactive elements must have `aria-label` or visible text. Run an axe audit before submitting a PR.

## Submitting a PR

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Commit with a clear message: `git commit -m "feat: add voice incident reporting"`
3. Push and open a pull request against `main`
4. Ensure `bun run lint` and `bun run test` pass with no errors

## Reporting Issues

Please open a GitHub Issue with:
- A clear description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs. actual behavior

## License

MIT — see [LICENSE](./LICENSE).
