import { iamClient as client } from "../lib/aws-client.js";
import {
  ListRolesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand
} from "@aws-sdk/client-iam";


function hasWildcardPermission(statement) {
  if (!statement.Effect || statement.Effect !== "Allow") return false;
  const actionWildcard = statement.Action === "*" || (Array.isArray(statement.Action) && statement.Action.includes("*"));
  const resourceWildcard = statement.Resource === "*" || (Array.isArray(statement.Resource) && statement.Resource.includes("*"));
  return actionWildcard || resourceWildcard;
}

export async function checkIAMRoleWildcard() {
  const results = [];
  const roles = await client.send(new ListRolesCommand({}));

  for (const role of roles.Roles) {
    const roleName = role.RoleName;
    let roleCompliant = true;
    const evidence = { wildcards: [] };

    // Inline policies
    const inlinePolicies = await client.send(new ListRolePoliciesCommand({ RoleName: roleName }));
    for (const policyName of inlinePolicies.PolicyNames) {
      const policy = await client.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
      const statements = Array.isArray(policy.PolicyDocument.Statement)
        ? policy.PolicyDocument.Statement
        : [policy.PolicyDocument.Statement];

      for (const stmt of statements) {
        if (hasWildcardPermission(stmt)) {
          roleCompliant = false;
          evidence.wildcards.push({ source: "inline", policyName, statement: stmt });
        }
      }
    }

    // Attached managed policies
    const attached = await client.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
    for (const policy of attached.AttachedPolicies) {
      try{
        const policyMeta = await client.send(new GetPolicyCommand({ PolicyArn: policy.PolicyArn }));
        const version = await client.send(new GetPolicyVersionCommand({
          PolicyArn: policy.PolicyArn,
          VersionId: policyMeta.Policy.DefaultVersionId
        }));
        const statements = Array.isArray(version.PolicyVersion.Document.Statement)
          ? version.PolicyVersion.Document.Statement
          : [version.PolicyVersion.Document.Statement];

        for (const stmt of statements) {
          if (hasWildcardPermission(stmt)) {
            roleCompliant = false;
            evidence.wildcards.push({ source: "managed", policyName: policy.PolicyName, statement: stmt });
          }
        }
      }
      catch(err){
        console.log('IAM role wildcard: ', err.name, err.message);

        const isNoSuchEntity = ['NoSuchEntity', 'NoSuchEntityException'].includes(err.name);
        const isAccessDenied = ['AccessDenied', 'AccessDeniedException'].includes(err.name);

        if (isAccessDenied) {
          results.push({
            role: role.RoleName,
            compliant: false,
            evidence: {
              error: 'Access denied when retrieving role policy',
            },
          });
        } else if (isNoSuchEntity) {
          results.push({
            role: role.RoleName,
            compliant: false,
            evidence: {
              error: 'err.message',
            },
          });
        } else {
          console.error(`Unexpected error for role ${role.RoleName}:`, err);
          results.push({
            role: role.RoleName,
            compliant: false,
            evidence: { error: `Unexpected error: ${err.name}` },
          });
        }
    }

    results.push({
      role: roleName,
      compliant: roleCompliant,
      evidence
    });
  }

  return {
    control: "CC6.1",
    description: "IAM roles must not use wildcard '*' in actions or resources",
    results,
    summary: {
      totalRoles: results.length,
      nonCompliant: results.filter(r => !r.compliant).length
    },
    passed: results.every(r => r.compliant)
  };
}
}