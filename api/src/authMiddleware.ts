import { HttpRequest, HttpResponseInit } from "@azure/functions";
import jwt from "jsonwebtoken";

export function validateToken(request: HttpRequest): HttpResponseInit | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      status: 401,
      jsonBody: { error: "No authorization token provided" },
    };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  // TEMP: Hardcode to bypass env var issues
  const jwtSecret = "36973bfadee0e864d01a7ea6dc9832dbc39ce062c91be4f837cbd1ab897302e7b040e226ac871eed83b4a55e3a0b58607cc293df726572b388c1d96e3ed7d333";

  try {
    jwt.verify(token, jwtSecret) as { username: string };
    return null; // Auth successful
  } catch (error) {
    console.error("JWT verification failed:", {
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      tokenFirst10: token.substring(0, 10),
      secretFirst10: jwtSecret.substring(0, 10),
      secretLength: jwtSecret.length,
    });

    if (error instanceof jwt.TokenExpiredError) {
      return {
        status: 401,
        jsonBody: { error: "Token expired" },
      };
    }
    return {
      status: 401,
      jsonBody: {
        error: "Invalid token",
        debug: error instanceof Error ? error.message : "Unknown error"
      },
    };
  }
}
