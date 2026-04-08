"use client";

import { motion } from "framer-motion";
import { PhoneOff, Volume2, VolumeX } from "lucide-react";

interface HeaderProps {
  onEndSession: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  onCancelSpeech: () => void;
}

export default function Header({
  onEndSession,
  isLoading,
  isSpeaking,
  onCancelSpeech,
}: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 glass border-b border-[var(--border-subtle)]">
      {/* Luna identity */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-[var(--accent-glow)]">
            L
          </div>
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--bg-card)]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[var(--text-primary)]">
              Luna
            </h1>
            {isLoading && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[var(--accent-primary)]"
              >
                đang gõ...
              </motion.span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Chuyên gia tâm lý tư vấn • Luôn sẵn sàng lắng nghe
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isSpeaking && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onCancelSpeech}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
            title="Tắt giọng nói"
          >
            <VolumeX size={14} />
            <span>Tắt tiếng</span>
          </motion.button>
        )}

        {!isSpeaking && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)]"
          >
            <Volume2 size={14} />
            <span>Giọng nói bật</span>
          </div>
        )}

        <button
          onClick={onEndSession}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all btn-glow"
          title="Kết thúc buổi trò chuyện và nhận tổng kết"
        >
          <PhoneOff size={15} />
          <span className="hidden sm:inline">Kết thúc</span>
        </button>
      </div>
    </header>
  );
}
