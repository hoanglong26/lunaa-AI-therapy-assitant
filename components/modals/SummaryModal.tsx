"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileCheck2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import React, { useState, useEffect } from "react";

interface SummaryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  summary: string;
  onClose: () => void;
  onSave: (title: string) => void;
}

export default function SummaryModal({
  isOpen,
  isLoading,
  summary,
  onClose,
  onSave,
}: SummaryModalProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(`Phiên tham vấn ${new Date().toLocaleDateString("vi-VN")}`);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 modal-backdrop"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-10 bottom-10 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-10 sm:bottom-10 sm:w-full sm:max-w-2xl z-50 bg-[var(--ss-surface)] rounded-[var(--ss-radius-window)] border border-[var(--ss-line)] shadow-[var(--ss-shadow-window)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--ss-chrome)] border-b border-[var(--ss-line)]">
              <div className="flex items-center gap-2.5">
                <FileCheck2
                  size={16}
                  strokeWidth={1.5}
                  className="text-[var(--ss-accent-text)]"
                />
                <div>
                  <div className="text-[13.5px] font-semibold text-[var(--ss-text-strong)]">
                    Bản tổng kết phiên tham vấn
                  </div>
                  <div className="text-[11px] text-[var(--ss-text-faint)]">
                    {new Date().toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-[var(--ss-radius-sm)] hover:bg-[var(--ss-raised)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-text-strong)] transition-colors"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <p className="text-[var(--ss-text)] text-[13px]">
                    Luna đang tổng hợp ghi chú cho buổi trò chuyện của bạn...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="session-title"
                      className="text-[12px] font-medium text-[var(--ss-text)]"
                    >
                      Tiêu đề lưu trữ
                    </label>
                    <input
                      id="session-title"
                      type="text"
                      className="h-[36px] px-3.5 rounded-[var(--ss-radius-md)] bg-[var(--ss-canvas)] border border-[var(--ss-line)] text-[var(--ss-text-strong)] text-[13px] focus:outline-none focus:border-[var(--ss-accent-border)] transition-colors"
                      placeholder="VD: Ghi chú về giấc ngủ và áp lực công việc..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="prose-luna text-[13.5px] p-4 bg-[var(--ss-canvas)] rounded-[var(--ss-radius-lg)] border border-[var(--ss-line)] text-[var(--ss-text-strong)]">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {!isLoading && summary && (
              <div className="px-5 py-3.5 bg-[var(--ss-chrome)] border-t border-[var(--ss-line)] flex items-center justify-end gap-2.5">
                <button
                  onClick={onClose}
                  className="h-8 px-3.5 rounded-[var(--ss-radius-md)] text-[12.5px] font-medium text-[var(--ss-text)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] transition-colors"
                >
                  Đóng không lưu
                </button>
                <button
                  onClick={() => onSave(title)}
                  className="h-8 flex items-center gap-1.5 px-4 rounded-[var(--ss-radius-md)] text-[12.5px] font-medium bg-[var(--ss-accent)] hover:bg-[var(--ss-accent-hover)] text-white transition-colors"
                >
                  <Download size={14} strokeWidth={1.5} />
                  <span>Lưu vào ký ức cục bộ</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
