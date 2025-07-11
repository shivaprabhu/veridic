import fs from "fs";
import 'dotenv/config.js';

import { checkMFAEnabled } from './checks/mfa-enabled.js';
import { checkNoConsoleAccess } from './checks/iam-no-console-access.js';
import { checkIAMRoleWildcard } from "./checks/iam-role-wildcard.js";
import { checkCloudTrailAllRegions } from "./checks/cloudtrail-enabled-all-regions.js";
import { checkS3NoPublicBuckets } from "./checks/s3-no-public-buckets.js";
import { checkRDSBackupsEnabled } from "./checks/rds-backups-enabled.js";
import { checkSecurityGroupsOpenPorts } from "./checks/security-groups-open-ports.js";
import { checkGuardDutyEnabled } from "./checks/guardduty-enabled.js";
import { checkRootNoAccessKeys } from "./checks/check-root-access-keys.js";
import { checkEbsEncryptionEnabled } from "./checks/ebs-encryption-enabled.js";
import { checkELBAccessLogs } from "./checks/elb-access-logs.js";
import { checkACMCertNotExpired } from "./checks/acm-cert-not-expired.js";
import { checkEC2NoPublicAMIs } from "./checks/ec2-no-public-ami.js";
import { checkCloudWatchAlarms } from "./checks/cloudwatch-alarms.js";
import { checkInfrastructureViaIac } from "./checks/infra-via-iac.js";

const runAllChecks = async () => {
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
  }
  fs.writeFileSync("output/evidence.json", JSON.stringify(result, null, 2));
};


runAllChecks();
