/**
 * api.ts — HTTP client for the Day Tracker Azure Functions API.
 *
 * All API calls go through /api/* which is proxied to the Azure Functions
 * backend in development (via Vite proxy) and served by Azure Static Web
 * Apps in production (same domain, no CORS needed).
 *
 * Every function checks for 401/403 responses:
 *   - 401 → session expired, redirect to Microsoft login
 *   - 403 → user not on the ALLOWED_USERS allowlist, throw an error
 */
const BASE = "/api";

/** Shape of a daily entry document returned by the API */
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

/**
 * Checks whether the current user is authorised (on the allowlist).
 * Called on app load to gate access before rendering any content.
 * Throws if the user is not authenticated or not on the allowlist.
 */
export async function checkAccess(): Promise<void> {
  const res = await fetch(`${BASE}/me`);
  checkAuthError(res);
  if (!res.ok) throw new Error("Auth check failed");
}

/**
 * Fetches the entry for a given profile and date.
 * Returns null if no entry exists (API returns { entry: null }).
 */
export async function fetchEntry(
  profileId: string,
  date: string
): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/entry/${profileId}/${date}`);
  checkAuthError(res);
  if (!res.ok) throw new Error("Failed to fetch entry");
  const data = await res.json();
  return data.entry;
}

/**
 * Submits a new daily entry (or overwrites an existing one for the same date).
 * Throws with the server's error message if validation fails.
 */
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
  checkAuthError(res);
  if (!res.ok) {
    // Try to extract a meaningful error message from the response body
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

/**
 * Fetches all unique past words for a profile, used for autocomplete suggestions.
 */
export async function fetchWords(profileId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/words/${profileId}`);
  checkAuthError(res);
  if (!res.ok) throw new Error("Failed to fetch words");
  return res.json();
}
