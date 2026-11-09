"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Plus,
  Brain,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { SessionHistory } from "@/lib/local-rag";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistory[];
  onSelectSession: (session: SessionHistory) => void;
  onNewSession: () => void;
  useRAGContext?: boolean;
  onToggleRAGContext?: (val: boolean) => void;
  preloadedContextSummary?: string;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewSession,
  useRAGContext = true,
  onToggleRAGContext,
  preloadedContextSummary,
}: HistorySidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Studio Sidebar Column (Docked on lg+, Drawer on <lg) */}
      <aside
        className={`${
          isOpen
            ? "translate-x-0 lg:w-72 lg:opacity-100"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-r-0"
        } fixed lg:relative top-0 left-0 z-40 lg:z-10 w-72 h-full bg-[var(--ss-surface)] border-r border-[var(--ss-line)] flex flex-col shrink-0 transition-all duration-200 ease-out overflow-hidden select-none`}
      >
        <div className="w-72 h-full flex flex-col">
          {/* Sidebar Chrome Header */}
          <div className="h-13 shrink-0 flex items-center justify-between px-4 border-b border-[var(--ss-line)] bg-[var(--ss-chrome)]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--ss-text-strong)]">
                Lịch sử tham vấn
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ss-raised)] text-[var(--ss-text)] border border-[var(--ss-line)]">
                {sessions.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-[var(--ss-radius-sm)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] transition-colors lg:hidden"
              title="Đóng bảng"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>

          {/* Primary Action */}
          <div className="p-3 border-b border-[var(--ss-line-faint)]">
            <button
              onClick={onNewSession}
              className="w-full h-[34px] flex items-center justify-center gap-2 px-3 rounded-[var(--ss-radius-md)] bg-[var(--ss-raised)] hover:bg-[var(--ss-accent-soft)] text-[12.5px] font-medium text-[var(--ss-text-strong)] hover:text-[var(--ss-accent-text)] border border-[var(--ss-line)] hover:border-[var(--ss-accent-border)] transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} />
              <span>Bắt đầu phiên mới</span>
            </button>
          </div>

          {/* Session Rows List */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <FileText
                  size={20}
                  strokeWidth={1.5}
                  className="mx-auto mb-2 text-[var(--ss-icon-faint)]"
                />
                <p className="text-[12.5px] text-[var(--ss-text)]">
                  Chưa có bản ghi phiên nào
                </p>
                <p className="text-[11.5px] text-[var(--ss-text-faint)] mt-1 leading-relaxed">
                  Các bản tổng kết sau mỗi buổi trò chuyện sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const matches = session.summary.match(/#[\p{L}\w_-]+/gu);
                const tags = matches
                  ? Array.from(new Set(matches)).slice(0, 3)
                  : [];

                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className="w-full text-left px-3 py-2.5 rounded-[var(--ss-radius-md)] hover:bg-[var(--ss-raised)] border border-transparent hover:border-[var(--ss-line)] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-[var(--ss-text-strong)] line-clamp-1 leading-[1.35]">
                        {session.title || "Phiên tham vấn"}
                      </span>
                      <ChevronRight
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0 mt-0.5 text-[var(--ss-icon-faint)] group-hover:text-[var(--ss-text)] transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ss-text-faint)] mt-1">
                      <Calendar size={11} strokeWidth={1.5} />
                      <span>
                        {new Date(session.timestamp).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-[var(--ss-canvas)] text-[var(--ss-text)] text-[10.5px] border border-[var(--ss-line)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Local RAG Memory Footer Panel */}
          <div className="p-3 border-t border-[var(--ss-line)] bg-[var(--ss-chrome)]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ss-text-strong)]">
                <Brain
                  size={14}
                  strokeWidth={1.5}
                  className={
                    useRAGContext
                      ? "text-[var(--ss-accent-text)]"
                      : "text-[var(--ss-icon-faint)]"
                  }
                />
                <span>Bối cảnh ký ức (Local RAG)</span>
              </div>
              {onToggleRAGContext && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={useRAGContext}
                  onClick={() => onToggleRAGContext(!useRAGContext)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                    useRAGContext
                      ? "bg-[var(--ss-accent)]"
                      : "bg-[var(--ss-raised)] border border-[var(--ss-line)]"
                  }`}
                  title="Bật/tắt liên kết ký ức từ các phiên trước"
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      useRAGContext ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>
            <p className="text-[11px] text-[var(--ss-text-faint)] leading-relaxed line-clamp-2">
              {useRAGContext
                ? preloadedContextSummary
                  ? "Đã nạp hành trình từ các phiên trước vào bộ nhớ cục bộ."
                  : "Sẵn sàng ghi nhớ và liên kết các buổi trò chuyện trên thiết bị."
                : "Chế độ trang giấy trắng: không truy xuất ký ức cũ."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
