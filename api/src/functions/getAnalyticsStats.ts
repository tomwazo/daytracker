import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";
import { validateToken } from "../authMiddleware.js";

async function getAnalyticsStats(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Validate auth token
  const authError = validateToken(request);
  if (authError) {
    return authError;
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

    // Calculate stats per profile
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

    // Calculate averages
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

app.http("getAnalyticsStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/stats",
  handler: getAnalyticsStats,
});
// Force rebuild
