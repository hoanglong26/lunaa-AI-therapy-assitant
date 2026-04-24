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
import LoadingOverlay from "@/components/LoadingOverlay";
import HistorySidebar from "@/components/layout/HistorySidebar";
import SessionDetailModal from "@/components/modals/SessionDetailModal";
import NewSessionPromptModal from "@/components/modals/NewSessionPromptModal";
import { useSpeech } from "@/hooks/useSpeech";
import { Phone, MessageCircle } from "lucide-react";
import { initLocalDB, saveToLocalDB, searchLocalDB, saveSessionToIDB, getAllSessionsFromIDB, type SessionHistory } from "@/lib/local-rag";


export default function Home() {
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false); // Toggle mode
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Đang khởi động hệ thống...");
  
  // History UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);
  const [showNewSessionPrompt, setShowNewSessionPrompt] = useState(false);
  const [useRAGContext, setUseRAGContext] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAiMessageRef = useRef<string>("");
  const localContextRef = useRef<string | null>(null); // Holds local RAG context for current session
  const [preloadedLocalContext, setPreloadedLocalContext] = useState<string>("");

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
    handleSubmit: _handleSubmit,
    isLoading,
    stop,
    append,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    // Inject localContext (from local RAG search) into every chat request
    fetch: async (url, options) => {
      // Use pre-loaded local context if available and permitted
      if (options?.body) {
        try {
          const body = JSON.parse(options.body as string);
          if (useRAGContext && preloadedLocalContext) {
            body.localContext = preloadedLocalContext;
          }
          return window.fetch(url, { ...options, body: JSON.stringify(body) });
        } catch {
          // Fallback to normal fetch if body parsing fails
        }
      }
      return window.fetch(url, options as RequestInit);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history from IndexedDB + init local RAG DB
  useEffect(() => {
    getAllSessionsFromIDB().then((sessions) => {
      setSessionHistory(sessions);
    });

    // Initialize local DB (loads persisted docs from IndexedDB)
    setIsInitializing(true);
    initLocalDB().then(async () => {
      try {
        setLoadingMessage("Đang đọc bối cảnh từ các phiên trước...");
        const { debugGetAllDocs } = await import("@/lib/local-rag");
        const docs = await debugGetAllDocs();
        
        if (docs.length > 0) {
          // Check cache: if doc count is same as last time, use cached summary
          const cachedSummary = localStorage.getItem("lunaa-context-summary");
          const cachedCount = localStorage.getItem("lunaa-context-count");
          
          if (cachedSummary && cachedCount && parseInt(cachedCount) === docs.length) {
            console.log("🤖 [LocalRAG] Using cached context summary.");
            setPreloadedLocalContext(cachedSummary);
          } else {
            console.log("🤖 [LocalRAG] Context changed or no cache. Summarizing...");
            setLoadingMessage("AI đang tổng hợp hành trình của bạn...");
            const texts = docs.map(d => d.text);
            const response = await fetch("/api/summarize-context", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contextItems: texts }),
            });
            const data = await response.json();
            if (data.summary) {
              setPreloadedLocalContext(data.summary);
              localStorage.setItem("lunaa-context-summary", data.summary);
              localStorage.setItem("lunaa-context-count", docs.length.toString());
              console.log("🤖 [LocalRAG] AI-Driven Context Summary:\n", data.summary);
            }
          }
        } else {
          console.log("🤖 [LocalRAG] No local history found.");
        }
      } catch (e) {
        console.warn('[LocalRAG] Pre-load failed:', e);
      } finally {
        setIsInitializing(false);
        setShowNewSessionPrompt(true);
      }
    }).catch((e) => {
      console.warn('[LocalRAG] Init failed:', e);
      setIsInitializing(false);
    });
  }, []);

  // Intercept form submit to inject local RAG context before sending to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Local RAG context is now pre-loaded and injected via fetch-override above
    _handleSubmit(e);
  };

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
      const newSummary = data.summary ?? "Không thể tạo tổng kết lúc này.";
      setSummaryText(newSummary);

      // We defer actually saving to IDB to `handleSaveSession` when the user enters a title.
    } catch {
      setSummaryText("Đã xảy ra lỗi khi tổng kết. Vui lòng thử lại.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveSession = (title: string) => {
    if (!summaryText) {
      setShowSummary(false);
      return;
    }

    const summaryId = `session_${Date.now()}`;
    const historyEntry: SessionHistory = {
      id: summaryId,
      title: title || "Phiên tham vấn ẩn danh",
      timestamp: new Date().toISOString(),
      summary: summaryText,
      messages: messages,
    };
    
    // Save locally
    const updatedHistory = [historyEntry, ...sessionHistory];
    setSessionHistory(updatedHistory);
    saveSessionToIDB(historyEntry);

    // Save to LocalRAG Engine
    saveToLocalDB(summaryId, summaryText, {
      type: 'session_summary',
      messageCount: messages.length,
      timestamp: historyEntry.timestamp,
    }).catch((e) => console.warn('[LocalRAG] Save summary failed:', e));
    
    setShowSummary(false);
    handleNewSession();
  };

  const handleNewSession = () => {
    setMessages([]);
    setSummaryText("");
    setShowSummary(false);
    cancelSpeech();
  };

  const handleNewSessionConfirm = (useRAG: boolean, mode: "voice" | "text") => {
    setUseRAGContext(useRAG);
    setIsCallMode(mode === "voice");
    setShowNewSessionPrompt(false);
    handleNewSession();
  };

  return (
    <>
      {/* Ambient background */}
      <div className="bg-ambient" />

      {/* App shell */}
      <main className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">
        {isInitializing && <LoadingOverlay message={loadingMessage} />}
        
        <Header
          onEndSession={handleEndSession}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          onCancelSpeech={cancelSpeech}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onNewSessionBtnClick={() => setShowNewSessionPrompt(true)}
        />

        {/* Mode Toggle Switch (Disabled mid-session) */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="glass p-1 rounded-full flex items-center gap-1 border border-[var(--border-subtle)]">
            <button
              onClick={() => messages.length === 0 && setIsCallMode(false)}
              disabled={messages.length > 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !isCallMode
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              } ${messages.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Nhắn tin</span>
            </button>
            <button
              onClick={() => messages.length === 0 && setIsCallMode(true)}
              disabled={messages.length > 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isCallMode
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              } ${messages.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Phone size={16} />
              <span className="hidden sm:inline">Gọi điện</span>
            </button>
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

          <div className={isCallMode ? "block" : "hidden"}>
            <CustomRealtimeCall 
              messages={messages} 
              setMessages={setMessages}
              append={append} 
              stop={stop} 
              isLoading={isLoading}
              isViewVisible={isCallMode}
              preloadedLocalContext={useRAGContext ? preloadedLocalContext : ""}
            />
          </div>

          {!isCallMode && (
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
      </main>

      {/* Summary modal */}
      <SummaryModal
        isOpen={showSummary}
        isLoading={summaryLoading}
        summary={summaryText}
        onClose={() => setShowSummary(false)}
        onSave={handleSaveSession}
      />

      {/* History Detail modal */}
      <SessionDetailModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />

      {/* New Session Prompt modal */}
      <NewSessionPromptModal
        isOpen={showNewSessionPrompt}
        onClose={() => setShowNewSessionPrompt(false)}
        onConfirm={handleNewSessionConfirm}
      />

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessionHistory}
        onSelectSession={setSelectedSession}
        onNewSession={() => {
          setIsHistoryOpen(false);
          setShowNewSessionPrompt(true);
        }}
      />
    </>
  );
}
