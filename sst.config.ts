/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ev-offer",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage || ""),
      home: "aws",
    };
  },
  async run() {
    // TODO: unused
    const { vpc: _vpc } = await import("./infra/vpc");
    const { database } = await import("./infra/database");
    const { userPool, userPoolClient } = await import("./infra/auth");
    const { api } = await import("./infra/api");
    await import("./infra/web");

    return {
      api: api.url,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
      dbHost: database.host,
      dbName: database.database,
    };
  },
});
