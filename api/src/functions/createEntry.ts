import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";
import { validateAuth } from "../authMiddleware.js";

interface EntryBody {
  profileId: string;
  date: string;
  score: number;
  words: string[];
}

const VALID_PROFILES = ["daddy", "mommy", "tabitha", "imogen"];

async function createEntry(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const authError = await validateAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as EntryBody;

  // Validate profileId
  if (!VALID_PROFILES.includes(body.profileId)) {
    return { status: 400, jsonBody: { error: "Invalid profileId" } };
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return { status: 400, jsonBody: { error: "Invalid date format" } };
  }

  // Validate score
  if (
    typeof body.score !== "number" ||
    body.score < 1 ||
    body.score > 10 ||
    !Number.isInteger(body.score)
  ) {
    return {
      status: 400,
      jsonBody: { error: "Score must be an integer between 1 and 10" },
    };
  }

  // Validate words
  if (
    !Array.isArray(body.words) ||
    body.words.length !== 3 ||
    body.words.some((w) => typeof w !== "string" || w.trim().length === 0)
  ) {
    return {
      status: 400,
      jsonBody: { error: "Exactly 3 non-empty words are required" },
    };
  }

  const words = body.words.map((w) => w.trim().toLowerCase());
  const id = `${body.profileId}-${body.date}`;

  const document = {
    id,
    profileId: body.profileId,
    date: body.date,
    score: body.score,
    words,
    createdAt: new Date().toISOString(),
  };

  const container = getContainer();
  await container.items.upsert(document);

  return { status: 201, jsonBody: document };
}

app.http("createEntry", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "entry",
  handler: createEntry,
});
