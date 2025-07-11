import { rDSClient as client} from "../lib/aws-client.js"
import { DescribeDBInstancesCommand} from "@aws-sdk/client-rds";

export async function checkRDSBackupsEnabled() {
  const results = [];

  const { DBInstances } = await client.send(
    new DescribeDBInstancesCommand({})
  );

  for (const db of DBInstances) {
    try{
      const isCompliant = db.BackupRetentionPeriod > 0;

      results.push({
        dbInstanceIdentifier: db.DBInstanceIdentifier,
        compliant: isCompliant,
        evidence: {
          backupRetentionPeriod: db.BackupRetentionPeriod,
        },
      });
    }
    catch(err){
      console.log('RDS Backups Enabled Check Error:', err.name, err.message);
      results.push({
        dbInstanceIdentifier: db.DBInstanceIdentifier,
        compliant: isCompliant,
        evidence: {
          error: err.message,
        },
    })
  }
}

  return {
    control: "CC10.1",
    description: "Ensures RDS instances have automatic backups enabled",
    results,
    summary: {
      totalDBInstances: results.length,
      nonCompliant: results.filter((r) => !r.compliant).length,
    },
    passed: results.every((r) => r.compliant),
  };
}
