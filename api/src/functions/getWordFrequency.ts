/**
 * getWordFrequency.ts — Azure Function: GET /api/analytics/word-frequency
 *
 * Counts how many times each descriptive word appears across entries in a
 * date range. Powers the Dashboard's WordFrequencyChart bar chart.
 * Results are sorted by frequency (most common first).
 *
 * Query parameters:
 *   startDate  (required) — Start of range (YYYY-MM-DD)
 *   endDate    (required) — End of range (YYYY-MM-DD)
 *   profileId  (optional) — Filter to a single family member
 *
 * Response shape: [{ word: string, count: number }, ...]
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
 * Handler for GET /api/analytics/word-frequency.
 * Fetches all words arrays in the date range, then counts occurrences
 * in-memory and returns sorted results.
 */
async function getWordFrequency(
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

  // Only fetch words arrays — minimises data transfer from Cosmos DB
  let query = "SELECT c.words FROM c WHERE c.date >= @startDate AND c.date <= @endDate";
  const parameters: Array<{ name: string; value: string }> = [
    { name: "@startDate", value: startDate },
    { name: "@endDate", value: endDate },
  ];

  // Optionally narrow results to a single profile
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

    // Flatten all words arrays and tally each word's occurrence count
    const wordCounts: Record<string, number> = {};
    resources.forEach((entry: { words: string[] }) => {
      entry.words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Convert to sorted array — most frequent words first
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

/** Register the Azure Function on GET /api/analytics/word-frequency */
app.http("getWordFrequency", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "analytics/word-frequency",
  handler: getWordFrequency,
});
