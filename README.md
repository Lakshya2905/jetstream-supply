# JetStream Supply Risk & MRP Simulator

Interactive supply-chain stress test for an AI accelerator NIC. Loads a representative 14-component bill of materials, runs a time-phased MRP schedule against quarterly demand, scores supplier risk by lead time, source concentration, and geography, and lets you stress the plan with lead-time slips, demand spikes, and supplier capacity cuts. A Claude API endpoint generates an executive brief from the current plan state.

**Live demo:** https://jetstream-supply.vercel.app

> Representative model based on public product information. Not d-Matrix proprietary data.

## Features

- **Time-phased MRP** — lot-for-lot, single-level explosion with MOQ rounding and lead-time offset over a 12-week horizon
- **Risk heatmap** — composite supplier risk score weighted 40% lead time, 40% source concentration, 20% geography, with per-factor explanations on hover
- **Live scenario stress test** — drag sliders or apply one-click presets (HBM3E shortage, Taiwan disruption, Q3 demand surge) and watch the chart, KPIs, and risk panel recompute in real time
- **Click-to-pin week breakdown** — click any week on the timeline to pin its full component-level shortage breakdown below the chart
- **Executive brief** — Claude Sonnet 4.6 reads the current MRP and risk state and writes a paragraph-form briefing on demand

## Stack

- Next.js 14 (App Router) with TypeScript strict mode
- Tailwind CSS + shadcn/ui (Base UI) primitives
- Recharts for the timeline
- Zustand for client state
- `@anthropic-ai/sdk` against `claude-sonnet-4-6` for the brief endpoint
- Deployed on Vercel

## Project layout

```
src/
  app/                 routes and API
    api/brief/         Claude API endpoint
  components/          React UI (one per file)
  lib/                 pure business logic
    mrp.ts             time-phased MRP engine
    risk.ts            composite risk scoring
    seed-data.ts       representative BOM and demand
    types.ts
  store/               Zustand store
```

## Run locally

```bash
npm install

# Optional: only needed for the executive brief endpoint
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## How the model works

**MRP** (`src/lib/mrp.ts`): for each component and each week, compute gross requirement from demand, draw down on-hand inventory, raise a planned release for any net requirement rounded up to the supplier MOQ, offset the release by the component's lead time, and mark shortage for any net requirement whose release week would fall before week 1.

**Risk score** (`src/lib/risk.ts`): each supplier is scored on three axes — lead time normalized against a 22-week ceiling, source concentration (sole / dual / multi), and regional exposure — combined with weights 0.4 / 0.4 / 0.2 into a 0..1 composite.

**Scenarios** apply before MRP runs: demand spike scales weekly demand, lead-time slip extends one component's lead time, supplier capacity cut shrinks any release tied to that supplier.

## Author

Built by [Lakshya Jain](https://www.linkedin.com/in/lakshya-jain-duke) — feedback and contributions welcome.
