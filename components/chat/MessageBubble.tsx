"use client";

import { motion } from "framer-motion";
import { Message } from "ai";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Subtle Speaker Label */}
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        {!isUser && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ss-accent)]" />
        )}
        <span className="text-[11px] font-medium text-[var(--ss-text-faint)]">
          {isUser ? "Bạn" : "Luna"}
        </span>
      </div>

      {/* Surface Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[72%] rounded-[14px] px-4 py-3 ${
          isUser
            ? "bg-[var(--ss-accent-soft)] text-[var(--ss-text-strong)] border border-[var(--ss-accent-border)] rounded-tr-[4px]"
            : "bg-[var(--ss-surface)] text-[var(--ss-text-strong)] border border-[var(--ss-line)] rounded-tl-[4px]"
        }`}
      >
        {isUser ? (
          <p className="text-[13.5px] leading-[1.6] whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="text-[13.5px] leading-[1.6] prose-luna">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex flex-col items-start"
    >
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ss-accent)]" />
        <span className="text-[11px] font-medium text-[var(--ss-text-faint)]">
          Luna đang suy ngẫm
        </span>
      </div>
      <div className="bg-[var(--ss-surface)] border border-[var(--ss-line)] rounded-[14px] rounded-tl-[4px] px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}
