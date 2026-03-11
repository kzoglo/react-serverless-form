/// <reference path="../.sst/platform/config.d.ts" />

import { api } from "./api.js";
import { userPool, userPoolClient } from "./auth.js";

export const web = new sst.aws.StaticSite("Web", {
  build: {
    command: "pnpm run build",
    output: "dist",
  },
  path: "packages/frontend",
  environment: {
    VITE_API_URL: api.url,
    VITE_USER_POOL_ID: userPool.id,
    VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
    VITE_AWS_REGION: aws.getRegionOutput().name,
  },
});
