# AGENTS.md

## Cursor Cloud specific instructions

### Overview
BilimAI is a Next.js 15 educational platform (Kazakh-language) for UNT exam preparation. It uses Firebase (Auth + Firestore) for backend, Google Genkit with Gemini 2.5 Flash for AI features, and shadcn/ui + Tailwind CSS for the frontend.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js Dev Server | `npm run dev` | 9002 | Main application with Turbopack |
| Genkit Dev Server | `npm run genkit:dev` | — | Optional; for AI flow debugging only |

### Development Commands
- **Dev server:** `npm run dev` (runs on port 9002 with Turbopack)
- **Build:** `npm run build`
- **Lint:** `npx eslint src/` (uses flat config in `eslint.config.mjs`; `next lint` is deprecated in Next.js 15.5)
- **Typecheck:** `npm run typecheck` (pre-existing TS errors exist; `next.config.ts` has `ignoreBuildErrors: true`)

### Non-obvious caveats
- The `next lint` script is **deprecated** in Next.js 15.5 and has a circular-reference serialization bug with `eslint-config-next@16`. Use `npx eslint src/` directly instead.
- TypeScript has pre-existing type errors in the codebase. The build ignores them via `typescript.ignoreBuildErrors: true` in `next.config.ts`.
- Firebase Auth and Firestore are configured against a **production** Firebase project (`studio-5303827652-38d67`). Firebase emulators are disabled in `dev.nix`.
- AI flows require a `GOOGLE_GENAI_API_KEY` environment variable in `.env`. Without it, AI features will not work, but the main UI still loads.
- The project uses `package-lock.json` — always use **npm** (not yarn/pnpm).
