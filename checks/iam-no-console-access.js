import { iamClient as client } from "../lib/aws-client.js";
import {ListUsersCommand,GetLoginProfileCommand} from "@aws-sdk/client-iam";


export async function checkNoConsoleAccess() {
  const users = await client.send(new ListUsersCommand({}));
  const results = [];

  for (const user of users.Users) {
    const userName = user.UserName;
    let hasConsoleAccess = false;
    let error = null;

    try {
      const loginProfile = await client.send(
        new GetLoginProfileCommand({ UserName: userName })
      );
      // Login profile exists → console access
      hasConsoleAccess = !!loginProfile.LoginProfile;
    } catch (err) {
      console.log('IAM no console access Error: ', err.name, err.message);

      const name = err?.name || "";

      const isNoSuchEntity =
        name === "NoSuchEntity" || name === "NoSuchEntityException";
      const isAccessDenied =
        name === "AccessDenied" || name === "AccessDeniedException";

      if (isNoSuchEntity) {
        hasConsoleAccess = false; // expected for non-console users
      } else if (isAccessDenied) {
        results.push({
          user: username,
          compliant: false,
          evidence: {
            error: "Access denied while checking login profile",
          },
        });
        continue;
      } else {
        // Unknown error, surface it
        results.push({
          user: username,
          compliant: false,
          evidence: {
            error: err.message || "Unknown error",
          },
        });
        continue;
      }
    }

    results.push({
      user: userName,
      compliant: !hasConsoleAccess,
      evidence: {
        consoleAccess: hasConsoleAccess,
      },
    });
  }

  return {
    control: "CC6.2",
    description: "IAM users should not have AWS Management Console access",
    results,
    summary: {
      totalUsers: results.length,
      nonCompliant: results.filter((r) => !r.compliant).length,
    },
    passed: results.every((r) => r.compliant),
  };
}
