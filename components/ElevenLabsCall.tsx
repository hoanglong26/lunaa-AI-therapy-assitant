"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PhoneOff, PhoneCall, Mic, AudioLines } from "lucide-react";
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
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-[var(--ss-raised)] border border-[var(--ss-accent-border)] px-3.5 py-2 rounded-full shadow-[var(--ss-shadow-window)]">
        <span className="w-2 h-2 rounded-full bg-[var(--ss-accent)] animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[var(--ss-text-strong)]">
            Voice Studio đang hoạt động
          </span>
          <span className="text-[11px] text-[var(--ss-text)]">
            {isAiSpeaking ? "Luna đang phản hồi..." : "Đang lắng nghe..."}
          </span>
        </div>
        <button
          onClick={stopCall}
          className="w-7 h-7 rounded-full bg-[var(--ss-danger-soft)] hover:bg-[var(--ss-danger)] text-[var(--ss-danger)] hover:text-white flex items-center justify-center transition-colors"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff size={14} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 w-full h-full">
      <div className="w-full max-w-md bg-[var(--ss-surface)] border border-[var(--ss-line)] rounded-[var(--ss-radius-window)] shadow-[var(--ss-shadow-window)] overflow-hidden">
        {/* 38px Window Chrome */}
        <div className="h-[38px] px-4 bg-[var(--ss-chrome)] border-b border-[var(--ss-line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AudioLines size={14} strokeWidth={1.5} className="text-[var(--ss-icon)]" />
            <span className="text-[12px] font-medium text-[var(--ss-text)]">
              Luna Voice Studio • ElevenLabs
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${
              isActive
                ? "bg-[var(--ss-accent-soft)] text-[var(--ss-accent-text)] border border-[var(--ss-accent-border)]"
                : "bg-[var(--ss-raised)] text-[var(--ss-text-faint)] border border-[var(--ss-line)]"
            }`}
          >
            {isActive ? "Đang kết nối" : "Chờ kết nối"}
          </span>
        </div>

        {/* Studio Stage Body */}
        <div className="p-8 flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            {isActive && (
              <motion.div
                animate={{
                  scale: isAiSpeaking ? [1, 1.28, 1] : [1, 1.14, 1],
                  opacity: isAiSpeaking ? [0.35, 0.12, 0.35] : [0.22, 0.08, 0.22],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[var(--ss-accent)]"
              />
            )}

            <div
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all border ${
                isActive
                  ? isAiSpeaking
                    ? "bg-[var(--ss-accent)] border-[var(--ss-accent-border)] text-white"
                    : "bg-[var(--ss-raised)] border-[var(--ss-accent-border)] text-[var(--ss-accent-text)]"
                  : "bg-[var(--ss-raised)] border-[var(--ss-line)] text-[var(--ss-icon)]"
              }`}
            >
              {isAiSpeaking ? (
                <AudioLines size={22} strokeWidth={1.5} />
              ) : (
                <Mic size={20} strokeWidth={1.5} />
              )}
            </div>
          </div>

          <div className="text-[15px] font-semibold text-[var(--ss-text-strong)] mb-1">
            {isActive
              ? isAiSpeaking
                ? "Luna đang chia sẻ"
                : "Đang lắng nghe bạn..."
              : "Không gian trò chuyện bằng giọng nói"}
          </div>
          <p className="text-[12.5px] text-[var(--ss-text)] max-w-xs leading-relaxed">
            {statusText}
          </p>

          <div className="mt-7 pt-5 border-t border-[var(--ss-line-faint)] w-full flex items-center justify-center gap-3">
            {!isActive ? (
              <button
                type="button"
                onClick={startCall}
                className="h-9 px-5 rounded-[var(--ss-radius-md)] bg-[var(--ss-accent)] hover:bg-[var(--ss-accent-hover)] text-white text-[13px] font-medium flex items-center gap-2 transition-colors"
              >
                <PhoneCall size={15} strokeWidth={1.5} />
                <span>Bắt đầu phiên gọi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCall}
                className="h-9 px-5 rounded-[var(--ss-radius-md)] bg-[var(--ss-danger-soft)] hover:bg-[var(--ss-danger)] text-[var(--ss-danger)] hover:text-white border border-red-500/20 text-[13px] font-medium flex items-center gap-2 transition-colors"
              >
                <PhoneOff size={15} strokeWidth={1.5} />
                <span>Kết thúc cuộc gọi</span>
              </button>
            )}
          </div>
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
