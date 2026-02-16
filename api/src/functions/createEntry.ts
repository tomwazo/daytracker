/**
 * createEntry.ts — Azure Function: POST /api/entry
 *
 * Creates (or overwrites) a daily mindfulness entry for a family member.
 * Each entry contains a score (1-10) and exactly three descriptive words.
 *
 * The document ID is "{profileId}-{date}", so upserting naturally enforces
 * the one-entry-per-profile-per-day constraint.
 *
 * Validation rules:
 *   - profileId must be one of the four family members
 *   - date must be YYYY-MM-DD format
 *   - score must be an integer 1-10
 *   - exactly 3 non-empty, unique, single-word entries required
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

/** Shape of the expected JSON request body */
interface EntryBody {
  profileId: string;
  date: string;
  score: number;
  words: string[];
}

/** The four family member profile IDs accepted by the app */
const VALID_PROFILES = ["daddy", "mommy", "tabitha", "imogen"];

/**
 * Handler for POST /api/entry.
 * Validates the request body, normalises words to lowercase, and upserts
 * the entry document into Cosmos DB.
 */
async function createEntry(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Verify the caller is an authenticated, allowlisted user
  const user = getAllowedUser(request);
  if (!user) {
    return { status: 403, jsonBody: { error: "Access denied" } };
  }

  const body = (await request.json()) as EntryBody;

  // --- Input validation ---

  // profileId must match a known family member
  if (!VALID_PROFILES.includes(body.profileId)) {
    return { status: 400, jsonBody: { error: "Invalid profileId" } };
  }

  // Date must be in ISO date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return { status: 400, jsonBody: { error: "Invalid date format" } };
  }

  // Score must be a whole number between 1 and 10 inclusive
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

  // Must supply exactly 3 non-empty strings
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

  // Words must be single words (no whitespace)
  if (body.words.some((w) => /\s/.test(w))) {
    return {
      status: 400,
      jsonBody: { error: "Words cannot contain spaces" },
    };
  }

  // Normalise to lowercase for consistent storage and autocomplete
  const words = body.words.map((w) => w.trim().toLowerCase());

  // All three words must be distinct
  const uniqueWords = new Set(words);
  if (uniqueWords.size !== words.length) {
    return {
      status: 400,
      jsonBody: { error: "Each word must be unique" },
    };
  }

  // --- Build and persist the document ---

  // Composite ID enforces one entry per profile per day
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
  // Upsert: creates a new doc or overwrites an existing one with the same ID
  await container.items.upsert(document);

  return { status: 201, jsonBody: document };
}

/** Register the Azure Function on POST /api/entry */
app.http("createEntry", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "entry",
  handler: createEntry,
});
