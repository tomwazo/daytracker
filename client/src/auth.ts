const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let tokenCache: string | null = null;

export function getToken(): string | null {
  return tokenCache;
}

export function setToken(token: string) {
  tokenCache = token;
}

export function getClientId(): string {
  return CLIENT_ID;
}
