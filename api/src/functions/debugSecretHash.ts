import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import crypto from "crypto";

async function debugSecretHash(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";

  // Create a hash of the full secret for comparison
  const hash = crypto.createHash('sha256').update(jwtSecret).digest('hex');

  return {
    status: 200,
    jsonBody: {
      secretFirst20: jwtSecret.substring(0, 20),
      secretLast20: jwtSecret.substring(jwtSecret.length - 20),
      secretLength: jwtSecret.length,
      secretHash: hash, // Full hash for comparison
      message: "Compare this hash across different endpoints"
    },
  };
}

app.http("debugSecretHash", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "debug/secret-hash",
  handler: debugSecretHash,
});
