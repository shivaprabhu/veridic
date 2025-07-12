import { costExplorerClient as client } from "../lib/aws-client.js";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";


export async function checkCostExplorerEnabled() {
  const results = [];
  let isEnabled = false;

  try {
     await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: "2024-01-01",
          End: "2024-01-02",
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      })
    );
        
    isEnabled = true;
  } catch (err) {
    console.log("Error checking Cost Explorer:", err.name, err.message);
    
    if (err.name === "DataUnavailableException") {
      isEnabled = false;
    } else if (err.name === "ValidationException") {
      isEnabled = false;
      results.push({
        check: "Cost Explorer Enabled",
        compliant: isEnabled,
        evidence: {
          attemptedQuery: "UnblendedCost for 2024-01-01",
          error: isEnabled ? null : `${err.message}`,
        },
      });
      return
    }
    else{
      throw err;
    }
  }

  results.push({
    check: "Cost Explorer Enabled",
    compliant: isEnabled,
    evidence: {
      attemptedQuery: "UnblendedCost for 2024-01-01",
      error: isEnabled ? null : "Cost Explorer not enabled",
    },
  });

  return {
    control: "SOC2 CC4.1",
    description: "Check if AWS Cost Explorer is enabled",
    results,
    summary: {
      compliant: isEnabled ? 1 : 0,
      nonCompliant: isEnabled ? 0 : 1,
    },
    passed: isEnabled,
  };
}
