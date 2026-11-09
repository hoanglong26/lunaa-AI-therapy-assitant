"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText } from "lucide-react";
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
            className="absolute inset-0 modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--ss-surface)] rounded-[var(--ss-radius-window)] shadow-[var(--ss-shadow-window)] border border-[var(--ss-line)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--ss-chrome)] border-b border-[var(--ss-line)] shrink-0">
              <div>
                <div className="text-[14px] font-semibold text-[var(--ss-text-strong)]">
                  {session.title || "Chi tiết phiên tham vấn"}
                </div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ss-text-faint)] mt-0.5">
                  <Calendar size={12} strokeWidth={1.5} />
                  <span>
                    {new Date(session.timestamp).toLocaleString("vi-VN", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-[var(--ss-radius-sm)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] transition-colors"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--ss-surface)]">
              <div className="flex items-center gap-2 mb-3 text-[var(--ss-accent-text)] text-[12.5px] font-medium">
                <FileText size={14} strokeWidth={1.5} />
                <span>Bản ghi tổng kết</span>
              </div>
              <div className="prose-luna text-[13.5px] text-[var(--ss-text-strong)] p-4 rounded-[var(--ss-radius-lg)] bg-[var(--ss-canvas)] border border-[var(--ss-line)]">
                <ReactMarkdown>{session.summary}</ReactMarkdown>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--ss-line)] flex justify-end bg-[var(--ss-chrome)] shrink-0">
              <button
                onClick={onClose}
                className="h-8 px-4 rounded-[var(--ss-radius-md)] text-[12.5px] font-medium text-[var(--ss-text-strong)] bg-[var(--ss-raised)] border border-[var(--ss-line)] hover:bg-[var(--ss-canvas)] transition-colors"
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
