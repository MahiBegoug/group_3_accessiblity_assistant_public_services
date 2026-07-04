import { motion } from "framer-motion";
import type { Place } from "../types";
import { AccessIcon, ExternalIcon, PinIcon, SpeakerIcon, StopIcon } from "./icons";

interface PlaceCardProps {
  place: Place;
  active: boolean;
  index: number;
  onSelect: (place: Place) => void;
  onSpeak: (text: string) => void;
  canSpeak: boolean;
  speaking: boolean;
  onStopSpeaking: () => void;
}

export function PlaceCard({
  place,
  active,
  index,
  onSelect,
  onSpeak,
  canSpeak,
  speaking,
  onStopSpeaking,
}: PlaceCardProps) {
  const summary = place.summary || place.shortSummary || "";
  return (
    <motion.article
      className={`card ${active ? "active" : ""}`}
      onClick={() => onSelect(place)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: "spring", stiffness: 280, damping: 26 }}
      whileHover={{ y: -3 }}
      layout
    >
      <div className="card__top">
        <div>
          <div className="card__name">{place.name}</div>
          <div className="card__meta">
            {place.category || place.types}
            {place.borough ? ` · ${place.borough}` : ""}
          </div>
        </div>
      </div>

      {summary && <p className="card__summary">{summary}</p>}

      <div className="badges">
        {place.accessibility.length > 0 && (
          <span className="badge badge--access">
            <AccessIcon size={12} /> Accessible
          </span>
        )}
        {place.openingStatus && (
          <span className="badge badge--status">{place.openingStatus}</span>
        )}
        {place.activities.slice(0, 2).map((activity) => (
          <span key={activity} className="badge">
            {activity}
          </span>
        ))}
      </div>

      <div className="card__actions">
        {place.latitude && place.longitude && (
          <button
            type="button"
            className="link-btn"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(place);
            }}
          >
            <PinIcon size={13} /> Show on map
          </button>
        )}
        {canSpeak &&
          summary &&
          (speaking ? (
            <button
              type="button"
              className="link-btn link-btn--stop"
              onClick={(event) => {
                event.stopPropagation();
                onStopSpeaking();
              }}
            >
              <StopIcon size={13} /> Stop
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={(event) => {
                event.stopPropagation();
                onSpeak(`${place.name}. ${summary}`);
              }}
            >
              <SpeakerIcon size={13} /> Listen
            </button>
          ))}
        {place.url && (
          <a
            className="link-btn"
            href={place.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalIcon size={12} /> Details
          </a>
        )}
      </div>
    </motion.article>
  );
}
