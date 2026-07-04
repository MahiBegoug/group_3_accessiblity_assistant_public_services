import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { MicIcon, SendIcon } from "./icons";

interface ComposerProps {
  onSend: (text: string, source: "text" | "voice") => void;
  disabled?: boolean;
  recognitionLang: string;
}

export function Composer({ onSend, disabled, recognitionLang }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasListening = useRef(false);
  const { supported, listening, transcript, interim, start, stop, reset } =
    useSpeechRecognition(recognitionLang);

  // Mirror the live transcript into the input while listening.
  useEffect(() => {
    if (listening) {
      const live = [transcript, interim].filter(Boolean).join(" ");
      if (live) setValue(live);
    }
  }, [transcript, interim, listening]);

  // When listening stops, auto-send the captured voice input.
  useEffect(() => {
    if (wasListening.current && !listening) {
      const finalText = transcript.trim();
      if (finalText) {
        onSend(finalText, "voice");
        setValue("");
        reset();
      }
    }
    wasListening.current = listening;
  }, [listening, transcript, onSend, reset]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text, "text");
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const toggleMic = () => {
    if (listening) stop();
    else start();
  };

  return (
    <div className="composer">
      {supported && (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={`icon-btn icon-btn--mic ${listening ? "listening" : ""}`}
            onClick={toggleMic}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            disabled={disabled}
          >
            <MicIcon size={20} />
          </button>
          <AnimatePresence>
            {listening && (
              <motion.span
                className="mic-pulse"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="composer__field">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={
            listening ? "Listening…" : "Ask or say what you're looking for…"
          }
          onChange={(event) => {
            setValue(event.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          aria-label="Message EzAccess"
          disabled={disabled}
        />
      </div>

      <motion.button
        type="button"
        className="icon-btn icon-btn--send"
        onClick={submit}
        disabled={!value.trim() || disabled}
        whileTap={{ scale: 0.9 }}
        aria-label="Send message"
      >
        <SendIcon size={19} />
      </motion.button>
    </div>
  );
}
