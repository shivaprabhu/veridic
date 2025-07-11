import { elbClient as client } from "../lib/aws-client.js";
import {
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";


export async function checkELBAccessLogs() {
  const results = [];

  try {
    const { LoadBalancers } = await client.send(new DescribeLoadBalancersCommand({}));
    
    if(!LoadBalancers || LoadBalancers.length === 0) {
      return {
        control: "CC7.2",
        description: "Makes sure your load balancer traffic is auditable",
        results: [],
        summary: {
          totalALBs: 0,
          nonCompliant: 0,
        },
        passed: true,
        note: "No Application Load Balancers (ALBs) found in this region",
      };
    }

    for (const lb of LoadBalancers) {
      if (lb.Type !== "application") continue;

      const { Attributes } = await client.send(
        new DescribeLoadBalancerAttributesCommand({
          LoadBalancerArn: lb.LoadBalancerArn,
        })
      );

      const accessLogsEnabled = Attributes.find(attr => attr.Key === "access_logs.s3.enabled")?.Value === "true";

      results.push({
        loadBalancer: lb.LoadBalancerName,
        compliant: accessLogsEnabled,
        evidence: {
          accessLogs: accessLogsEnabled,
          attributes: Attributes.reduce((acc, attr) => ({ ...acc, [attr.Key]: attr.Value }), {}),
        },
      });
    }

    return {
      control: "CC7.2",
      description: "All ALBs must have access logs enabled",
      results,
      summary: {
        totalALBs: results.length,
        nonCompliant: results.filter(r => !r.compliant).length,
      },
      passed: results.every(r => r.compliant),
    };
  } catch (err) {
    console.log("Error checking ALB access logs:", err.name, err.message);
    
    return {
      control: "CC7.2",
      description: "All ALBs must have access logs enabled",
      results: [],
      summary: {
        totalALBs: 0,
        nonCompliant: 0,
      },
      passed: false,
      error: err.name,
    };
  }
}
