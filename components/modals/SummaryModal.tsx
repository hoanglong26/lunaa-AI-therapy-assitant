"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Download, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  summary: string;
  onClose: () => void;
  onNewSession: () => void;
}

export default function SummaryModal({
  isOpen,
  isLoading,
  summary,
  onClose,
  onNewSession,
}: SummaryModalProps) {
  const handleDownload = () => {
    const el = document.createElement("a");
    const content = `Tổng kết buổi trò chuyện với Luna\n${new Date().toLocaleDateString("vi-VN")}\n\n${summary}`;
    el.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    el.download = `Luna-tong-ket-${Date.now()}.txt`;
    el.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 modal-backdrop"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed inset-x-4 top-8 bottom-8 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-8 sm:bottom-8 sm:w-full sm:max-w-2xl z-50 glass rounded-3xl border border-[var(--border-subtle)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Tổng kết buổi trò chuyện
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date().toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center animate-pulse">
                    <Heart size={20} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-[var(--text-secondary)] text-sm">
                      Luna đang viết tổng kết cho bạn...
                    </p>
                    <div className="flex justify-center gap-1.5 mt-3">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose-luna text-sm">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {!isLoading && summary && (
              <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  <Download size={15} />
                  Lưu tổng kết
                </button>
                <div className="flex-1" />
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={onNewSession}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md shadow-[var(--accent-glow)] hover:shadow-lg transition-all btn-glow"
                >
                  <RotateCcw size={14} />
                  Buổi mới
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
