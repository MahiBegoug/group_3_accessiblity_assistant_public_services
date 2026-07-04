import type { LanguageMap } from "../types";
import { ChevronDown, GlobeIcon } from "./icons";

interface LanguageSelectProps {
  languages: LanguageMap;
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelect({ languages, value, onChange }: LanguageSelectProps) {
  const entries = Object.entries(languages);
  return (
    <label className="select" title="Response language">
      <GlobeIcon size={15} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Choose response language"
        style={{ paddingLeft: 8 }}
      >
        <option value="en">English</option>
        {entries
          .filter(([code]) => code !== "en")
          .map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
      </select>
      <span className="select__chevron">
        <ChevronDown size={15} />
      </span>
    </label>
  );
}
