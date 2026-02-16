import { HttpRequest } from "@azure/functions";

/**
 * Represents the decoded client principal that Azure Static Web Apps
 * injects via the x-ms-client-principal header for authenticated users.
 */
interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // This is the user's email address
  userRoles: string[];
}

/**
 * Checks whether the authenticated user is on the allowlist.
 *
 * Azure SWA injects a base64-encoded x-ms-client-principal header into
 * every request from an authenticated user. This function decodes that
 * header, extracts the user's email, and checks it against the
 * ALLOWED_USERS environment variable (a comma-separated list of emails).
 *
 * @param request - The incoming HTTP request from Azure Functions
 * @returns The user's email if they are on the allowlist, or null if
 *          the header is missing, invalid, or the user is not allowed.
 */
export function getAllowedUser(request: HttpRequest): string | null {
  // Read the client principal header that SWA injects for authenticated users
  const header = request.headers.get("x-ms-client-principal");
  if (!header) {
    return null;
  }

  // Decode the base64-encoded JSON payload
  let principal: ClientPrincipal;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    principal = JSON.parse(decoded);
  } catch {
    return null;
  }

  // Extract the user's email address (stored in userDetails by SWA)
  const email = principal.userDetails?.toLowerCase();
  if (!email) {
    return null;
  }

  // Check the email against the ALLOWED_USERS environment variable
  // Format: comma-separated list of emails, e.g. "user1@outlook.com,user2@outlook.com"
  const allowedUsers = process.env.ALLOWED_USERS || "";
  const allowedList = allowedUsers
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  // If no allowlist is configured, deny all users (fail closed)
  if (allowedList.length === 0) {
    return null;
  }

  // Return the email if it's on the allowlist, otherwise null
  return allowedList.includes(email) ? email : null;
}
