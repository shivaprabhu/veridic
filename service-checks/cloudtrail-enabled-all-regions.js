import { cloudTrailClient as client } from "../lib/aws-client.js";
import { DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";


export async function checkCloudTrailAllRegions() {
  const results = [];

  let trails = [];
  try {
    const { trailList } = await client.send(new DescribeTrailsCommand({ includeShadowTrails: false }));
    trails = trailList || [];
  } catch (err) {
    console.log('Cloudtrail Error: ', err.name, err.message);

    return {
      control: "CC7.2",
      description: "CloudTrail should be enabled in all AWS regions",
      results: [],
      summary: {
        error: err.message || "Failed to retrieve trails",
      },
      passed: false,
    };
  }

  for (const trail of trails) {
    results.push({
      trailName: trail.Name,
      compliant: trail.IsMultiRegionTrail === true,
      evidence: {
        homeRegion: trail.HomeRegion,
        isMultiRegion: trail.IsMultiRegionTrail,
      },
    });
  }

  return {
    control: "CC7.2",
    description: "CloudTrail should be enabled in all AWS regions",
    results,
    summary: {
      totalTrails: results.length,
      nonCompliant: results.filter(r => !r.compliant).length,
    },
    passed: results.length > 0 && results.every(r => r.compliant),
  };
}
