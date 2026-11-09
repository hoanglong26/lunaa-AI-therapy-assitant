"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageSquare, AudioLines, X } from "lucide-react";

interface NewSessionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (useRAG: boolean, mode: "voice" | "text") => void;
}

export default function NewSessionPromptModal({
  isOpen,
  onClose,
  onConfirm,
}: NewSessionPromptModalProps) {
  const [useRAG, setUseRAG] = React.useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-[var(--ss-surface)] rounded-[var(--ss-radius-window)] shadow-[var(--ss-shadow-window)] border border-[var(--ss-line)] overflow-hidden"
          >
            {/* 38px Window Chrome */}
            <div className="h-[38px] px-4 bg-[var(--ss-chrome)] border-b border-[var(--ss-line)] flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--ss-text)]">
                Thiết lập phiên tham vấn
              </span>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-[var(--ss-radius-sm)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] transition-colors"
                title="Đóng"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <div className="text-[15px] font-semibold text-[var(--ss-text-strong)] mb-1">
                  Bắt đầu không gian lắng nghe
                </div>
                <p className="text-[13px] text-[var(--ss-text)] leading-relaxed">
                  Tùy chỉnh khả năng liên kết ký ức từ các buổi trò chuyện trước
                  và chọn phương thức giao tiếp phù hợp với bạn hôm nay.
                </p>
              </div>

              {/* Memory Toggle Row */}
              <label
                htmlFor="rag-toggle"
                className="bg-[var(--ss-canvas)] border border-[var(--ss-line)] hover:border-[var(--ss-accent-border)] rounded-[var(--ss-radius-lg)] p-3.5 flex items-start gap-3 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  id="rag-toggle"
                  checked={useRAG}
                  onChange={(e) => setUseRAG(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--ss-line)] bg-[var(--ss-surface)] accent-[var(--ss-accent)] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ss-text-strong)]">
                    <Brain
                      size={14}
                      strokeWidth={1.5}
                      className="text-[var(--ss-accent-text)]"
                    />
                    <span>Liên kết ký ức cục bộ (Khuyên dùng)</span>
                  </div>
                  <span className="block text-[12px] text-[var(--ss-text-faint)] mt-1 leading-relaxed">
                    Luna sẽ đối chiếu các ghi chú tổng kết trong quá khứ để
                    thấu hiểu mạch câu chuyện của bạn.
                  </span>
                </div>
              </label>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onConfirm(useRAG, "text")}
                  className="flex flex-col items-start gap-2.5 p-3.5 rounded-[var(--ss-radius-lg)] bg-[var(--ss-raised)] hover:bg-[var(--ss-accent-soft)] border border-[var(--ss-line)] hover:border-[var(--ss-accent-border)] transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-[var(--ss-radius-md)] bg-[var(--ss-surface)] border border-[var(--ss-line)] flex items-center justify-center text-[var(--ss-icon)] group-hover:text-[var(--ss-accent-text)] transition-colors">
                    <MessageSquare size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[var(--ss-text-strong)]">
                      Hội thoại văn bản
                    </div>
                    <div className="text-[11px] text-[var(--ss-text-faint)] mt-0.5">
                      Nhắn tin & đọc phản hồi
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onConfirm(useRAG, "voice")}
                  className="flex flex-col items-start gap-2.5 p-3.5 rounded-[var(--ss-radius-lg)] bg-[var(--ss-accent-soft)] hover:bg-[var(--ss-accent)] border border-[var(--ss-accent-border)] transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-[var(--ss-radius-md)] bg-[var(--ss-surface)]/80 border border-[var(--ss-accent-border)] flex items-center justify-center text-[var(--ss-accent-text)] group-hover:text-white transition-colors">
                    <AudioLines size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[var(--ss-text-strong)] group-hover:text-white">
                      Voice Studio
                    </div>
                    <div className="text-[11px] text-[var(--ss-accent-text)] group-hover:text-white/80 mt-0.5">
                      Trò chuyện giọng nói trực tiếp
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
