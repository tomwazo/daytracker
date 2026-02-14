import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";
import { validateToken } from "../authMiddleware.js";

async function getWords(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  // Validate auth token
  const authError = validateToken(request);
  if (authError) {
    return authError;
  }

  const profileId = request.params.profileId;

  if (!profileId) {
    return { status: 400, jsonBody: { error: "profileId required" } };
  }

  const container = getContainer();
  const { resources } = await container.items
    .query({
      query: "SELECT DISTINCT VALUE w FROM c JOIN w IN c.words WHERE c.profileId = @profileId",
      parameters: [{ name: "@profileId", value: profileId }],
    })
    .fetchAll();

  return { jsonBody: resources };
}

app.http("getWords", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "words/{profileId}",
  handler: getWords,
});
