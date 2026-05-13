# JetStream Supply Risk & MRP Simulator

A Next.js 14 + TypeScript + Tailwind app deployed on Vercel.

The full build spec is in BUILD_PLAN.md. Follow it section by section.

## Stack

- Next.js 14 with App Router, src/ layout
- TypeScript strict mode, no `any`, prefer `unknown` with type guards
- Tailwind CSS with shadcn/ui primitives
- Recharts for all charts
- Zustand for global state
- @anthropic-ai/sdk for the AI brief endpoint, model `claude-sonnet-4-6`
- Deploy to Vercel

## Project layout

- `components/` for React components
- `lib/` for pure business logic (mrp.ts, risk.ts, scenario.ts, types.ts, seed-data.ts)
- `store/` for Zustand stores
- `app/` for routes and API endpoints

## Conventions

- No em dashes anywhere: code comments, copy, markdown, error messages, every single place
- Functions stay under 50 lines where reasonable
- One component per file
- Run `npm run build` before declaring a feature done
- Tailwind utilities inline, no separate CSS files except globals.css
- Dark theme by default, near-black background, accent color #ef4444 for risk highlights

## Workflow rules

- Make minimal changes, do not refactor unrelated code
- When unsure between two approaches, explain both and let me choose
- Run type check after every code change
- Create separate commits per logical change, not one giant commit
- Never use `sudo` for anything

## Footer disclaimer (must appear on every page)

"Representative model. Not d-Matrix proprietary data."

## Out of scope for this build

- Auth, user accounts, persistence beyond in-memory state
- Mobile responsiveness beyond not breaking
- Real-time collaboration
- Server-side rendering optimizations
