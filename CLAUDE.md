# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run lint` — ESLint

## Architecture

Next.js 16 App Router + TypeScript + Tailwind CSS app that generates Facebook/Meta Ad Headlines from a product/offer URL.

**Flow:** URL eingeben → Claude analysiert Seite (web_fetch) → Zielgruppe & Ansprache ermittelt → 5 Headlines generiert → User wählt 3 → 5 Subheadlines generiert (keine Redundanz mit gewählten Headlines)

### Key Files

- `app/lib/claude.ts` — Claude API client. Uses `web_fetch_20260209` server-side tool so Claude fetches the URL directly. Two functions: `analyzeAndGenerateHeadlines()` and `generateSubheadlines()`. Both handle the agentic loop for server-side tool execution.
- `app/api/analyze/route.ts` — POST route: takes URL, returns `{ zielgruppe, ansprache, headlines[] }`
- `app/api/subheadlines/route.ts` — POST route: takes URL + analysis + 3 selected headlines, returns `{ subheadlines[] }`
- `app/page.tsx` — Client-side stepper UI with 3 steps (URL → Headlines → Subheadlines)

### Constraints

- Headlines: max 40 characters
- Subheadlines: max 125 characters
- Subheadlines must not be redundant with selected headlines
- Uses `ANTHROPIC_API_KEY` from `.env.local`
