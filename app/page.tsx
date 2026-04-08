"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import Header from "@/components/layout/Header";
import MessageBubble, {
  TypingIndicator,
} from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import SummaryModal from "@/components/modals/SummaryModal";
import CustomRealtimeCall from "@/components/CustomRealtimeCall";
import { useSpeech } from "@/hooks/useSpeech";
import { Phone, MessageCircle } from "lucide-react";

export default function Home() {
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false); // Toggle mode
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAiMessageRef = useRef<string>("");

  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSupported,
  } = useSpeech();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    append,
    setMessages,
    setInput,
  } = useChat({ api: "/api/chat" });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak AI responses
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (
      last?.role === "assistant" &&
      !isLoading &&
      last.content !== lastAiMessageRef.current
    ) {
      lastAiMessageRef.current = last.content;
      if (!isCallMode) {
        speak(last.content);
      }
    }
  }, [messages, isLoading, speak, isCallMode]);

  // Inject transcript into input when speech ends
  useEffect(() => {
    if (!isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript, setInput]);

  // End session → get summary
  const handleEndSession = async () => {
    if (messages.length < 2) return;
    cancelSpeech();
    setShowSummary(true);
    setSummaryLoading(true);
    setSummaryText("");

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setSummaryText(data.summary ?? "Không thể tạo tổng kết lúc này.");
    } catch {
      setSummaryText("Đã xảy ra lỗi khi tổng kết. Vui lòng thử lại.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSummaryText("");
    setShowSummary(false);
    cancelSpeech();
  };

  return (
    <>
      {/* Ambient background */}
      <div className="bg-ambient" />

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">
        <Header
          onEndSession={handleEndSession}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          onCancelSpeech={cancelSpeech}
        />

        {/* Mode Toggle Switch */}
        <div className="flex justify-center py-4 mb-2">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-1 rounded-full flex items-center shadow-lg relative">
            <button
              onClick={() => setIsCallMode(false)}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !isCallMode ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <MessageCircle size={18} />
              Trò chuyện
            </button>
            <button
              onClick={() => { setIsCallMode(true); stop(); cancelSpeech(); }}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                isCallMode ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Phone size={18} />
              Gọi Điện
            </button>
            
            {/* Sliding Pill Background */}
            <div 
              className={`absolute top-1 bottom-1 w-1/2 bg-[var(--accent-primary)] rounded-full transition-transform duration-300 ease-out z-0 shadow-md shadow-[var(--accent-glow)]`}
              style={{ transform: isCallMode ? "translateX(100%)" : "translateX(0)" }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
              {/* Welcome state */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-6 text-center px-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-4xl shadow-2xl shadow-[var(--accent-glow)]">
                🌙
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                  Xin chào, tôi là Luna
                </h2>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm">
                  Tôi ở đây để lắng nghe và đồng hành cùng bạn. Hãy chia sẻ
                  điều bạn đang suy nghĩ hay cảm nhận hôm nay — không có gì là
                  quá lớn hay quá nhỏ.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {[
                  "Tôi đang cảm thấy lo lắng",
                  "Tôi cần ai đó lắng nghe",
                  "Tôi muốn quản lý stress tốt hơn",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator key="typing" />}
          </AnimatePresence>

              <div ref={messagesEndRef} />
            </main>

            {isCallMode ? (
              <CustomRealtimeCall 
                messages={messages} 
                append={append} 
                stop={stop} 
                isLoading={isLoading} 
              />
            ) : (
              <ChatInput
                input={input}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isListening={isListening}
                isSpeaking={isSpeaking}
                transcript={transcript}
                onStartListening={startListening}
                onStopListening={stopListening}
                onStop={stop}
                isSupported={isSupported}
              />
            )}
      </div>

      {/* Summary modal */}
      <SummaryModal
        isOpen={showSummary}
        isLoading={summaryLoading}
        summary={summaryText}
        onClose={() => setShowSummary(false)}
        onNewSession={handleNewSession}
      />
    </>
  );
}
