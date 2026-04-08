"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStop: () => void;
  isSupported: boolean;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  isListening,
  isSpeaking,
  transcript,
  onStartListening,
  onStopListening,
  onStop,
  isSupported,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="relative z-10 px-4 pb-6 pt-3">
      {/* Transcript preview */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-sm text-[var(--text-secondary)] italic"
          >
            🎙️ {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-2xl border border-[var(--border-subtle)] p-3 flex items-end gap-3 focus-within:border-[var(--accent-primary)]/40 transition-colors">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Đang nghe... hãy nói điều bạn muốn chia sẻ"
              : "Chia sẻ điều bạn đang cảm thấy... (Enter để gửi)"
          }
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm leading-relaxed resize-none outline-none max-h-36 min-h-[2.25rem] py-1 disabled:opacity-50"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
          {/* Stop streaming */}
          {isLoading && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onStop}
              className="w-9 h-9 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors"
              title="Dừng phản hồi"
            >
              <Square size={14} fill="currentColor" />
            </motion.button>
          )}

          {/* Microphone */}
          {isSupported && (
            <button
              onClick={handleMicClick}
              disabled={isLoading || isSpeaking}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isListening ? "Dừng ghi âm" : "Nhấn để nói"}
            >
              {isListening ? (
                <>
                  <span className="pulse-ring" />
                  <MicOff size={16} />
                </>
              ) : (
                <Mic size={16} />
              )}
            </button>
          )}

          {/* Send */}
          <button
            onClick={(e) => onSubmit(e)}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shadow-md shadow-[var(--accent-glow)] hover:shadow-lg hover:shadow-[var(--accent-glow)] transition-all btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
            title="Gửi tin nhắn"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      <p className="text-center text-[0.65rem] text-[var(--text-muted)] mt-2">
        Luna là AI — không thay thế chẩn đoán chuyên nghiệp. Hỗ trợ khẩn cấp:{" "}
        <span className="text-[var(--accent-secondary)]">1800 599 920</span>
      </p>
    </div>
  );
}
