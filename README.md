# JetStream Supply Risk & MRP Simulator

A single-page web app that loads a representative JetStream NIC bill of materials, accepts a quarterly demand forecast, and computes a time-phased MRP schedule, supplier risk heatmap, and stress-test scenarios for lead time slips, demand spikes, and supplier capacity cuts. A built-in Claude API endpoint writes an executive briefing on the current state of the plan. Built with Next.js 14, TypeScript, Tailwind, shadcn/ui, Recharts, and Zustand.

## Run locally

1. Install dependencies:
   ```
   npm install
   ```
2. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open http://localhost:3000.

To build for production:
```
npm run build
npm start
```
