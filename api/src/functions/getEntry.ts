/**
 * getEntry.ts — Azure Function: GET /api/entry/{profileId}/{date}
 *
 * Retrieves a single daily entry for a given profile and date.
 * Returns { entry: <document> } if found, or { entry: null } if no entry
 * exists for that profile/date combination.
 *
 * Returning 200 with null (instead of 404) avoids noisy network errors in
 * the browser console when the user simply hasn't submitted yet today.
 *
 * Auth: Requires a valid SWA session with an email on the ALLOWED_USERS list.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";
import { getAllowedUser } from "../authHelper.js";

/**
 * Handler for GET /api/entry/{profileId}/{date}.
 * Performs a point-read from Cosmos DB using the composite ID and partition key.
 */
async function getEntry(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Verify the caller is an authenticated, allowlisted user
  const user = getAllowedUser(request);
  if (!user) {
    return { status: 403, jsonBody: { error: "Access denied" } };
  }

  const profileId = request.params.profileId;
  const date = request.params.date;

  if (!profileId || !date) {
    return { status: 400, jsonBody: { error: "profileId and date required" } };
  }

  // Cosmos DB document ID is "{profileId}-{date}", partitioned by profileId
  const id = `${profileId}-${date}`;
  const container = getContainer();

  try {
    const { resource } = await container.item(id, profileId).read();
    if (!resource) {
      return { status: 200, jsonBody: { entry: null } };
    }
    return { status: 200, jsonBody: { entry: resource } };
  } catch {
    // Treat read errors (e.g. 404 from Cosmos) as "no entry found"
    return { status: 200, jsonBody: { entry: null } };
  }
}

/** Register the Azure Function on GET /api/entry/{profileId}/{date} */
app.http("getEntry", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "entry/{profileId}/{date}",
  handler: getEntry,
});
