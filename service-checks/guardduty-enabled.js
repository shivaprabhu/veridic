import { guardDutyclient as client } from "../lib/aws-client.js"; 
import {
  ListDetectorsCommand,
  GetDetectorCommand,
} from "@aws-sdk/client-guardduty";


export async function checkGuardDutyEnabled() {
  const results = [];

  const { DetectorIds } = await client.send(new ListDetectorsCommand({}));
  console.log("GuardDuty Detectors:", DetectorIds);
  if(!DetectorIds || DetectorIds.length === 0) {
    return {
      control: "CC7.1",
      description: "Amazon GuardDuty must be enabled in the current AWS region",
      results: [
        {
          region: process.env.AWS_REGION,
          compliant: false,
          evidence: {
            detectors: [],
            reason: "GuardDuty is not enabled in this region.",
          },
        },
      ],
      summary: {
        totalRegionsChecked: 1,
        nonCompliant: 1,
      },
      passed: false,
    };
  }
  for (const detectorId of DetectorIds) {
    try {
      const { Status } = await client.send(
        new GetDetectorCommand({ DetectorId: detectorId })
      );
      
      const enabled = Status === "ENABLED";

      results.push({
        detectorId,
        compliant: enabled,
        evidence: { status: Status },
      });
    } catch (err) {
      console.log("GuardDuty Enabled Check Error:", err.name, err.message);
      
      results.push({
        detectorId,
        compliant: false,
        evidence: { error: err.message },
      });
    }
  }

  return {
    control: "CC7.1",
    description: "Amazon GuardDuty must be enabled in the current AWS region",
    results,
    summary: {
      totalDetectors: results.length,
      nonCompliant: results.filter((r) => !r.compliant).length,
    },
    passed: results.every((r) => r.compliant),
  };
}
