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
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";

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
