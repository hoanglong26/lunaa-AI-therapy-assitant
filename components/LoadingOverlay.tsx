"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface LoadingOverlayProps {
  message: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--ss-canvas)]/92 backdrop-blur-sm">
      <div className="w-full max-w-xs p-6 rounded-[var(--ss-radius-window)] bg-[var(--ss-surface)] border border-[var(--ss-line)] shadow-[var(--ss-shadow-window)] flex flex-col items-center text-center gap-4">
        <div className="w-10 h-10 rounded-[var(--ss-radius-lg)] bg-[var(--ss-accent-soft)] border border-[var(--ss-accent-border)] flex items-center justify-center text-[var(--ss-accent-text)]">
          <Brain size={18} strokeWidth={1.5} />
        </div>

        <div className="space-y-1">
          <div className="text-[14px] font-semibold text-[var(--ss-text-strong)]">
            Đang chuẩn bị không gian
          </div>
          <p className="text-[12px] text-[var(--ss-text)] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="w-28 h-[2px] bg-[var(--ss-raised)] overflow-hidden rounded-full">
          <motion.div
            className="w-full h-full bg-[var(--ss-accent)]"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
