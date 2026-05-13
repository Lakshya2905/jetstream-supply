import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface BriefRequest {
  mrpSummary: unknown;
  topRisks: unknown;
  scenario: unknown;
}

const SYSTEM_PROMPT = `You are a supply chain analyst at d-Matrix preparing a weekly executive brief on the JetStream product line.
Write in calm, factual prose. No em dashes. No bullet points unless asked. Around 180 to 220 words.
Lead with the bottom line, then top 3 risks, then recommended actions.
Be specific about week numbers, component names, and supplier names from the data.`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let body: BriefRequest;
  try {
    body = (await req.json()) as BriefRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userMessage = `Current state of JetStream supply plan:

MRP summary:
${JSON.stringify(body.mrpSummary, null, 2)}

Top 3 risk components:
${JSON.stringify(body.topRisks, null, 2)}

Active scenario:
${JSON.stringify(body.scenario, null, 2)}

Write the brief.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    return NextResponse.json({ brief: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Anthropic call failed: ${message}` },
      { status: 502 },
    );
  }
}
