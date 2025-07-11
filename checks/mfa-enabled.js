import { iamClient as client } from "../lib/aws-client.js";
import {ListUsersCommand,ListMFADevicesCommand}  from "@aws-sdk/client-iam";


export async function checkMFAEnabled() {
  const results = [];

  const users = await client.send(new ListUsersCommand({}));

  for (const user of users.Users) {
    try{
    const username = user.UserName;

    const mfa = await client.send(new ListMFADevicesCommand({ UserName: username }));

    const isCompliant = mfa.MFADevices.length > 0;

    results.push({
      user: username,
      compliant: isCompliant,
      evidence: {
        mfaDevices: mfa.MFADevices.map(dev => dev.SerialNumber),
      },
    });
  }
  catch(err){
      console.log('IAM MFA enabled Error: ', err.name, err.message);
      
      results.push({
        user: user.UserName,
        compliant: false,
        evidence: {
          error: err.message || "Failed to retrieve MFA devices",
        },
      });
    }
  }

  return {
    control: "CC6.2",
    description: "All IAM users must have MFA enabled",
    results,
    summary: {
      totalUsers: results.length,
      nonCompliant: results.filter(r => !r.compliant).length,
    },
    passed: results.every(r => r.compliant),
  };
}
