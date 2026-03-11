/// <reference path="../.sst/platform/config.d.ts" />

export const vpc = new sst.aws.Vpc("Vpc", {
  bastion: true,
  nat: "ec2",
  // 1 AZ = one NAT instance (~half the always-on cost). Aurora can run in one AZ for dev.
  az: 1,
});
