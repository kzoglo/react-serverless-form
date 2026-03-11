/// <reference path="../.sst/platform/config.d.ts" />

import { userPool } from "./auth.js";
import { DATABASE_URL, database } from "./database.js";
import { vpc } from "./vpc.js";

export const api = new sst.aws.ApiGatewayV2("Api", {
  cors: {
    allowOrigins: ["*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});

api.route("$default", {
  handler: "packages/functions/src/handler.handler",
  link: [database],
  vpc,
  memory: "512 MB",
  timeout: "30 seconds",
  // allow to set reserved concurrency for the lambda function
  // concurrency: {
  //   reserved: 5,
  // },
  environment: {
    DATABASE_URL: DATABASE_URL,
    COGNITO_USER_POOL_ID: userPool.id,
  },
});
