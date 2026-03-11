/// <reference path="../.sst/platform/config.d.ts" />

import { vpc } from "./vpc.js";

export const database = new sst.aws.Aurora("Database", {
  engine: "postgres",
  vpc,
  scaling: {
    min: "0 ACU",
    max: "4 ACU",
    pauseAfter: "5 minutes",
  },
  dev: {
    username: "postgres",
    password: "password",
    database: "ev_offer_dev",
    host: "localhost",
    port: 5432,
  },
});

export const DATABASE_URL = $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}?connection_limit=1&connect_timeout=30`;
