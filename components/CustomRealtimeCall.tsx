"use client";

import { useState, useRef, useCallback } from "react";
import { PhoneOff, PhoneCall, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Message } from "ai";
import hark from "hark";

interface CustomRealtimeCallProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  append: (message: any) => Promise<string | null | undefined>;
  stop: () => void;
  isLoading: boolean;
  isViewVisible: boolean;
  preloadedLocalContext?: string;
}

// Gemini Native Audio outputs PCM at 24kHz
const AUDIO_SAMPLE_RATE = 24000;

export default function CustomRealtimeCall({ messages, setMessages, append, isViewVisible, preloadedLocalContext }: CustomRealtimeCallProps) {
  const [isActive, setIsActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("Nhấn để bắt đầu cuộc gọi");
  const [liveTranscript, setLiveTranscript] = useState("");

  const currentAiMessageIdRef = useRef<string | null>(null);
  const turnTextAccumulatorRef = useRef("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const harkRef = useRef<any>(null);
  const fillerAudioRef = useRef<HTMLAudioElement | null>(null);

  const nextAudioTimeRef = useRef<number>(0);
  const isAiSpeakingRef = useRef(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const fillers = [
    "/sounds/filler-um.mp3",
    "/sounds/filler-nghe.mp3",
    "/sounds/filler-hieu.mp3",
    "/sounds/filler-dang-nghe.mp3"
  ];

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (_e) { /* noop */ }
    });
    activeSourcesRef.current = [];
    if (fillerAudioRef.current) {
      fillerAudioRef.current.pause();
      fillerAudioRef.current = null;
    }
    isAiSpeakingRef.current = false;
    setIsAiSpeaking(false);
  }, []);

  const interruptAI = useCallback(() => {
    stopAllAudio();
    nextAudioTimeRef.current = audioCtxRef.current?.currentTime || 0;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('START_TURN');
    }
  }, [stopAllAudio]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      micStreamRef.current = stream;

      // AudioContext at 16kHz for mic input to Gemini
      const micCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = micCtx;
      nextAudioTimeRef.current = micCtx.currentTime;

      await micCtx.audioWorklet.addModule('/pcm-worker.js');
      const micSource = micCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(micCtx, 'pcm-worker');
      workletNodeRef.current = workletNode;
      micSource.connect(workletNode);

      setIsActive(true);
      setIsListening(true);
      setStatusText("Đang kết nối...");

      // WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        let combinedContext = "";

        // 1. Get simple history from localStorage (Last 2 summaries)
        const savedHistory = localStorage.getItem("lunaa-session-history");
        if (savedHistory) {
          try {
            const history = JSON.parse(savedHistory);
            const recentSummaries = history.slice(0, 2).map((h: any) => h.summary.substring(0, 400)).join("\n---\n");
            if (recentSummaries) {
              combinedContext += `[TÓM TẮT PHIÊN TRƯỚC]:\n${recentSummaries}\n\n`;
            }
          } catch (e) {
            console.error("Failed to parse localStorage history:", e);
          }
        }

        // 2. Use Pre-loaded Local RAG Context (from startup)
        if (preloadedLocalContext) {
          combinedContext += `[CHI TIẾT TỪ LOCAL RAG]:\n${preloadedLocalContext}`;
          console.log("[Voice Mode] Using pre-loaded Local RAG context.");
        }

        if (combinedContext.trim()) {
          ws.send(`SET_CONTEXT: Dưới đây là bối cảnh từ các phiên tham vấn trước đó. Hãy sử dụng nó để thấu cảm hơn: \n${combinedContext}`);
        }

        setStatusText("Đang nghe...");
        ws.send('START_TURN');
      };

      ws.onmessage = async (e) => {
        if (typeof e.data === 'string') {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'system' && data.content === 'ready') {
              setStatusText("Đang nghe...");
            } else if (data.type === 'error') {
              console.error("[Voice Mode Error]", data.content);
              setStatusText("Lỗi kết nối: " + data.content);
              setIsActive(false);
              setIsListening(false);
            } else if (data.type === 'user_text') {
              console.log("[USER]", data.content);
              setLiveTranscript(data.content); // Update live status text with the correct transcript
              // Store user transcript in the chat bubbles list without triggering api/chat
              setMessages(prev => [
                ...prev,
                {
                  id: `user_${Date.now()}`,
                  role: "user",
                  content: data.content,
                  createdAt: new Date()
                } as Message
              ]);
            } else if (data.type === 'text') {
              if (fillerAudioRef.current) {
                fillerAudioRef.current.pause();
                fillerAudioRef.current = null;
              }
              const chunk = data.content;
              turnTextAccumulatorRef.current += chunk;
              
              console.log("[AI]", chunk);

              // Live UI update in the call component
              setLiveTranscript(prev => {
                const updated = prev + chunk;
                return updated.length > 200 ? updated.substring(updated.length - 200) : updated;
              });

              // Sync to chat history bubbles
              if (!currentAiMessageIdRef.current) {
                const newId = `ai_${Date.now()}`;
                currentAiMessageIdRef.current = newId;
                setMessages(prev => [
                  ...prev,
                  { 
                    id: newId, 
                    role: "assistant", 
                    content: chunk,
                    createdAt: new Date()
                  } as Message
                ]);
              } else {
                setMessages(prev => prev.map(m => 
                  m.id === currentAiMessageIdRef.current 
                    ? { ...m, content: turnTextAccumulatorRef.current } 
                    : m
                ));
              }
            } else if (data.type === 'turn_complete') {
              // Reset the provisional message tracker for the next turn
              currentAiMessageIdRef.current = null;
              turnTextAccumulatorRef.current = "";
            }
          } catch (_err) { /* ignore parse errors */ }
        } else if (e.data instanceof Blob) {
          // Raw PCM audio from Gemini Native Audio (24kHz, Int16)
          const arrayBuffer = await e.data.arrayBuffer();
          if (!audioCtxRef.current || arrayBuffer.byteLength === 0) return;

          // Stop filler if playing
          if (fillerAudioRef.current) {
            fillerAudioRef.current.pause();
            fillerAudioRef.current = null;
          }

          if (!isAiSpeakingRef.current) {
            isAiSpeakingRef.current = true;
            setIsAiSpeaking(true);
            setStatusText("Lunaa đang nói...");
          }

          // Decode PCM Int16 → Float32
          const int16 = new Int16Array(arrayBuffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
          }

          // Gemini Native Audio = 24kHz PCM
          const audioBuffer = audioCtxRef.current.createBuffer(1, float32.length, AUDIO_SAMPLE_RATE);
          audioBuffer.getChannelData(0).set(float32);

          const source = audioCtxRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtxRef.current.destination);

          const currentTime = audioCtxRef.current.currentTime;
          const startTime = Math.max(currentTime, nextAudioTimeRef.current);
          source.start(startTime);
          activeSourcesRef.current.push(source);
          nextAudioTimeRef.current = startTime + audioBuffer.duration;

          source.onended = () => {
            const idx = activeSourcesRef.current.indexOf(source);
            if (idx > -1) activeSourcesRef.current.splice(idx, 1);

            if (activeSourcesRef.current.length === 0 && audioCtxRef.current) {
              if (audioCtxRef.current.currentTime >= nextAudioTimeRef.current - 0.1) {
                isAiSpeakingRef.current = false;
                setIsAiSpeaking(false);
                setStatusText("Đang nghe...");
                setLiveTranscript("");
              }
            }
          };
        }
      };

      ws.onclose = () => {
        setIsActive(false);
        stopCall();
      };

      // Stream PCM from mic to server
      workletNode.port.onmessage = (e) => {
        if (ws.readyState === WebSocket.OPEN && !isAiSpeakingRef.current) {
          ws.send(e.data);
        }
      };

      // VAD with hark
      const speech = hark(stream, { threshold: -55, play: false });
      harkRef.current = speech;

      speech.on('speaking', () => {
        if (ws.readyState === WebSocket.OPEN) {
          if (isAiSpeakingRef.current) {
            interruptAI();
          } else {
            ws.send('START_TURN');
          }
        }
      });

      speech.on('stopped_speaking', () => {
        if (ws.readyState === WebSocket.OPEN && !isAiSpeakingRef.current) {
          ws.send('END_TURN');
          setStatusText("AI đang suy nghĩ...");
        }
      });

    } catch (e) {
      console.error("Mic error:", e);
      alert("Cần cấp quyền Microphone!");
    }
  };

  const stopCall = useCallback(() => {
    setIsActive(false);
    setIsListening(false);
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
    setStatusText("Nhấn để bắt đầu cuộc gọi");
    setLiveTranscript("");
    stopAllAudio();

    if (harkRef.current) { harkRef.current.stop(); harkRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (workletNodeRef.current) { workletNodeRef.current.disconnect(); workletNodeRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  }, [stopAllAudio]);

  // If not in call mode and no call is active, don't show anything
  if (!isViewVisible && !isActive) return null;

  // If call is active but user is in Chat tab, show a small persistent indicator
  if (!isViewVisible && isActive) {
    return (
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--accent-primary)]/30 p-2 pl-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] animate-pulse">
            Đang trong cuộc gọi
          </span>
          <span className="text-xs text-[var(--text-secondary)] truncate max-w-[100px]">
            {isAiSpeaking ? "Lunaa đang nói..." : "Đang nghe..."}
          </span>
        </div>
        <div className="relative">
          {isAiSpeaking && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-x-0 rounded-full bg-[var(--accent-primary)] opacity-30"
            />
          )}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg">
            {isAiSpeaking ? "✋" : "🎤"}
          </div>
        </div>
        <button 
          onClick={stopCall}
          className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="flex w-full max-w-lg items-center justify-between gap-4">

        {/* Status Text */}
        <div className="flex-1 text-left">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Lunaa AI</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {liveTranscript ? `"${liveTranscript}"` : statusText}
          </p>
        </div>

        {/* Small avatar orb */}
        <div className="relative flex items-center justify-center w-16 h-16 mx-4">
          {isListening && !isAiSpeaking && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-x-0 rounded-full bg-green-500 blur-lg"
            />
          )}

          {isAiSpeaking && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-[var(--accent-primary)] opacity-30"
            />
          )}

          <div
            onClick={() => { if (isAiSpeakingRef.current) interruptAI(); }}
            className={`z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all duration-500 hover:scale-105 cursor-pointer ${isActive
                ? isListening && !isAiSpeaking
                  ? "bg-green-500 scale-125 animate-pulse"
                  : isAiSpeaking
                    ? "bg-gradient-to-tr from-orange-400 to-red-500 scale-110"
                    : "bg-gradient-to-tr from-blue-500 to-cyan-400 scale-110"
                : "bg-gray-800 scale-100"
              }`}
          >
            {isAiSpeaking ? "✋" : isActive ? <Mic size={20} className="text-white" /> : "🌙"}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-1 flex justify-end">
          {!isActive ? (
            <button
              onClick={startCall}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all"
            >
              <PhoneCall size={20} />
            </button>
          ) : (
            <button
              onClick={stopCall}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all"
            >
              <PhoneOff size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
