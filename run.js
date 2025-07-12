import fs from "fs";
import 'dotenv/config.js';

import { checkMFAEnabled } from './service-checks/mfa-enabled.js';
import { checkNoConsoleAccess } from './service-checks/iam-no-console-access.js';
import { checkIAMRoleWildcard } from "./service-checks/iam-role-wildcard.js";
import { checkCloudTrailAllRegions } from "./service-checks/cloudtrail-enabled-all-regions.js";
import { checkS3NoPublicBuckets } from "./service-checks/s3-no-public-buckets.js";
import { checkRDSBackupsEnabled } from "./service-checks/rds-backups-enabled.js";
import { checkSecurityGroupsOpenPorts } from "./service-checks/security-groups-open-ports.js";
import { checkGuardDutyEnabled } from "./service-checks/guardduty-enabled.js";
import { checkRootNoAccessKeys } from "./service-checks/check-root-access-keys.js";
import { checkEbsEncryptionEnabled } from "./service-checks/ebs-encryption-enabled.js";
import { checkELBAccessLogs } from "./service-checks/elb-access-logs.js";
import { checkACMCertNotExpired } from "./service-checks/acm-cert-not-expired.js";
import { checkEC2NoPublicAMIs } from "./service-checks/ec2-no-public-ami.js";
import { checkCloudWatchAlarms } from "./service-checks/cloudwatch-alarms.js";
import { checkInfrastructureViaIac } from "./service-checks/infra-via-iac.js";
import { checkAnomalyMonitorExists } from "./service-checks/anomoly-detection-monitor-check.js";

import { checkDailyCostThreshold } from './billing-checks/daily-cost-threshold.js';
import { checkWeeklyCostExplorerReport } from './billing-checks/weekly-cost-explorer-report.js';
import { checkTagCompliance } from "./billing-checks/tag-compliance.js";
import { checkIdleResourceCleanup } from "./billing-checks/check-idle-resource-cleanup.js";
import { checkReservedInstanceRecommendation } from "./billing-checks/reserve-instance-purchase-recommendation.js";
import { checkMonthlyBudgetThreshold } from "./billing-checks/monthly-budget-threshold.js";
import { checkCostExplorerEnabled } from "./billing-checks/cost-explorer-enabled.js";
import { checkBudgetExists } from "./billing-checks/budget-exists-check.js";

const runServiceChecks = async () => {
  const iamMfaEnabled = await checkMFAEnabled();
  const iamNoConsoleAccess = await checkNoConsoleAccess();
  const iamRoleWildcard = await checkIAMRoleWildcard();
  const cloudTrailEnabled = await checkCloudTrailAllRegions();
  const s3NoPublicBuckets = await checkS3NoPublicBuckets();
  const rdsBackupsEnabled = await checkRDSBackupsEnabled();
  const securityGroupsOpenPorts = await checkSecurityGroupsOpenPorts();
  const guardDutyEnabled = await checkGuardDutyEnabled();
  const rootAccessKeys = await checkRootNoAccessKeys();
  const ebsEncryptionEnabled = await checkEbsEncryptionEnabled();
  const elbAccessLogs = await checkELBAccessLogs();
  const acmCertNotExpired = await checkACMCertNotExpired();
  const ec2NoPublicAMIs = await checkEC2NoPublicAMIs();
  const cloudWatchAlarms = await checkCloudWatchAlarms();
  const infraViaIac = await checkInfrastructureViaIac();
  const anomolyDetectionMonitor = await checkAnomalyMonitorExists();

  const result = {
    "iam-mfa-enabled":iamMfaEnabled,
    "iam-no-console-access": iamNoConsoleAccess,
    "iam-role-wildcard": iamRoleWildcard,
    "cloudtrail-enabled-all-regions": cloudTrailEnabled,
    "s3-no-public-buckets": s3NoPublicBuckets,
    "rds-backups-enabled": rdsBackupsEnabled,
    "security-groups-open-ports": securityGroupsOpenPorts,
    "guardduty-enabled": guardDutyEnabled,
    "root-no-access-keys": rootAccessKeys,
    "ebs-encryption-enabled": ebsEncryptionEnabled,
    "elb-access-logs": elbAccessLogs,
    "acm-cert-not-expired": acmCertNotExpired,
    "ec2-no-public-ami": ec2NoPublicAMIs,
    "cloudwatch-alarms": cloudWatchAlarms,
    "infra-via-iac": infraViaIac,
    "anomoly-detection-monitor": anomolyDetectionMonitor,
  }
  fs.writeFileSync("output/service-evidence.json", JSON.stringify(result, null, 2));
};

const runBillingChecks = async () => {

  const dailyCostThreshold = await checkDailyCostThreshold();
  const weeklyCostExplorerReport = await checkWeeklyCostExplorerReport();
  const tagCompliance = await checkTagCompliance();
  const idleResourceCleanup = await checkIdleResourceCleanup();
  const reservedInstanceRecommendation = await checkReservedInstanceRecommendation();
  const monthlyBudgetThresholds = await checkMonthlyBudgetThreshold();
  const costExplorerEnabled = await checkCostExplorerEnabled();
  const budgetExists = await checkBudgetExists();

  const result = {
    "billing-daily-cost-threshold": dailyCostThreshold,
    "billing-weekly-cost-explorer-report": weeklyCostExplorerReport,
    "billing-tag-compliance": tagCompliance,
    "billing-idle-resource-cleanup":idleResourceCleanup,
    "billing-reserve-instance-purchase-recommendation":reservedInstanceRecommendation,
    "billing-budgets-client": monthlyBudgetThresholds,
    "billing-cost-explorer-enabled": costExplorerEnabled,
    "billing-budget-exists": budgetExists,
  }
  
  fs.writeFileSync("output/billing-evidence.json", JSON.stringify(result, null, 2));
};

const runAlllChecks = async () =>{
  await runServiceChecks();
  await runBillingChecks();
  console.log("All checks completed. Evidence files generated in the output directory.");
}

runAlllChecks().catch((err) => {
  console.error("Error running checks:", err);
  process.exit(1);
});