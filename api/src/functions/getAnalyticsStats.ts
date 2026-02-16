/**
 * getAnalyticsStats.ts — Azure Function: GET /api/analytics/stats
 *
 * Computes summary statistics for the Dashboard's StatsCards component.
 * For a given date range, calculates per-profile average scores and entry
 * counts, plus a grand total of all entries.
 *
 * Query parameters:
 *   startDate (required) — Start of range (YYYY-MM-DD)
 *   endDate   (required) — End of range (YYYY-MM-DD)
 *
 * Response shape:
 *   { profileStats: { [profileId]: { avgScore, count, totalScore } }, totalEntries }
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
 * Handler for GET /api/analytics/stats.
 * Fetches all scores in the date range and aggregates them in-memory
 * (Cosmos DB free tier doesn't support GROUP BY with aggregations well).
 */
async function getAnalyticsStats(
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

  if (!startDate || !endDate) {
    return {
      status: 400,
      jsonBody: { error: "startDate and endDate are required" },
    };
  }

  const container = getContainer();

  // Only fetch profileId and score — minimises data transfer
  const query = "SELECT c.profileId, c.score FROM c WHERE c.date >= @startDate AND c.date <= @endDate";
  const parameters = [
    { name: "@startDate", value: startDate },
    { name: "@endDate", value: endDate },
  ];

  try {
    const { resources } = await container.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    // Accumulate totals per profile for average calculation
    const profileStats: Record<
      string,
      { totalScore: number; count: number; avgScore: number }
    > = {};

    resources.forEach((entry: { profileId: string; score: number }) => {
      if (!profileStats[entry.profileId]) {
        profileStats[entry.profileId] = { totalScore: 0, count: 0, avgScore: 0 };
      }
      profileStats[entry.profileId].totalScore += entry.score;
      profileStats[entry.profileId].count += 1;
    });

    // Derive average score per profile, rounded to 1 decimal place
    Object.keys(profileStats).forEach((profileId) => {
      const stats = profileStats[profileId];
      stats.avgScore = Math.round((stats.totalScore / stats.count) * 10) / 10;
    });

    const totalEntries = resources.length;

    return {
      status: 200,
      jsonBody: {
        profileStats,
        totalEntries,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to fetch stats" },
    };
  }
}

/** Register the Azure Function on GET /api/analytics/stats */
app.http("getAnalyticsStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/stats",
  handler: getAnalyticsStats,
});
