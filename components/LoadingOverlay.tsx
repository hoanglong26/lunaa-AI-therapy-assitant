'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-main)]/80 backdrop-blur-xl">
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--accent-primary)]/20 rounded-full blur-[60px] animate-pulse" />
        
        {/* Central Animation */}
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 border-4 border-[var(--accent-primary)]/20 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-t-[var(--accent-primary)] border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🌙
          </div>
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-medium text-[var(--text-main)] tracking-tight"
          >
            Lunaa đang kết nối...
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-[var(--text-secondary)] font-light max-w-[250px] text-center leading-relaxed"
          >
            {message}
          </motion.p>
        </div>

        {/* Dynamic Progress Indicator (Optional visual) */}
        <div className="w-16 h-[2px] bg-[var(--border-subtle)] overflow-hidden rounded-full">
          <motion.div 
            className="w-full h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
