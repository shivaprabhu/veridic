import { ec2Client } from "../lib/aws-client.js";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";


export async function checkReservedInstanceRecommendation() {
  const results = [];

  try {
    const instancesData = await ec2Client.send(new DescribeInstancesCommand({}));
    const reservations = instancesData.Reservations || [];

    if (reservations.length === 0) {
      return {
        control: "RI.1",
        description: "Identify EC2 instances eligible for Reserved Instance purchase",
        results: [],
        summary: {
          totalInstances: 0,
          eligibleForReservation: 0,
        },
        passed: true,
        resource_exists: false,
      };
    }

    for (const reservation of reservations) {
      for (const instance of reservation.Instances || []) {
        const launchTime = new Date(instance.LaunchTime);
        const now = new Date();
        const uptimeMs = now - launchTime;
        const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

        const eligible = uptimeDays >= 30;

        results.push({
          instanceId: instance.InstanceId,
          compliant: !eligible,
          resource_exists: true,
          evidence: {
            launchTime: instance.LaunchTime,
            uptimeDays,
            instanceType: instance.InstanceType,
            region: process.env.AWS_REGION,
          },
        });
      }
    }

    return {
      control: "RI.1",
      description: "Identify EC2 instances eligible for Reserved Instance purchase",
      results,
      summary: {
        totalInstances: results.length,
        eligibleForReservation: results.filter(r => !r.compliant).length,
      },
      passed: results.every(r => r.compliant),
    };
  } catch (err) {
    return {
      control: "RI.1",
      description: "Identify EC2 instances eligible for Reserved Instance purchase",
      results: [],
      summary: {
        totalInstances: 0,
        eligibleForReservation: 0,
      },
      passed: true,
      resource_exists: false,
      error: err.name === "UnauthorizedOperation" || err.name === "AccessDenied"
        ? "Access denied to EC2 DescribeInstances"
        : err.message,
    };
  }
}
