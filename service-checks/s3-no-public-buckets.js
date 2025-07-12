import { s3Client as client } from "../lib/aws-client.js";
import {
  ListBucketsCommand,
  GetBucketAclCommand,
  GetBucketPolicyStatusCommand,
  GetPublicAccessBlockCommand
} from "@aws-sdk/client-s3";


export async function checkS3NoPublicBuckets() {
  const results = [];
  let buckets = [];

  try {
    const res = await client.send(new ListBucketsCommand({}));
    buckets = res.Buckets || [];
  } catch (err) {
    return {
      control: "CC6.6",
      description: "Ensure S3 buckets are not publicly accessible",
      results: [],
      summary: { error: err.message },
      passed: false,
    };
  }

  for (const bucket of buckets) {
    const name = bucket.Name;
    let compliant = true;
    const evidence = {};

    try {
      const aclRes = await client.send(new GetBucketAclCommand({ Bucket: name }));
      evidence.aclGrants = aclRes.Grants || [];

      const hasPublicGrant = (aclRes.Grants || []).some(grant =>
        grant.Grantee?.URI?.includes("AllUsers") || grant.Grantee?.URI?.includes("AuthenticatedUsers")
      );

      if (hasPublicGrant) compliant = false;

      const policyStatusRes = await client.send(new GetBucketPolicyStatusCommand({ Bucket: name }));
      evidence.policyIsPublic = policyStatusRes.PolicyStatus?.IsPublic || false;
      if (policyStatusRes.PolicyStatus?.IsPublic) compliant = false;

      const publicAccessBlockRes = await client.send(new GetPublicAccessBlockCommand({ Bucket: name }));
      const config = publicAccessBlockRes.PublicAccessBlockConfiguration;
      evidence.publicAccessBlock = config;

      const isBlockAll = config?.BlockPublicAcls && config?.IgnorePublicAcls && config?.BlockPublicPolicy && config?.RestrictPublicBuckets;
      if (!isBlockAll) compliant = false;
    } catch (err) {
      console.log('S3 Error: ', err.name, err.message);

      evidence.error = err.name === "NoSuchPublicAccessBlockConfiguration"
        ? "No public access block configuration"
        : err.message;
      compliant = false;
    }

    results.push({
      bucket: name,
      compliant,
      evidence,
    });
  }

  return {
    control: "CC6.6",
    description: "Ensure S3 buckets are not publicly accessible",
    results,
    summary: {
      totalBuckets: results.length,
      nonCompliant: results.filter(r => !r.compliant).length,
    },
    passed: results.every(r => r.compliant),
  };
}
