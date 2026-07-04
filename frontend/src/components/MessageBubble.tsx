import { motion } from "framer-motion";
import type { ChatMessage } from "../types";
import { SpeakerIcon } from "./icons";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  canSpeak?: boolean;
}

export function MessageBubble({ message, onSpeak, canSpeak }: MessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <motion.div
      className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      layout
    >
      {message.pending ? (
        <span className="typing" aria-label="Assistant is typing">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <>
          <span>{message.text}</span>
          {!isUser && (message.intent || canSpeak) && (
            <div className="bubble__meta">
              {message.intent && (
                <span className="chip-intent">{message.intent}</span>
              )}
              {canSpeak && onSpeak && (
                <button
                  type="button"
                  className="speak-btn"
                  onClick={() => onSpeak(message.text)}
                  aria-label="Read this response aloud"
                >
                  <SpeakerIcon size={13} /> Listen
                </button>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
