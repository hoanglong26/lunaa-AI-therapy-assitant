"use client";

import {
  PanelLeft,
  Plus,
  Volume2,
  VolumeX,
  MessageSquare,
  AudioLines,
  Brain,
  CheckCircle2,
} from "lucide-react";

interface HeaderProps {
  onEndSession: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  onCancelSpeech: () => void;
  onOpenHistory: () => void;
  onNewSessionBtnClick: () => void;
  isCallMode?: boolean;
  onToggleCallMode?: (callMode: boolean) => void;
  useRAGContext?: boolean;
  hasMessages?: boolean;
}

export default function Header({
  onEndSession,
  isLoading,
  isSpeaking,
  onCancelSpeech,
  onOpenHistory,
  onNewSessionBtnClick,
  isCallMode = false,
  onToggleCallMode,
  useRAGContext = true,
  hasMessages = false,
}: HeaderProps) {
  return (
    <header className="h-13 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[var(--ss-chrome)] border-b border-[var(--ss-line)] select-none z-20">
      {/* Left: Studio Sidebar Toggle & Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenHistory}
          className="w-8 h-8 rounded-[var(--ss-radius-sm)] flex items-center justify-center text-[var(--ss-icon)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] transition-colors"
          title="Đóng/mở bảng lịch sử & ký ức"
        >
          <PanelLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="h-4 w-[1px] bg-[var(--ss-line)]" />

        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[var(--ss-accent)]" />
          <span className="text-[14px] font-semibold tracking-tight text-[var(--ss-text-strong)]">
            Luna
          </span>
          <span className="hidden md:inline-block text-[12px] text-[var(--ss-text-faint)]">
            Tham vấn & Lắng nghe chủ động
          </span>

          {useRAGContext && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ss-accent-soft)] text-[var(--ss-accent-text)] border border-[var(--ss-accent-border)]"
              title="Đang sử dụng bối cảnh ký ức từ các phiên trước"
            >
              <Brain size={11} strokeWidth={1.75} />
              Ký ức liên kết
            </span>
          )}

          {isLoading && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-[var(--ss-raised)] text-[var(--ss-text)] border border-[var(--ss-line)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ss-accent)] animate-pulse" />
              Đang phản hồi
            </span>
          )}
        </div>
      </div>

      {/* Center: Segmented Mode Switch (Chat vs Voice Studio) */}
      {onToggleCallMode && (
        <div className="flex items-center p-0.5 rounded-[var(--ss-radius-md)] bg-[var(--ss-canvas)] border border-[var(--ss-line)]">
          <button
            type="button"
            onClick={() => onToggleCallMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
              !isCallMode
                ? "bg-[var(--ss-raised)] text-[var(--ss-text-strong)] shadow-xs"
                : "text-[var(--ss-text)] hover:text-[var(--ss-text-strong)]"
            }`}
          >
            <MessageSquare size={13} strokeWidth={1.5} />
            <span>Hội thoại</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleCallMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
              isCallMode
                ? "bg-[var(--ss-raised)] text-[var(--ss-accent-text)] shadow-xs"
                : "text-[var(--ss-text)] hover:text-[var(--ss-text-strong)]"
            }`}
          >
            <AudioLines size={13} strokeWidth={1.5} />
            <span>Voice Studio</span>
          </button>
        </div>
      )}

      {/* Right: Session Controls */}
      <div className="flex items-center gap-2">
        {isSpeaking && (
          <button
            onClick={onCancelSpeech}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--ss-radius-sm)] text-[12px] text-[var(--ss-text)] bg-[var(--ss-raised)] border border-[var(--ss-line)] hover:text-[var(--ss-text-strong)] transition-colors"
            title="Tắt giọng đọc"
          >
            <VolumeX size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Dừng đọc</span>
          </button>
        )}

        <button
          onClick={onNewSessionBtnClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--ss-radius-sm)] text-[12px] font-medium text-[var(--ss-text)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] border border-transparent hover:border-[var(--ss-line)] transition-colors"
          title="Thiết lập phiên mới"
        >
          <Plus size={14} strokeWidth={1.5} />
          <span className="hidden sm:inline">Phiên mới</span>
        </button>

        <button
          onClick={onEndSession}
          disabled={!hasMessages && !isCallMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ss-radius-sm)] text-[12px] font-medium bg-[var(--ss-accent-soft)] text-[var(--ss-accent-text)] border border-[var(--ss-accent-border)] hover:bg-[var(--ss-accent)] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Kết thúc buổi trò chuyện và nhận bản tổng kết"
        >
          <CheckCircle2 size={14} strokeWidth={1.5} />
          <span className="hidden sm:inline">Tổng kết phiên</span>
        </button>
      </div>
    </header>
  );
}
