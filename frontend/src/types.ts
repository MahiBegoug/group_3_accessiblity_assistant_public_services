export interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  types: string;
  address: string;
  borough: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  activities: string[];
  facilities: string[];
  amenities: string[];
  accessibility: string[];
  openingStatus: string;
  schedule: string;
  phone: string;
  email: string;
  url: string;
  sourceDataset: string;
  sourceUrl: string;
  summary?: string;
  shortSummary?: string;
}

export interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  borough: string;
  shortSummary: string;
  accessible: boolean;
}

export interface Bounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface ChatResponse {
  reply: string;
  intent: string;
  places: Place[];
  markers: MapMarker[];
  bounds: Bounds | null;
  translation: Record<string, unknown> | null;
  suggestions: string[];
  agentsUsed: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  intent?: string;
  source?: "text" | "voice";
  agents?: string[];
  pending?: boolean;
}

export interface LanguageMap {
  [code: string]: string;
}
