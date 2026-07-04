import { AnimatePresence, motion } from "framer-motion";
import { StopIcon } from "./icons";

interface SpeakingBarProps {
  speaking: boolean;
  onStop: () => void;
}

const BARS = [0, 1, 2, 3];

export function SpeakingBar({ speaking, onStop }: SpeakingBarProps) {
  return (
    <AnimatePresence>
      {speaking && (
        <motion.div
          className="speaking-bar"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          role="status"
          aria-live="polite"
        >
          <span className="speaking-bar__eq" aria-hidden>
            {BARS.map((i) => (
              <motion.span
                key={i}
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: "easeInOut",
                  delay: i * 0.12,
                }}
              />
            ))}
          </span>
          <span className="speaking-bar__label">Reading aloud…</span>
          <button
            type="button"
            className="speaking-bar__stop"
            onClick={onStop}
            aria-label="Stop reading aloud"
          >
            <StopIcon size={14} />
            Stop
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
