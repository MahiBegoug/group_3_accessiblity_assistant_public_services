import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLanguages, fetchMetadata, sendChat } from "./api/client";
import { ChatPanel } from "./components/ChatPanel";
import { Header } from "./components/Header";
import { MapView } from "./components/MapView";
import { ResultsPanel } from "./components/ResultsPanel";
import { SpeakingBar } from "./components/SpeakingBar";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";
import type {
  Bounds,
  ChatMessage,
  LanguageMap,
  MapMarker,
  Place,
} from "./types";

const DEFAULT_SUGGESTIONS = [
  "Find a wheelchair accessible library",
  "Recommend a park for a family walk",
  "Where can I go swimming?",
  "Tell me about a cultural centre",
];

const BCP47: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  ar: "ar-SA",
  "zh-CN": "zh-CN",
  pt: "pt-PT",
  it: "it-IT",
  de: "de-DE",
  ht: "fr-FR",
  pa: "pa-IN",
};

let idCounter = 0;
const nextId = () => `m${Date.now()}-${idCounter++}`;

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: "assistant",
      text:
        "Hi! I'm EzAccess. Ask me by text or voice to find Montréal public places, get recommendations, summaries, and translations — I'll map them and can read results aloud.",
      intent: "greeting",
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [places, setPlaces] = useState<Place[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState("en");
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [languages, setLanguages] = useState<LanguageMap>({});
  const [placeCount, setPlaceCount] = useState(0);

  const {
    supported: canSpeak,
    speaking,
    speak,
    cancel,
    voices,
    voiceURI,
    setVoiceURI,
  } = useSpeechSynthesis();
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => undefined);
    fetchMetadata()
      .then((meta) => setPlaceCount(meta.count))
      .catch(() => undefined);
  }, []);

  const speakReply = useCallback(
    (text: string) => speak(text, BCP47[languageRef.current] ?? "en-US"),
    [speak]
  );

  const previewVoice = useCallback(
    () =>
      speak(
        "Hi, I'm EzAccess. This is how I'll read results aloud.",
        BCP47[languageRef.current] ?? "en-US"
      ),
    [speak]
  );

  const handleSend = useCallback(
    async (text: string, source: "text" | "voice") => {
      if (busy) return;
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        text,
        source,
      };
      const pendingId = nextId();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: pendingId, role: "assistant", text: "", pending: true },
      ]);
      setBusy(true);

      try {
        const target = languageRef.current === "en" ? null : languageRef.current;
        const res = await sendChat(text, { source, targetLanguage: target });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: m.id,
                  role: "assistant",
                  text: res.reply,
                  intent: res.intent,
                  agents: res.agentsUsed,
                }
              : m
          )
        );

        if (res.places.length > 0) {
          setPlaces(res.places);
          setMarkers(res.markers);
          setBounds(res.bounds);
          setActiveId(null);
        }
        if (res.suggestions && res.suggestions.length > 0) {
          setSuggestions(res.suggestions);
        }

        if (voiceOutput || source === "voice") {
          speakReply(res.reply);
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: m.id,
                  role: "assistant",
                  text:
                    "I couldn't reach the service. Please make sure the backend is running and try again.",
                  intent: "error",
                }
              : m
          )
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, voiceOutput, speakReply]
  );

  const handleSelectPlace = useCallback((place: Place) => {
    if (place.latitude && place.longitude) setActiveId(place.id);
  }, []);

  const recognitionLang = BCP47[language] ?? "en-US";

  return (
    <div className="app">
      <Header
        languages={languages}
        language={language}
        onLanguageChange={setLanguage}
        voiceOutput={voiceOutput}
        onVoiceOutputChange={setVoiceOutput}
        placeCount={placeCount}
        voices={voices}
        voiceURI={voiceURI}
        onVoiceChange={setVoiceURI}
        onVoicePreview={previewVoice}
      />

      <main className="main">
        <ChatPanel
          messages={messages}
          suggestions={suggestions}
          busy={busy}
          recognitionLang={recognitionLang}
          canSpeak={canSpeak}
          speaking={speaking}
          onSend={handleSend}
          onSpeak={speakReply}
          onStopSpeaking={cancel}
        />

        <div className="right">
          <MapView
            markers={markers}
            bounds={bounds}
            activeId={activeId}
            onMarkerClick={setActiveId}
          />
          <ResultsPanel
            places={places}
            activeId={activeId}
            onSelect={handleSelectPlace}
            onSpeak={speakReply}
            canSpeak={canSpeak}
            speaking={speaking}
            onStopSpeaking={cancel}
          />
        </div>
      </main>

      <SpeakingBar speaking={speaking} onStop={cancel} />
    </div>
  );
}
