import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";

async function getWordFrequency(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
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

  // Build query to get all entries in date range
  let query = "SELECT c.words FROM c WHERE c.date >= @startDate AND c.date <= @endDate";
  const parameters: Array<{ name: string; value: string }> = [
    { name: "@startDate", value: startDate },
    { name: "@endDate", value: endDate },
  ];

  if (profileId) {
    query += " AND c.profileId = @profileId";
    parameters.push({ name: "@profileId", value: profileId });
  }

  try {
    const { resources } = await container.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    // Count word frequency
    const wordCounts: Record<string, number> = {};
    resources.forEach((entry: { words: string[] }) => {
      entry.words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Convert to array and sort by frequency
    const wordFrequency = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return { status: 200, jsonBody: wordFrequency };
  } catch (error) {
    console.error("Error fetching word frequency:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to fetch word frequency" },
    };
  }
}

app.http("getWordFrequency", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/word-frequency",
  handler: getWordFrequency,
});
