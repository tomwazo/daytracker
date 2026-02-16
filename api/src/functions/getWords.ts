/**
 * getWords.ts — Azure Function: GET /api/words/{profileId}
 *
 * Returns all unique words a given profile has ever used in their entries.
 * The frontend uses this list to power autocomplete suggestions in the
 * WordInput component, so users can quickly re-use past descriptive words.
 *
 * The Cosmos DB query uses JOIN to flatten the words arrays across all
 * entries for the profile, then SELECT DISTINCT to deduplicate.
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
 * Handler for GET /api/words/{profileId}.
 * Queries Cosmos DB for all distinct words used by the specified profile.
 */
async function getWords(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Verify the caller is an authenticated, allowlisted user
  const user = getAllowedUser(request);
  if (!user) {
    return { status: 403, jsonBody: { error: "Access denied" } };
  }

  const profileId = request.params.profileId;

  if (!profileId) {
    return { status: 400, jsonBody: { error: "profileId required" } };
  }

  const container = getContainer();
  // JOIN flattens the words arrays; DISTINCT VALUE returns unique strings
  const { resources } = await container.items
    .query({
      query: "SELECT DISTINCT VALUE w FROM c JOIN w IN c.words WHERE c.profileId = @profileId",
      parameters: [{ name: "@profileId", value: profileId }],
    })
    .fetchAll();

  return { jsonBody: resources };
}

/** Register the Azure Function on GET /api/words/{profileId} */
app.http("getWords", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "words/{profileId}",
  handler: getWords,
});
