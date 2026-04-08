import { NextResponse } from 'next/server';
import {
  DEFAULT_VOICE_ID,
  TTS_MODEL,
  MINIMAX_TTS_URL,
  VOICE_SETTING,
  AUDIO_SETTING,
  sanitizeTTS,
  hexToBuffer,
  EMOTION_MAP
} from '../config';

export async function POST(req: Request) {
  try {
    const { text, emotion } = await req.json();
    const sanitizedText = sanitizeTTS(text);

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MINIMAX_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const targetVoice = process.env.MINIMAX_VOICE_ID || DEFAULT_VOICE_ID;
    
    // Map emotion tag sang MiniMax emotion values
    const mappedEmotion = EMOTION_MAP[emotion?.toLowerCase()] || "fluent";

    console.log(`[SERVER TIMER] Starting MiniMax TTS. Emotion: ${mappedEmotion}`);
    const startTime = performance.now();

    const response = await fetch(MINIMAX_TTS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        text: sanitizedText,
        stream: false,
        voice_setting: {
          ...VOICE_SETTING,
          voice_id: targetVoice,
          emotion: mappedEmotion,
        },
        audio_setting: AUDIO_SETTING,
        language_boost: "Vietnamese",
      }),
    });

    const endTime = performance.now();
    console.log(`[SERVER TIMER] MiniMax TTS response received. Duration: ${(endTime - startTime).toFixed(0)}ms`);

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error("MiniMax TTS API error:", errorMsg);
      return NextResponse.json(
        { error: 'Failed to generate speech with MiniMax' },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (result.base_resp?.status_code !== 0) {
      console.error("MiniMax TTS error:", result.base_resp?.status_msg);
      return NextResponse.json(
        { error: result.base_resp?.status_msg || "TTS generation failed" },
        { status: 500 }
      );
    }

    const audioHex = result.data?.audio;
    if (!audioHex) {
      return NextResponse.json(
        { error: "No audio data in response" },
        { status: 500 }
      );
    }

    const audioBytes = hexToBuffer(audioHex);

    return new NextResponse(audioBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('MiniMax TTS server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
