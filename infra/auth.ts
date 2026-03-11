/// <reference path="../.sst/platform/config.d.ts" />

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  usernames: ["email"],
  verify: {
    emailSubject: "Verify your EV Offer account",
    emailMessage: "Welcome to EV Offer! Your verification code is {####}",
  },
});

export const userPoolClient = userPool.addClient("WebClient");
