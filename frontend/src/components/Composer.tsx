import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { MicIcon, SendIcon, StopIcon } from "./icons";
import { TranscriptPreview } from "./TranscriptPreview";

interface ComposerProps {
  onSend: (text: string, source: "text" | "voice") => void;
  disabled?: boolean;
  recognitionLang: string;
}

export function Composer({ onSend, disabled, recognitionLang }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasListening = useRef(false);
  // Holds the latest live text shown while listening, used as the send source
  // so nothing is lost if the final transcript event doesn't fire.
  const lastLiveRef = useRef("");
  const { supported, listening, transcript, interim, error, start, stop, reset } =
    useSpeechRecognition(recognitionLang);

  // Track the live transcript for sending (shown in the preview, not the input).
  useEffect(() => {
    if (listening) {
      lastLiveRef.current = [transcript, interim].filter(Boolean).join(" ").trim();
    }
  }, [transcript, interim, listening]);

  // When listening stops, auto-send whatever was captured.
  useEffect(() => {
    if (wasListening.current && !listening) {
      const finalText = (lastLiveRef.current || transcript).trim();
      if (finalText) onSend(finalText, "voice");
      setValue("");
      lastLiveRef.current = "";
      reset();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    wasListening.current = listening;
    // Intentionally only react to the listening flag flipping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = () => {
    if (disabled) return;
    // If we're capturing voice, stop first — the stop effect sends the text.
    if (listening) {
      stop();
      return;
    }
    const text = value.trim();
    if (!text) return;
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

  const sendDisabled = disabled || (!listening && !value.trim());

  return (
    <>
      <AnimatePresence>
        {listening && (
          <TranscriptPreview transcript={transcript} interim={interim} />
        )}
      </AnimatePresence>
      <div className="composer">
      {supported && (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={`icon-btn icon-btn--mic ${listening ? "listening" : ""}`}
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            aria-pressed={listening}
            title={listening ? "Stop listening" : "Speak"}
            disabled={disabled}
          >
            {listening ? <StopIcon size={18} /> : <MicIcon size={20} />}
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
            listening
              ? "Listening… tap the stop button or Send when you're done"
              : error
                ? "Voice input needs microphone access — you can type instead"
                : "Ask or say what you're looking for…"
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
        disabled={sendDisabled}
        whileTap={{ scale: 0.9 }}
        aria-label={listening ? "Stop and send" : "Send message"}
        title={listening ? "Stop and send" : "Send"}
      >
        <SendIcon size={19} />
      </motion.button>
      </div>
    </>
  );
}
