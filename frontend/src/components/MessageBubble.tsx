import { motion } from "framer-motion";
import type { ChatMessage } from "../types";
import { SpeakerIcon, StopIcon } from "./icons";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  canSpeak?: boolean;
  speaking?: boolean;
  onStopSpeaking?: () => void;
}

export function MessageBubble({
  message,
  onSpeak,
  canSpeak,
  speaking,
  onStopSpeaking,
}: MessageBubbleProps) {
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
              {message.agents?.map((agent) => (
                <span key={agent} className="chip-agent" title="Handled by agent">
                  {agent}
                </span>
              ))}
              {canSpeak &&
                onSpeak &&
                (speaking ? (
                  <button
                    type="button"
                    className="speak-btn speak-btn--stop"
                    onClick={() => onStopSpeaking?.()}
                    aria-label="Stop reading aloud"
                  >
                    <StopIcon size={13} /> Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    className="speak-btn"
                    onClick={() => onSpeak(message.text)}
                    aria-label="Read this response aloud"
                  >
                    <SpeakerIcon size={13} /> Listen
                  </button>
                ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
