import { NextResponse } from 'next/server';

// Returns which voice engine is currently configured
export async function GET() {
  const engine = process.env.VOICE_ENGINE || 'gemini';
  const elevenAgentId = process.env.ELEVENLABS_AGENT_ID || '';

  return NextResponse.json({
    engine: engine === 'elevenlabs' ? 'elevenlabs' : 'gemini',
    elevenAgentId,
  });
}
