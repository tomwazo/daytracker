import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../cosmosClient.js";

async function getEntry(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const profileId = request.params.profileId;
  const date = request.params.date;

  if (!profileId || !date) {
    return { status: 400, jsonBody: { error: "profileId and date required" } };
  }

  const id = `${profileId}-${date}`;
  const container = getContainer();

  try {
    const { resource } = await container.item(id, profileId).read();
    if (!resource) {
      return { status: 200, jsonBody: { entry: null } };
    }
    return { status: 200, jsonBody: { entry: resource } };
  } catch {
    return { status: 200, jsonBody: { entry: null } };
  }
}

app.http("getEntry", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "entry/{profileId}/{date}",
  handler: getEntry,
});
