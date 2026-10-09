"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PhoneOff, PhoneCall, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Message } from "ai";
import { useConversation, ConversationProvider } from '@elevenlabs/react';

interface ElevenLabsCallProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  isViewVisible: boolean;
  agentId: string;
}

function InnerElevenLabsCall({ messages, setMessages, isViewVisible, agentId }: ElevenLabsCallProps) {
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState("Nhấn để kết nối với ElevenLabs");
  
  const conversation = useConversation({
    onConnect: () => {
      setIsActive(true);
      setStatusText("Đang nghe...");
    },
    onDisconnect: () => {
      setIsActive(false);
      setStatusText("Nhấn để kết nối với ElevenLabs");
    },
    onMessage: (message: any) => {
      console.log("ElevenLabs message:", message);
      // Optional: Add to messages if we want to show chat history
      if (message.source === "user") {
        setMessages((prev) => [
          ...prev,
          {
            id: `user_${Date.now()}`,
            role: "user",
            content: message.message,
            createdAt: new Date(),
          } as Message,
        ]);
      } else if (message.source === "ai") {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: "assistant",
            content: message.message,
            createdAt: new Date(),
          } as Message,
        ]);
      }
    },
    onError: (error: any) => {
      console.error("ElevenLabs error:", error);
      setStatusText("Lỗi kết nối");
      setIsActive(false);
    }
  });

  const startCall = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatusText("Đang kết nối...");
      await conversation.startSession({
        agentId: agentId,
      });
    } catch (error) {
      console.error("Failed to start ElevenLabs session:", error);
      alert("Lỗi khởi tạo (Hãy kiểm tra mic hoặc Agent ID)");
      setStatusText("Nhấn để kết nối với ElevenLabs");
    }
  };

  const stopCall = async () => {
    await conversation.endSession();
    setIsActive(false);
    setStatusText("Nhấn để kết nối với ElevenLabs");
  };

  const isListening = conversation.status === "connected" && !conversation.isSpeaking;
  const isAiSpeaking = conversation.isSpeaking;

  if (!isViewVisible && !isActive) return null;

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
    <div className="flex flex-col items-center justify-center p-4 w-full h-full">
      <div className="flex w-full items-center justify-center gap-8">
        {/* Small avatar orb */}
        <div className="relative flex items-center justify-center w-16 h-16">
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
            className={`z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all duration-500 ${
              isActive
                ? isListening && !isAiSpeaking
                  ? "bg-green-500 scale-125 animate-pulse"
                  : isAiSpeaking
                    ? "bg-gradient-to-tr from-orange-400 to-red-500 scale-110"
                    : "bg-gradient-to-tr from-blue-500 to-cyan-400 scale-110"
                : "bg-gray-800 scale-100 hover:scale-105 cursor-pointer"
            }`}
          >
            {isAiSpeaking ? "✋" : isActive ? <Mic size={20} className="text-white" /> : "🌙"}
          </div>
        </div>

        {/* Action Button */}
        <div>
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


export default function ElevenLabsCall(props: ElevenLabsCallProps) {
  return (
    <ConversationProvider>
      <InnerElevenLabsCall {...props} />
    </ConversationProvider>
  );
}
