# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite-powered React 19 and TypeScript school-bell dashboard. Application code lives in `src/`: `components/` contains page views and reusable UI, `context/BellContext.tsx` owns shared bell state, and `services/` contains scheduling, persistence, default-data, and audio logic. Shared interfaces belong in `src/types.ts`; global styles are in `src/index.css`. Static audio and image resources belong in `assets/`. Treat `dist/`, `coverage/`, and `node_modules/` as generated content and do not commit them. `Bel_Sekolah_Renamed/` is currently untracked; confirm its intended role before depending on it.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependency versions from `package-lock.json`.
- `npm run dev` starts Vite on port 3000 and exposes it on the local network.
- `npm run lint` runs TypeScript validation with `tsc --noEmit`.
- `npm run build` creates a production bundle in `dist/`.
- `npm run preview` serves the production build for a final browser check.

Run `npm run lint && npm run build` before opening a pull request. The `clean` script uses Unix `rm`; on Windows, remove `dist/` manually if needed.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Follow the existing two-space indentation, single quotes, semicolons, and trailing commas in multiline expressions. Name components and their files in PascalCase (`ManualBellView.tsx`), hooks and functions in camelCase, and constants in descriptive camelCase or UPPER_SNAKE_CASE when truly global. Keep UI in `components/`, shared state in `context/`, and browser or domain logic in `services/`. Prefer the configured `@/` alias for cross-directory imports.

## Testing Guidelines

No automated test framework or coverage threshold is configured yet. For every change, run type-checking and a production build, then manually verify schedule creation, bell playback, persistence, and responsive layouts as relevant. If adding tests, use Vitest with React Testing Library, place files beside their subjects as `*.test.ts` or `*.test.tsx`, and add the corresponding `npm test` script.

## Commit & Pull Request Guidelines

Recent history uses short imperative Conventional Commit subjects, such as `feat: add 10:00 AM Indonesia Raya & Mars event`. Continue with prefixes such as `feat:`, `fix:`, `refactor:`, or `docs:` and keep each commit focused. Pull requests should explain the user-visible effect, list validation performed, link related issues, and include screenshots or a short recording for UI changes. Never commit `.env` files, API keys, uploaded audio containing restricted material, or generated build output.
