import { motion } from "framer-motion";
import { SpeakerIcon } from "./icons";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className="toggle"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <SpeakerIcon size={15} />
      <span>{label}</span>
      <span className={`toggle__track ${checked ? "on" : ""}`}>
        <motion.span
          className="toggle__thumb"
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          animate={{ x: checked ? 16 : 0 }}
        />
      </span>
    </button>
  );
}
