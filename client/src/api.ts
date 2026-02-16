const BASE = "/api";

export interface DayEntry {
  id: string;
  profileId: string;
  date: string;
  score: number;
  words: string[];
  createdAt: string;
}

/**
 * Checks if an API response indicates an authentication or authorisation error.
 * - 401: User is not authenticated — redirect to Microsoft login
 * - 403: User is authenticated but not on the allowlist — throw a clear error
 */
function checkAuthError(res: Response): void {
  if (res.status === 401) {
    // Session expired or not authenticated — redirect to login
    window.location.href = "/.auth/login/aad";
  }
  if (res.status === 403) {
    throw new Error("Access denied. Your account is not authorised to use this app.");
  }
}

export async function fetchEntry(
  profileId: string,
  date: string
): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/entry/${profileId}/${date}`);
  // Check for auth errors before processing the response
  checkAuthError(res);
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
  // Check for auth errors before processing the response
  checkAuthError(res);
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
  // Check for auth errors before processing the response
  checkAuthError(res);
  if (!res.ok) throw new Error("Failed to fetch words");
  return res.json();
}
