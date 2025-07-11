import{ec2Client as client} from "../lib/aws-client.js";
import {DescribeSecurityGroupsCommand} from "@aws-sdk/client-ec2";


export async function checkSecurityGroupsOpenPorts() {
  const results = [];

  const { SecurityGroups } = await client.send(
    new DescribeSecurityGroupsCommand({})
  );

  for (const sg of SecurityGroups) {
    let open = false;

    try{
      for (const perm of sg.IpPermissions || []) {
        const port = perm.FromPort;
        if (port === 22 || port === 3389) {
          const hasOpenCIDR = (perm.IpRanges || []).some((range) =>
            range.CidrIp === "0.0.0.0/0"
          );

          if (hasOpenCIDR) {
            open = true;
          }
        }
      }

      results.push({
        securityGroupId: sg.GroupId,
        compliant: !open,
        evidence: {
          groupName: sg.GroupName,
          openToWorldOnPorts: open ? [22, 3389] : [],
        },
      });
    }
    catch(err){
      console.log('Security Groups Open Ports Check Error:', err.name, err.message);
      
      results.push({
        securityGroupId: sg.GroupId,
        compliant: false,
        evidence: {
          error: err.message,
          groupName: sg.GroupName,
        },
      });
    }
  }

  return {
    control: "CC6.6",
    description:
      "Security groups must not expose ports 22 or 3389 to the public internet",
    results,
    summary: {
      totalSecurityGroups: results.length,
      nonCompliant: results.filter((r) => !r.compliant).length,
    },
    passed: results.every((r) => r.compliant),
  };
}
