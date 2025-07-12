import { ec2Client,s3Client,rDSClient } from "../lib/aws-client.js";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { GetBucketTaggingCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DescribeDBInstancesCommand, ListTagsForResourceCommand as RDSListTags} from "@aws-sdk/client-rds";

const REQUIRED_TAGS = ["env", "team", "project"];

export async function checkTagCompliance() {
  const results = [];

  // --- EC2 ---
  try {
    const instancesData = await ec2Client.send(new DescribeInstancesCommand({}));

    if (!instancesData.Reservations || instancesData.Reservations.length === 0) {
      results.push({
        resource: "ec2",
        service: "ec2",
        compliant: true,
        resource_exists:false,
        evidence: { error: "No EC2 instances found" },
      });
    }
    else
    for (const reservation of instancesData.Reservations || []) {
      for (const instance of reservation.Instances) {
        const tags = instance.Tags || [];
        const tagKeys = tags.map(t => t.Key);
        const missing = REQUIRED_TAGS.filter(tag => !tagKeys.includes(tag));
        results.push({
          resource: instance.InstanceId,
          service: "ec2",
          compliant: tagKeys.length > 0 && missing.length === 0,
          evidence: { missingTags: missing, presentTags: tagKeys },
        });
      }
    }
  } catch (err) {
    results.push({
      service: "ec2",
      resource: "all",
      compliant: false,
      evidence: { error: err.name },
    });
  }

  // --- S3 ---
  try {
    const bucketsData = await s3Client.send(new ListBucketsCommand({}));

    if (!bucketsData.Buckets || bucketsData.Buckets.length === 0) {
      results.push({
        resource: "s3",
        service: "s3",
        compliant: true,
        resource_exists: false,
        evidence: { error: "No S3 buckets found" },
      });
    }

    else
    for (const bucket of bucketsData.Buckets) {
      try {
        const tagsRes = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket.Name }));
        const tagKeys = (tagsRes.TagSet || []).map(t => t.Key);
        const missing = REQUIRED_TAGS.filter(tag => !tagKeys.includes(tag));
        results.push({
          resource: bucket.Name,
          service: "s3",
          compliant: tagKeys.length > 0 && missing.length === 0,
          evidence: { missingTags: missing, presentTags: tagKeys },
        });
      } catch (err) {
        if (err.name === "NoSuchTagSet") {
          results.push({
            resource: bucket.Name,
            service: "s3",
            compliant: false,
            evidence: { missingTags: REQUIRED_TAGS, presentTags: [] },
          });
        } else {
          results.push({
            resource: bucket.Name,
            service: "s3",
            compliant: false,
            evidence: { error: err.name },
          });
        }
      }
    }
  } catch (err) {
    results.push({
      service: "s3",
      resource: "all",
      compliant: false,
      evidence: { error: err.name },
    });
  }

  // --- RDS ---
  try {
    const dbs = await rDSClient.send(new DescribeDBInstancesCommand({}));

    if (!dbs.DBInstances || dbs.DBInstances.length === 0) {
      results.push({
        resource: "rds",
        service: "rds",
        compliant: true,
        resource_exists: false,
        evidence: { error: "No RDS instances found" },
      });
    }

    else
    for (const db of dbs.DBInstances) {
      const arn = db.DBInstanceArn;
      try {
        const tagData = await rds.send(RDSListTags({ ResourceName: arn }));
        const tagKeys = (tagData.TagList || []).map(t => t.Key);
        const missing = REQUIRED_TAGS.filter(tag => !tagKeys.includes(tag));
        results.push({
          resource: db.DBInstanceIdentifier,
          service: "rds",
          compliant: tagKeys.length > 0 && missing.length === 0,
          evidence: { missingTags: missing, presentTags: tagKeys },
        });
      } catch (err) {
        results.push({
          resource: db.DBInstanceIdentifier,
          service: "rds",
          compliant: false,
          evidence: { error: err.name },
        });
      }
    }
  } catch (err) {
    results.push({
      service: "rds",
      resource: "all",
      compliant: false,
      evidence: { error: err.name },
    });
  }

  return {
    control: "CC4.1",
    description: "Ensure all cloud resources are tagged with cost allocation fields (env, team, project)",
    results,
    summary: {
      totalResources: results.length,
      nonCompliant: results.filter(r => !r.compliant).length,
    },
    passed: results.every(r => r.compliant),
  };
}
