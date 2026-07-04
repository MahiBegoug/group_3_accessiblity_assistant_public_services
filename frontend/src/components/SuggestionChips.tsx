import { AnimatePresence, motion } from "framer-motion";

interface SuggestionChipsProps {
  suggestions: string[];
  onPick: (text: string) => void;
}

export function SuggestionChips({ suggestions, onPick }: SuggestionChipsProps) {
  return (
    <div className="suggestions">
      <AnimatePresence mode="popLayout">
        {suggestions.map((text, index) => (
          <motion.button
            key={text}
            type="button"
            className="suggestion"
            onClick={() => onPick(text)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            {text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
