import { motion } from "framer-motion";

interface TranscriptPreviewProps {
  transcript: string;
  interim: string;
}

export function TranscriptPreview({ transcript, interim }: TranscriptPreviewProps) {
  const hasText = Boolean(transcript || interim);
  return (
    <motion.div
      className="transcript-preview"
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 8, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      aria-live="polite"
    >
      <span className="transcript-preview__dot" aria-hidden>
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        />
      </span>
      <span className="transcript-preview__text">
        {hasText ? (
          <>
            {transcript && <span>{transcript} </span>}
            {interim && <span className="transcript-preview__interim">{interim}</span>}
          </>
        ) : (
          <span className="transcript-preview__hint">Listening…</span>
        )}
      </span>
    </motion.div>
  );
}
