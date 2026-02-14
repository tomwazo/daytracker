import { HttpRequest, HttpResponseInit } from "@azure/functions";

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/tokeninfo";

export async function validateAuth(
  request: HttpRequest
): Promise<HttpResponseInit | null> {
  // Skip auth in local development if no client ID is configured
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { status: 401, jsonBody: { error: "Missing authorization token" } };
  }

  const token = authHeader.slice(7);

  try {
    const res = await fetch(`${GOOGLE_CERTS_URL}?id_token=${token}`);
    if (!res.ok) {
      return { status: 401, jsonBody: { error: "Invalid token" } };
    }

    const payload = (await res.json()) as { aud: string };
    if (payload.aud !== clientId) {
      return { status: 401, jsonBody: { error: "Token audience mismatch" } };
    }

    return null; // Auth passed
  } catch {
    return { status: 401, jsonBody: { error: "Token validation failed" } };
  }
}
