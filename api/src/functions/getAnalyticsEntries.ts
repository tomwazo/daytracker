/**
 * getAnalyticsEntries.ts — Azure Function: GET /api/analytics/entries
 *
 * Returns all daily entries within a date range, optionally filtered by
 * profile. Used by the Dashboard to populate the ScoreChart and entries
 * table. Results are sorted newest-first.
 *
 * Query parameters:
 *   startDate  (required) — Start of range (YYYY-MM-DD)
 *   endDate    (required) — End of range (YYYY-MM-DD)
 *   profileId  (optional) — Filter to a single family member
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
 * Handler for GET /api/analytics/entries.
 * Dynamically builds a Cosmos DB SQL query based on the provided filters.
 */
async function getAnalyticsEntries(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Verify the caller is an authenticated, allowlisted user
  const user = getAllowedUser(request);
  if (!user) {
    return { status: 403, jsonBody: { error: "Access denied" } };
  }

  const startDate = request.query.get("startDate");
  const endDate = request.query.get("endDate");
  const profileId = request.query.get("profileId");

  if (!startDate || !endDate) {
    return {
      status: 400,
      jsonBody: { error: "startDate and endDate are required" },
    };
  }

  const container = getContainer();

  // Build parameterised query — date range is always applied
  let query = "SELECT * FROM c WHERE c.date >= @startDate AND c.date <= @endDate";
  const parameters: Array<{ name: string; value: string }> = [
    { name: "@startDate", value: startDate },
    { name: "@endDate", value: endDate },
  ];

  // Optionally narrow results to a single profile
  if (profileId) {
    query += " AND c.profileId = @profileId";
    parameters.push({ name: "@profileId", value: profileId });
  }

  query += " ORDER BY c.date DESC";

  try {
    const { resources } = await container.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    return { status: 200, jsonBody: resources };
  } catch (error) {
    console.error("Error fetching analytics entries:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to fetch entries" },
    };
  }
}

/** Register the Azure Function on GET /api/analytics/entries */
app.http("getAnalyticsEntries", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/entries",
  handler: getAnalyticsEntries,
});
