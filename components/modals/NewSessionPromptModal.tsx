import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, MessageSquareText, Phone } from "lucide-react";

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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[var(--bg-main)] rounded-3xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-[0_0_20px_var(--accent-glow)] mb-4">
                  <BrainCircuit size={32} />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Thiết lập phiên tham vấn
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Bắt đầu một phiên tham vấn mới với Luna. Bạn có thể tùy chỉnh
                  khả năng ghi nhớ của AI và phương thức giao tiếp.
                </p>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="rag-toggle"
                  checked={useRAG}
                  onChange={(e) => setUseRAG(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] accent-[var(--accent-primary)] cursor-pointer"
                />
                <label htmlFor="rag-toggle" className="cursor-pointer">
                  <span className="block text-sm font-medium text-[var(--text-primary)] mb-0.5">
                    Ghi nhớ bối cảnh (Recommended)
                  </span>
                  <span className="block text-xs text-[var(--text-muted)]">
                    Luna sẽ triệu hồi các dữ kiện từ các phiên tham vấn trong quá
                    khứ để hiểu bạn sâu sắc hơn. Bỏ chọn nếu bạn muốn bắt đầu một
                    trang giấy trắng hoàn toàn.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onConfirm(useRAG, "text")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-primary)]/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-[var(--bg-main)] group-hover:bg-[var(--accent-primary)]/10 group-hover:text-[var(--accent-primary)] transition-colors">
                    <MessageSquareText size={20} />
                  </div>
                  Nhắn tin Text
                </button>

                <button
                  onClick={() => onConfirm(useRAG, "voice")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-white bg-[var(--accent-primary)] border border-transparent shadow-[0_4px_14px_0_var(--accent-glow)] hover:shadow-[0_6px_20px_0_var(--accent-glow)] transition-all group hover:opacity-95"
                >
                  <div className="p-2 rounded-full bg-white/20">
                    <Phone size={20} />
                  </div>
                  Gọi Voice AI
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
