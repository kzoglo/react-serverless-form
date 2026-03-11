import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import * as jose from "jose";
import type { AppEnv } from "../app.js";

let jwksCache: jose.JWTVerifyGetKey | null = null;

function getJwks(): jose.JWTVerifyGetKey {
  if (jwksCache) return jwksCache;

  const region = process.env.AWS_REGION || "eu-central-1";
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    throw new Error("COGNITO_USER_POOL_ID environment variable is not set");
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);

  jwksCache = jose.createRemoteJWKSet(jwksUrl);
  return jwksCache;
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice(7);

  try {
    const region = process.env.AWS_REGION || "eu-central-1";
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer,
      audience: undefined,
    });

    const userId = payload.sub;
    if (!userId) {
      throw new HTTPException(401, { message: "Token missing sub claim" });
    }

    c.set("userId", userId);
    await next();
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
});
