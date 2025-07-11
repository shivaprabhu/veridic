import { ec2Client as client } from "../lib/aws-client.js";
import {DescribeVolumesCommand} from "@aws-sdk/client-ec2";

export async function checkEbsEncryptionEnabled() {
  try {
    const volumes = await client.send(new DescribeVolumesCommand({}));
    console.log(volumes);
    
    const results = volumes.Volumes.map((vol) => {
      return {
        volumeId: vol.VolumeId,
        compliant: vol.Encrypted === true,
        evidence: {
          encrypted: vol.Encrypted,
          kmsKeyId: vol.KmsKeyId || null,
        },
      };
    });

    return {
      control: "CC6.4",
      description: "All EBS volumes must be encrypted at rest",
      results,
      summary: {
        totalVolumes: results.length,
        nonCompliant: results.filter((r) => !r.compliant).length,
      },
      passed: results.every((r) => r.compliant),
    };
  } catch (err) {
    console.log("Error checking EBS encryption:", err.name, err.message);
    
    return {
      control: "CC6.4",
      description: "All EBS volumes must be encrypted at rest",
      results: [],
      summary: {
        totalVolumes: 0,
        nonCompliant: 0,
        error: err.name,
      },
      passed: false,
    };
  }
}
