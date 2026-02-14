import { getToken } from "./auth";

const BASE = "/api";

export interface DayEntry {
  id: string;
  profileId: string;
  date: string;
  score: number;
  words: string[];
  createdAt: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function fetchEntry(
  profileId: string,
  date: string
): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/entry/${profileId}/${date}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch entry");
  return res.json();
}

export async function submitEntry(entry: {
  profileId: string;
  date: string;
  score: number;
  words: string[];
}): Promise<DayEntry> {
  const res = await fetch(`${BASE}/entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit entry");
  }
  return res.json();
}

export async function fetchWords(profileId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/words/${profileId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch words");
  return res.json();
}
