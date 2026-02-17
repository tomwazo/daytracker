/**
 * getMe.ts — Azure Function: GET /api/me
 *
 * Lightweight auth-check endpoint. Returns the user's email if they are
 * authenticated and on the ALLOWED_USERS allowlist, or 403 if not.
 *
 * The frontend calls this on app load to gate access before rendering
 * any content (profile selection, dashboard, etc.).
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getAllowedUser } from "../authHelper.js";

async function getMe(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const user = getAllowedUser(request);
  if (!user) {
    return { status: 403, jsonBody: { error: "Access denied" } };
  }

  return { status: 200, jsonBody: { email: user } };
}

/** Register the Azure Function on GET /api/me */
app.http("getMe", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "me",
  handler: getMe,
});
