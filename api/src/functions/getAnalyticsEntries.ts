import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";
import { validateToken } from "../authMiddleware.js";

async function getAnalyticsEntries(
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
  const profileId = request.query.get("profileId");

  if (!startDate || !endDate) {
    return {
      status: 400,
      jsonBody: { error: "startDate and endDate are required" },
    };
  }

  const container = getContainer();

  // Build query
  let query = "SELECT * FROM c WHERE c.date >= @startDate AND c.date <= @endDate";
  const parameters: Array<{ name: string; value: string }> = [
    { name: "@startDate", value: startDate },
    { name: "@endDate", value: endDate },
  ];

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

app.http("getAnalyticsEntries", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/entries",
  handler: getAnalyticsEntries,
});
