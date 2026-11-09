"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, ArrowUp, Square } from "lucide-react";

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
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
    <div className="relative z-10 px-4 sm:px-6 pb-5 pt-2 max-w-3xl w-full mx-auto">
      {/* Live voice transcript preview */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 px-3.5 py-2 rounded-[var(--ss-radius-md)] bg-[var(--ss-accent-soft)] border border-[var(--ss-accent-border)] flex items-center gap-2 text-[12.5px] text-[var(--ss-text-strong)]"
          >
            <Mic
              size={14}
              strokeWidth={1.5}
              className="text-[var(--ss-accent-text)] shrink-0"
            />
            <span className="italic">{transcript}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={onSubmit}
        className="bg-[var(--ss-surface)] rounded-[12px] border border-[var(--ss-line)] focus-within:border-[var(--ss-accent-border)] p-2.5 pl-3.5 flex items-end gap-2.5 transition-colors shadow-[var(--ss-shadow-card)]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Đang lắng nghe giọng nói của bạn..."
              : "Chia sẻ điều bạn đang suy nghĩ... (Enter để gửi)"
          }
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-[var(--ss-text-strong)] placeholder:text-[var(--ss-text-faint)] text-[13.5px] leading-[1.5] resize-none outline-none max-h-34 min-h-[28px] py-1 disabled:opacity-50"
        />

        {/* Control group with 8px separation */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && (
            <button
              type="button"
              onClick={onStop}
              className="w-8 h-8 rounded-[var(--ss-radius-md)] bg-[var(--ss-raised)] border border-[var(--ss-line)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-danger)] transition-colors"
              title="Dừng phản hồi"
            >
              <Square size={12} fill="currentColor" />
            </button>
          )}

          {isSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading || isSpeaking}
              className={`relative w-8 h-8 rounded-[var(--ss-radius-md)] flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-[var(--ss-danger)] text-white pulse-ring"
                  : "bg-[var(--ss-raised)] text-[var(--ss-icon)] border border-[var(--ss-line)] hover:text-[var(--ss-text-strong)]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isListening ? "Dừng ghi âm" : "Nhập bằng giọng nói"}
            >
              {isListening ? (
                <MicOff size={15} strokeWidth={1.5} />
              ) : (
                <Mic size={15} strokeWidth={1.5} />
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-[var(--ss-radius-md)] bg-[var(--ss-accent)] hover:bg-[var(--ss-accent-hover)] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Gửi tin nhắn"
          >
            <ArrowUp size={15} strokeWidth={1.75} />
          </button>
        </div>
      </form>
    </div>
  );
}
