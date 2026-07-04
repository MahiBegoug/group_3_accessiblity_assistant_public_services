import { AnimatePresence, motion } from "framer-motion";
import type { Place } from "../types";
import { PlaceCard } from "./PlaceCard";

interface ResultsPanelProps {
  places: Place[];
  activeId: string | null;
  onSelect: (place: Place) => void;
  onSpeak: (text: string) => void;
  canSpeak: boolean;
}

export function ResultsPanel({
  places,
  activeId,
  onSelect,
  onSpeak,
  canSpeak,
}: ResultsPanelProps) {
  return (
    <section className="panel results" aria-label="Places found">
      <div className="results__head">
        <span className="results__title">Places</span>
        {places.length > 0 && (
          <span className="results__count">{places.length} results</span>
        )}
      </div>

      <div className="results__list">
        {places.length === 0 ? (
          <motion.div
            className="results__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Ask the assistant to find or recommend a place — results appear here
            with summaries and accessibility details.
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                index={index}
                active={place.id === activeId}
                onSelect={onSelect}
                onSpeak={onSpeak}
                canSpeak={canSpeak}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
