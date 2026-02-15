import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

async function debugAuth(
  request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const jwtSecret = process.env.JWT_SECRET;

  return {
    status: 200,
    jsonBody: {
      hasJwtSecret: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length || 0,
      jwtSecretFirst10: jwtSecret?.substring(0, 10) || "not-set",
      allEnvVars: Object.keys(process.env).filter(k =>
        k.includes('JWT') || k.includes('COSMOS')
      ),
    },
  };
}

app.http("debugAuth", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "debug/auth",
  handler: debugAuth,
});
