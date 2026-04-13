import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GEMINI_MODEL_ID } from "../config";
import { CONTEXT_COMPRESSION_PROMPT } from "@/lib/prompt.mjs";

export async function POST(req: Request) {
  try {
    const { contextItems } = await req.json();

    if (!contextItems || !Array.isArray(contextItems) || contextItems.length === 0) {
      return Response.json({ summary: "" });
    }

    const combinedHistory = contextItems.join("\n---\n");

    const { text } = await generateText({
      model: google(GEMINI_MODEL_ID),
      system: CONTEXT_COMPRESSION_PROMPT,
      prompt: `Dưới đây là các bản tóm tắt phiên tham vấn cũ. Hãy nén chúng lại:\n\n${combinedHistory}`,
      temperature: 0.2, // Low temperature for factual consistency
    });

    return Response.json({ summary: text });
  } catch (err: any) {
    console.error("[Summarize API Error]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
