import axios from "axios";
import type { ChatResponse, LanguageMap } from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function sendChat(
  message: string,
  options: { source?: "text" | "voice"; targetLanguage?: string | null } = {}
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", {
    message,
    source: options.source ?? "text",
    targetLanguage: options.targetLanguage ?? null,
  });
  return data;
}

export async function fetchLanguages(): Promise<LanguageMap> {
  const { data } = await api.get<{ languages: LanguageMap }>("/languages");
  return data.languages;
}

export interface Metadata {
  boroughs: string[];
  categories: string[];
  count: number;
  source: { name: string; url: string };
}

export async function fetchMetadata(): Promise<Metadata> {
  const { data } = await api.get<Metadata>("/metadata");
  return data;
}

export async function translateText(
  text: string,
  target: string,
  source = "auto"
): Promise<{ translated: string; engine: string }> {
  const { data } = await api.post("/translate", { text, target, source });
  return data;
}
