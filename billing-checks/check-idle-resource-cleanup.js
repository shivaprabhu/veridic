import {cloudwatchClient,ec2Client,rDSClient,elbClient} from '../lib/aws-client.js'
import { GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand} from "@aws-sdk/client-rds";
import { DescribeLoadBalancersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

export async function checkIdleResourceCleanup() {
  const results = [];

  // ----- EC2 CHECK -----
  try {
    const ec2Instances = await ec2Client.send(new DescribeInstancesCommand({}));
    const instanceData = ec2Instances.Reservations.flatMap(r => r.Instances || []);

    if (!instanceData || instanceData.length === 0) {
      results.push({
        resourceType: 'EC2',
        compliant: true,
        resource_exists: false,
        evidence: {},
      });
    }

    else{
      for (const instance of instanceData) {
        const params = {
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "InstanceId", Value: instance.InstanceId }],
          StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          EndTime: new Date(),
          Period: 3600 * 24,
          Statistics: ["Average"],
        };
        const metric = await cloudwatchClient.send(new GetMetricStatisticsCommand(params));
        const avgCPU = metric.Datapoints.reduce((a, b) => a + b.Average, 0) / (metric.Datapoints.length || 1);
        
        results.push({
          resourceId: instance.InstanceId,
          type: "EC2",
          compliant: avgCPU >= 5,
          evidence: {
            averageCPU: avgCPU,
            dataPoints: metric.Datapoints,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error checking EC2:", err.message);
  }

  // ----- RDS CHECK -----
  try {
    const dbs = await rDSClient.send(new DescribeDBInstancesCommand({}));

    if (!dbs || dbs.DBInstances.length === 0) {
      results.push({
        resourceType: 'RDS',
        compliant: true,
        resource_exists: false,
        evidence: {},
      });
    }

    else{
      for (const db of dbs.DBInstances || []) {
        const params = {
          Namespace: "AWS/RDS",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "DBInstanceIdentifier", Value: db.DBInstanceIdentifier }],
          StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          EndTime: new Date(),
          Period: 3600 * 24,
          Statistics: ["Average"],
        };
        const metric = await cloudwatchClient.send(new GetMetricStatisticsCommand(params));
        const avgCPU = metric.Datapoints.reduce((a, b) => a + b.Average, 0) / (metric.Datapoints.length || 1);
        
        results.push({
          resourceId: db.DBInstanceIdentifier,
          type: "RDS",
          compliant: avgCPU >= 5,
          evidence: {
            averageCPU: avgCPU,
            dataPoints: metric.Datapoints,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error checking RDS:", err.message);
  }

  // ----- ELB CHECK -----
  try {
    const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));

    if (!lbs || lbs.LoadBalancers.length === 0) {
      results.push({
        resourceType: 'ALB',
        compliant: true,
        resource_exists: false,
        evidence: {},
      });
    }
    
    else
    for (const lb of lbs.LoadBalancers || []) {
      const params = {
        Namespace: "AWS/ApplicationELB",
        MetricName: "RequestCount",
        Dimensions: [{ Name: "LoadBalancer", Value: lb.LoadBalancerArn.split("/")[1] }],
        StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        EndTime: new Date(),
        Period: 3600 * 24,
        Statistics: ["Sum"],
      };
      const metric = await cloudwatchClient.send(new GetMetricStatisticsCommand(params));
      const totalRequests = metric.Datapoints.reduce((a, b) => a + b.Sum, 0);

      results.push({
        resourceId: lb.LoadBalancerArn,
        type: "ELB",
        compliant: totalRequests > 0,
        evidence: {
          totalRequests,
          dataPoints: metric.Datapoints,
        },
      });
    }
  } catch (err) {
    console.error("Error checking ELBs:", err.message);
  }

  const nonCompliant = results.filter(r => !r.compliant).length;

  return {
    control: "CC3.3",
    description: "Detects underutilized AWS resources for potential cleanup",
    results,
    summary: {
      totalResources: results.length,
      nonCompliant,
    },
    passed: results.every(r => r.compliant),
    resource_exists: results.length > 0,
  };
}
