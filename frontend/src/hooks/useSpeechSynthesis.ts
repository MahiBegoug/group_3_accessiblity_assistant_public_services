import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseSpeechSynthesisResult {
  supported: boolean;
  speaking: boolean;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string | null) => void;
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
}

// Voices that tend to sound more natural, ranked by preference.
const PREFERRED = [
  "google",
  "natural",
  "samantha",
  "zira",
  "aria",
  "jenny",
  "amelie",
  "amélie",
  "thomas",
  "daniel",
  "karen",
  "moira",
];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const idx = PREFERRED.findIndex((p) => name.includes(p));
  let score = idx === -1 ? 0 : PREFERRED.length - idx;
  if (voice.localService) score += 0.5;
  return score;
}

function pickForLang(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  const base = lang.split("-")[0].toLowerCase();
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  const pool = matches.length > 0 ? matches : voices;
  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        voicesRef.current = list;
        setVoices(list);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const resolveVoice = useCallback(
    (lang: string): SpeechSynthesisVoice | undefined => {
      const list = voicesRef.current;
      if (voiceURI) {
        const chosen = list.find((v) => v.voiceURI === voiceURI);
        if (chosen) return chosen;
      }
      return pickForLang(list, lang);
    },
    [voiceURI]
  );

  const speak = useCallback(
    (text: string, lang = "en-US") => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = resolveVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang;
      }
      // Slightly slower and warmer for clearer, friendlier narration.
      utterance.rate = 0.98;
      utterance.pitch = 1.05;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported, resolveVoice]
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const sortedVoices = useMemo(
    () => [...voices].sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)),
    [voices]
  );

  return {
    supported,
    speaking,
    voices: sortedVoices,
    voiceURI,
    setVoiceURI,
    speak,
    cancel,
  };
}
