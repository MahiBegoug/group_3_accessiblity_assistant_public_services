import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import { SuggestionChips } from "./SuggestionChips";

interface ChatPanelProps {
  messages: ChatMessage[];
  suggestions: string[];
  busy: boolean;
  recognitionLang: string;
  canSpeak: boolean;
  onSend: (text: string, source: "text" | "voice") => void;
  onSpeak: (text: string) => void;
}

export function ChatPanel({
  messages,
  suggestions,
  busy,
  recognitionLang,
  canSpeak,
  onSend,
  onSpeak,
}: ChatPanelProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <section className="panel chat" aria-label="Conversation">
      <div className="chat__head">
        <span className="chat__title">Assistant</span>
      </div>

      <div className="chat__messages" ref={listRef} aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSpeak={onSpeak}
              canSpeak={canSpeak}
            />
          ))}
        </AnimatePresence>
      </div>

      {suggestions.length > 0 && (
        <SuggestionChips
          suggestions={suggestions}
          onPick={(text) => onSend(text, "text")}
        />
      )}

      <Composer onSend={onSend} disabled={busy} recognitionLang={recognitionLang} />
    </section>
  );
}
