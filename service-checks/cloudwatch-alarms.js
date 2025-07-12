import {cloudwatchClient as client} from "../lib/aws-client.js";
import { DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";


export async function checkCloudWatchAlarms() {
  const results = [];
  const criticalMetrics = ["CPUUtilization", "StatusCheckFailed", "DiskReadOps", "DiskWriteOps"];
  let alarms;

  try {
    const response = await client.send(new DescribeAlarmsCommand({}));
    alarms = response.MetricAlarms || [];

    if ( alarms.length === 0) {
      return {
        control: "CC7.2",
        description: "CloudWatch alarms must be enabled for key metrics like CPU, disk, and health checks.",
        results: [],
        summary: {
          totalMetrics: criticalMetrics.length,
          nonCompliant: criticalMetrics.length,
        },
        passed: false,
        note: "No CloudWatch alarms found in the current region.",
      };
    }

  } catch (err) {
    return {
      control: "CC7.2",
      description: "CloudWatch alarms must be enabled for key metrics like CPU, disk, and health checks.",
      results: [],
      summary: {
        totalMetrics: criticalMetrics.length,
        nonCompliant: criticalMetrics.length,
      },
      passed: false,
      note: `Error retrieving CloudWatch alarms: ${err.name} — ${err.message}`,
    };
  }

  for (const metric of criticalMetrics) {
    const matchingAlarms = alarms.filter(alarm => alarm.MetricName === metric);

    results.push({
      metric,
      compliant: matchingAlarms.length > 0,
      evidence: {
        alarms: matchingAlarms.map(a => a.AlarmName),
      },
    });
  }

  const allCompliant = results.every(r => r.compliant);

  return {
    control: "CC7.2",
    description: "CloudWatch alarms must be enabled for key metrics like CPU, disk, and health checks.",
    results,
    summary: {
      totalMetrics: results.length,
      nonCompliant: results.filter(r => !r.compliant).length,
    },
    passed: allCompliant,
    note: alarms.length === 0 ? "No CloudWatch alarms found in the current region." : undefined,
  };
}
