"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, AudioLines, Sparkles } from "lucide-react";

import Header from "@/components/layout/Header";
import MessageBubble, {
  TypingIndicator,
} from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import SummaryModal from "@/components/modals/SummaryModal";
import CustomRealtimeCall from "@/components/CustomRealtimeCall";
import ElevenLabsCall from "@/components/ElevenLabsCall";
import LoadingOverlay from "@/components/LoadingOverlay";
import HistorySidebar from "@/components/layout/HistorySidebar";
import SessionDetailModal from "@/components/modals/SessionDetailModal";
import NewSessionPromptModal from "@/components/modals/NewSessionPromptModal";
import LunaaStageHero from "@/components/stageshow/LunaaStageHero";
import { useSpeech } from "@/hooks/useSpeech";
import {
  initLocalDB,
  saveToLocalDB,
  saveSessionToIDB,
  getAllSessionsFromIDB,
  type SessionHistory,
} from "@/lib/local-rag";

export default function Home() {
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Đang khởi động hệ thống..."
  );

  // Voice Engine State
  const [voiceEngine, setVoiceEngine] = useState<"gemini" | "elevenlabs">(
    "gemini"
  );
  const [elevenAgentId, setElevenAgentId] = useState<string>("");

  // Studio Sidebar State (Docked open by default on desktop)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(
    null
  );
  const [showNewSessionPrompt, setShowNewSessionPrompt] = useState(false);
  const [useRAGContext, setUseRAGContext] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAiMessageRef = useRef<string>("");
  const [preloadedLocalContext, setPreloadedLocalContext] =
    useState<string>("");

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
    fetch: async (url, options) => {
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

  useEffect(() => {
    fetch("/api/voice-engine")
      .then((res) => res.json())
      .then((data) => {
        setVoiceEngine(data.engine);
        setElevenAgentId(data.elevenAgentId);
      })
      .catch((err) => console.error("Failed to fetch voice engine:", err));
  }, []);

  // Load history from IndexedDB + init local RAG DB
  useEffect(() => {
    getAllSessionsFromIDB().then((sessions) => {
      setSessionHistory(sessions);
    });

    setIsInitializing(true);
    initLocalDB()
      .then(async () => {
        try {
          setLoadingMessage("Đang đọc bối cảnh từ các phiên trước...");
          const { debugGetAllDocs } = await import("@/lib/local-rag");
          const docs = await debugGetAllDocs();

          if (docs.length > 0) {
            const cachedSummary = localStorage.getItem("lunaa-context-summary");
            const cachedCount = localStorage.getItem("lunaa-context-count");

            if (
              cachedSummary &&
              cachedCount &&
              parseInt(cachedCount) === docs.length
            ) {
              setPreloadedLocalContext(cachedSummary);
            } else {
              setLoadingMessage("Đang tổng hợp hành trình của bạn...");
              const texts = docs.map((d) => d.text);
              const response = await fetch("/api/summarize-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contextItems: texts }),
              });
              const data = await response.json();
              if (data.summary) {
                setPreloadedLocalContext(data.summary);
                localStorage.setItem("lunaa-context-summary", data.summary);
                localStorage.setItem(
                  "lunaa-context-count",
                  docs.length.toString()
                );
              }
            }
          }
        } catch (e) {
          console.warn("[LocalRAG] Pre-load failed:", e);
        } finally {
          setIsInitializing(false);
        }
      })
      .catch((e) => {
        console.warn("[LocalRAG] Init failed:", e);
        setIsInitializing(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
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

  // End session -> get summary
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

    const updatedHistory = [historyEntry, ...sessionHistory];
    setSessionHistory(updatedHistory);
    saveSessionToIDB(historyEntry);

    saveToLocalDB(summaryId, summaryText, {
      type: "session_summary",
      messageCount: messages.length,
      timestamp: historyEntry.timestamp,
    }).catch((e) => console.warn("[LocalRAG] Save summary failed:", e));

    setShowSummary(false);
    handleNewSession();
  };

  const handleNewSession = () => {
    setMessages([]);
    setSummaryText("");
    setShowSummary(false);
    cancelSpeech();
  };

  const handleNewSessionConfirm = (
    useRAG: boolean,
    mode: "voice" | "text"
  ) => {
    setUseRAGContext(useRAG);
    setIsCallMode(mode === "voice");
    setShowNewSessionPrompt(false);
    handleNewSession();

    if (mode === "text") {
      setTimeout(() => {
        setMessages([
          {
            id: `greeting_${Date.now()}`,
            role: "assistant",
            content:
              "Xin chào, mình là Luna. Mình ở đây để lắng nghe và đồng hành cùng bạn. Hôm nay bạn cảm thấy thế nào?",
          },
        ]);
      }, 100);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--ss-canvas)] text-[var(--ss-text-strong)]">
      {isInitializing && <LoadingOverlay message={loadingMessage} />}

      {/* Left Docked Studio Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessionHistory}
        onSelectSession={setSelectedSession}
        onNewSession={() => setShowNewSessionPrompt(true)}
        useRAGContext={useRAGContext}
        onToggleRAGContext={setUseRAGContext}
        preloadedContextSummary={preloadedLocalContext}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header
          onEndSession={handleEndSession}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          onCancelSpeech={cancelSpeech}
          onOpenHistory={() => setIsHistoryOpen((prev) => !prev)}
          onNewSessionBtnClick={() => setShowNewSessionPrompt(true)}
          isCallMode={isCallMode}
          onToggleCallMode={setIsCallMode}
          useRAGContext={useRAGContext}
          hasMessages={messages.length > 0}
        />

        {/* Workspace Stage */}
        {!isCallMode ? (
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            {messages.length === 0 ? (
              <div className="max-w-3xl mx-auto py-2 sm:py-4 flex flex-col gap-6">
                {/* Editorial Intro Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
                  <div>
                    <div className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--ss-accent-text)] mb-1">
                      Không gian tham vấn cá nhân
                    </div>
                    <div className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-[var(--ss-text-strong)]">
                      Hôm nay tâm trí bạn đang dừng ở điều gì?
                    </div>
                    <p className="text-[13px] text-[var(--ss-text)] mt-1 max-w-xl leading-relaxed">
                      Mọi cuộc trò chuyện và ký ức bối cảnh được lưu trữ cục bộ
                      trên trình duyệt của bạn. Bắt đầu bằng văn bản hoặc chuyển
                      sang Voice Studio bất cứ lúc nào.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCallMode(true)}
                    className="self-start sm:self-auto shrink-0 h-8 px-3.5 rounded-[var(--ss-radius-md)] bg-[var(--ss-surface)] hover:bg-[var(--ss-raised)] border border-[var(--ss-line)] text-[12px] font-medium text-[var(--ss-text-strong)] flex items-center gap-1.5 transition-colors"
                  >
                    <AudioLines
                      size={13}
                      strokeWidth={1.5}
                      className="text-[var(--ss-accent-text)]"
                    />
                    <span>Mở Voice Studio</span>
                  </button>
                </div>

                {/* Stageshow Interactive Scene Preview */}
                <LunaaStageHero />

                {/* Starter Prompts */}
                <div className="pt-1">
                  <div className="text-[11.5px] font-medium text-[var(--ss-text-faint)] mb-2.5">
                    Gợi ý bắt đầu cuộc trò chuyện
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Mình đang cảm thấy lo âu và khó tập trung",
                      "Mình cần một người lắng nghe chuyện hôm nay",
                      "Làm sao để cân bằng lại giấc ngủ và công việc?",
                      "Mình cảm thấy kiệt sức nhưng không rõ lý do",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="px-3.5 py-2 rounded-[var(--ss-radius-md)] text-[12.5px] text-[var(--ss-text)] bg-[var(--ss-surface)] border border-[var(--ss-line)] hover:border-[var(--ss-accent-border)] hover:text-[var(--ss-text-strong)] hover:bg-[var(--ss-raised)] flex items-center gap-1.5 transition-colors"
                      >
                        <span>{suggestion}</span>
                        <ArrowUpRight
                          size={13}
                          strokeWidth={1.5}
                          className="text-[var(--ss-icon-faint)]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5 pb-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isLoading && <TypingIndicator key="typing" />}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
            {voiceEngine === "elevenlabs" ? (
              <ElevenLabsCall
                messages={messages}
                setMessages={setMessages}
                isViewVisible={isCallMode}
                agentId={elevenAgentId}
              />
            ) : (
              <CustomRealtimeCall
                messages={messages}
                setMessages={setMessages}
                append={append}
                stop={stop}
                isLoading={isLoading}
                isViewVisible={isCallMode}
                preloadedLocalContext={
                  useRAGContext ? preloadedLocalContext : ""
                }
              />
            )}
          </main>
        )}

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
      </div>

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
    </div>
  );
}
