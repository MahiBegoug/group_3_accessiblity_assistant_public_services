import { motion } from "framer-motion";
import type { LanguageMap } from "../types";
import { LanguageSelect } from "./LanguageSelect";
import { Toggle } from "./Toggle";

interface HeaderProps {
  languages: LanguageMap;
  language: string;
  onLanguageChange: (code: string) => void;
  voiceOutput: boolean;
  onVoiceOutputChange: (value: boolean) => void;
  placeCount: number;
}

export function Header({
  languages,
  language,
  onLanguageChange,
  voiceOutput,
  onVoiceOutputChange,
  placeCount,
}: HeaderProps) {
  return (
    <motion.header
      className="header"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="brand">
        <motion.div
          className="brand__mark"
          whileHover={{ rotate: -8, scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          Ez
        </motion.div>
        <div>
          <div className="brand__name">EzAccess</div>
          <div className="brand__tag">
            {placeCount > 0
              ? `${placeCount.toLocaleString()} Montréal public places`
              : "Accessible public services assistant"}
          </div>
        </div>
      </div>

      <div className="header__actions">
        <Toggle
          label="Read aloud"
          checked={voiceOutput}
          onChange={onVoiceOutputChange}
        />
        <LanguageSelect
          languages={languages}
          value={language}
          onChange={onLanguageChange}
        />
      </div>
    </motion.header>
  );
}
