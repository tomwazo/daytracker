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
    if (error instanceof jwt.TokenExpiredError) {
      return {
        status: 401,
        jsonBody: { error: "Token expired" },
      };
    }
    return {
      status: 401,
      jsonBody: { error: "Invalid token" },
    };
  }
}
