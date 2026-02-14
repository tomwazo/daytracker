import { HttpRequest, HttpResponseInit } from "@azure/functions";

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/tokeninfo";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "tom87moore@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

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
    const body = await res.text();

    if (!res.ok) {
      return {
        status: 401,
        jsonBody: {
          error: "Invalid token",
          detail: `Google returned ${res.status}: ${body}`,
        },
      };
    }

    const payload = JSON.parse(body) as { aud: string; email?: string };
    if (payload.aud !== clientId) {
      return {
        status: 401,
        jsonBody: {
          error: "Token audience mismatch",
          detail: `Expected ${clientId}, got ${payload.aud}`,
        },
      };
    }

    const email = payload.email?.toLowerCase();
    if (!email || !ALLOWED_EMAILS.includes(email)) {
      return {
        status: 403,
        jsonBody: { error: "Email not authorized", detail: email },
      };
    }

    return null; // Auth passed
  } catch (err) {
    return {
      status: 401,
      jsonBody: {
        error: "Token validation failed",
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
