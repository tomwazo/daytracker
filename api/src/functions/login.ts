import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Hardcoded users with bcrypt password hashes
const USERS = {
  tom: {
    username: "tom",
    passwordHash: "$2b$10$fSrkkZkg7F5J2w9e5GKni.QZ4Xh.QVhLQEeRCgNVOZO0ZyprBhMBK",
  },
  laura: {
    username: "laura",
    passwordHash: "$2b$10$DsxGpvBXBM0nJbeI4fuNnu9VJBDDWiAGK9vlZtaN44b.wnxy.kXxC",
  },
};

async function login(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body as {
      username?: string;
      password?: string;
      rememberMe?: boolean;
    };

    // Validate input
    if (!username || !password) {
      return {
        status: 400,
        jsonBody: { error: "Username and password are required" },
      };
    }

    // Find user
    const user = USERS[username.toLowerCase() as keyof typeof USERS];
    if (!user) {
      return {
        status: 401,
        jsonBody: { error: "Invalid username or password" },
      };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return {
        status: 401,
        jsonBody: { error: "Invalid username or password" },
      };
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
    const expiresIn = rememberMe ? "90d" : "7d";

    const token = jwt.sign(
      { username: user.username },
      jwtSecret,
      { expiresIn }
    );

    // Debug info to help troubleshoot
    const secretHash = crypto.createHash('sha256').update(jwtSecret).digest('hex');
    console.log("Login - JWT Secret being used:", {
      secretFirst10: jwtSecret.substring(0, 10),
      secretLength: jwtSecret.length,
      secretHash,
      username: user.username,
    });

    return {
      status: 200,
      jsonBody: {
        token,
        username: user.username,
        expiresIn: rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // seconds
        debug_secretUsed: jwtSecret.substring(0, 10), // TEMP: for debugging
        debug_secretLength: jwtSecret.length, // TEMP: for debugging
        debug_secretHash: secretHash, // TEMP: full secret hash for comparison
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "login",
  handler: login,
});
