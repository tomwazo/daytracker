const BASE = "/api";

export interface DayEntry {
  id: string;
  profileId: string;
  date: string;
  score: number;
  words: string[];
  createdAt: string;
}

export async function fetchEntry(
  profileId: string,
  date: string
): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/entry/${profileId}/${date}`);
  if (!res.ok) throw new Error("Failed to fetch entry");
  const data = await res.json();
  return data.entry;
}

export async function submitEntry(entry: {
  profileId: string;
  date: string;
  score: number;
  words: string[];
}): Promise<DayEntry> {
  const res = await fetch(`${BASE}/entry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `Failed to submit entry (${res.status})`;
    try {
      const err = JSON.parse(text);
      if (err.error) message = err.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchWords(profileId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/words/${profileId}`);
  if (!res.ok) throw new Error("Failed to fetch words");
  return res.json();
}
