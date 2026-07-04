import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in default lib.dom).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(lang = "en-US"): UseSpeechRecognitionResult {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // The user explicitly asked to stop (vs. the browser auto-ending on silence).
  const manualStopRef = useRef(false);
  const langRef = useRef(lang);
  langRef.current = lang;

  // Detach handlers and drop the current instance.
  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    }
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    // Always begin from a fresh instance — reusing one across sessions is
    // unreliable in Chrome and is what breaks the second recording.
    teardown();

    const recognition = new Ctor();
    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    manualStopRef.current = false;
    setTranscript("");
    setInterim("");
    setError(null);

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) {
        setTranscript((prev) =>
          prev ? `${prev} ${finalText.trim()}` : finalText.trim()
        );
      }
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        manualStopRef.current = true;
        setError(event.error);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error);
      }
    };
    recognition.onend = () => {
      // If the browser ended on its own but the user hasn't stopped, keep going.
      if (!manualStopRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          return;
        } catch {
          /* fall through to stop */
        }
      }
      setListening(false);
      setInterim("");
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      teardown();
      setListening(false);
    }
  }, [teardown]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      return;
    }
    try {
      recognition.stop();
    } catch {
      teardown();
      setListening(false);
    }
  }, [teardown]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      teardown();
    };
  }, [teardown]);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}
