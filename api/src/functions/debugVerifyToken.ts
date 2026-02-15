import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import jwt from "jsonwebtoken";

async function debugVerifyToken(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      status: 400,
      jsonBody: { error: "No Bearer token provided" },
    };
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";

  // Try to verify with current secret
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return {
      status: 200,
      jsonBody: {
        success: true,
        message: "Token is valid!",
        decoded,
        secretUsed: jwtSecret.substring(0, 10),
      },
    };
  } catch (error) {
    // Try with the default fallback secret
    let worksWithFallback = false;
    try {
      jwt.verify(token, "dev-secret-change-in-production");
      worksWithFallback = true;
    } catch (e) {
      // ignore
    }

    return {
      status: 200,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Unknown",
        currentSecret: jwtSecret.substring(0, 10),
        currentSecretLength: jwtSecret.length,
        worksWithFallbackSecret: worksWithFallback,
        tokenFirst20: token.substring(0, 20),
        message: worksWithFallback
          ? "❌ Token was signed with fallback secret 'dev-secret-change-in-production'"
          : "❌ Token was signed with an unknown secret"
      },
    };
  }
}

app.http("debugVerifyToken", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "debug/verify-token",
  handler: debugVerifyToken,
});
