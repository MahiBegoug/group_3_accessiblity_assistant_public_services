import { ChevronDown, SpeakerIcon } from "./icons";

interface VoiceSelectProps {
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  onChange: (uri: string | null) => void;
  onPreview: () => void;
}

export function VoiceSelect({
  voices,
  voiceURI,
  onChange,
  onPreview,
}: VoiceSelectProps) {
  if (voices.length === 0) return null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <label className="select" title="Text-to-speech voice">
        <SpeakerIcon size={15} />
        <select
          value={voiceURI ?? "auto"}
          onChange={(event) =>
            onChange(event.target.value === "auto" ? null : event.target.value)
          }
          aria-label="Choose voice for spoken responses"
          style={{ paddingLeft: 8, maxWidth: 190 }}
        >
          <option value="auto">Auto voice</option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <span className="select__chevron">
          <ChevronDown size={15} />
        </span>
      </label>
      <button
        type="button"
        className="icon-btn"
        style={{ width: 34, height: 34 }}
        onClick={onPreview}
        aria-label="Preview selected voice"
        title="Preview voice"
      >
        <SpeakerIcon size={16} />
      </button>
    </div>
  );
}
