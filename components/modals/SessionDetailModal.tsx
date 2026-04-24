import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, GitCommit } from "lucide-react";
import type { SessionHistory } from "@/lib/local-rag";
import ReactMarkdown from "react-markdown";

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionHistory | null;
}

export default function SessionDetailModal({
  isOpen,
  onClose,
  session,
}: SessionDetailModalProps) {
  if (!session) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--bg-main)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Chi tiết phiên tham vấn
                </h2>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-1">
                  <Calendar size={14} />
                  {new Date(session.timestamp).toLocaleString("vi-VN", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-card)]">
              <div className="flex items-center gap-2 mb-4 text-[var(--accent-primary)] font-medium">
                <GitCommit size={18} />
                <h3>Tổng kết bằng AI</h3>
              </div>
              <div className="prose prose-invert max-w-none text-sm text-[var(--text-secondary)]">
                <ReactMarkdown>{session.summary}</ReactMarkdown>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end bg-[var(--bg-card)] shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full font-medium text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
