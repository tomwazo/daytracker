import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import jwt from "jsonwebtoken";

async function debugLogin(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";

  // Create a test token
  const testToken = jwt.sign(
    { username: "test", test: true },
    jwtSecret,
    { expiresIn: "1h" }
  );

  // Try to verify it
  try {
    const decoded = jwt.verify(testToken, jwtSecret);
    return {
      status: 200,
      jsonBody: {
        success: true,
        secretUsed: jwtSecret.substring(0, 10),
        secretLength: jwtSecret.length,
        testTokenFirst20: testToken.substring(0, 20),
        decoded,
        message: "Token creation and verification successful"
      },
    };
  } catch (error) {
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : "Unknown",
      },
    };
  }
}

app.http("debugLogin", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "debug/login",
  handler: debugLogin,
});
