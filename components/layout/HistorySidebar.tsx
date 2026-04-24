import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MessageSquare, Plus } from "lucide-react";
import type { SessionHistory } from "@/lib/local-rag";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistory[];
  onSelectSession: (session: SessionHistory) => void;
  onNewSession: () => void;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewSession,
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 w-80 h-full bg-[var(--bg-main)] border-r border-[var(--border-subtle)] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Lịch sử tham vấn
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              <button
                onClick={() => {
                  onClose();
                  onNewSession();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all font-medium"
              >
                <Plus size={18} />
                Tạo phiên mới
              </button>

              <div className="space-y-2 mt-6">
                {sessions.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-muted)] py-8">
                    Chưa có lịch sử tham vấn nào.
                  </p>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className="w-full text-left p-4 flex flex-col gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors group"
                    >
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                        {session.title || "Phiên tham vấn"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Calendar size={12} />
                        {new Date(session.timestamp).toLocaleString("vi-VN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const matches = session.summary.match(/#[\p{L}\w_-]+/gu);
                          const tags = matches ? Array.from(new Set(matches)).slice(0, 4) : [];
                          if (tags.length === 0) {
                            return <span className="text-xs text-[var(--text-muted)] italic">Chưa có từ khóa</span>;
                          }
                          return tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium text-[0.7rem] border border-[var(--accent-primary)]/20"
                            >
                              {tag}
                            </span>
                          ));
                        })()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
