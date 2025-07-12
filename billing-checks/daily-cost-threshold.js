import { costExplorerClient as client } from "../lib/aws-client.js"; 
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

const DAILY_BUDGET = parseFloat(process.env.DAILY_COST_THRESHOLD || "10");


export async function checkDailyCostThreshold() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const start = yesterday.toISOString().split("T")[0];
  const end = today.toISOString().split("T")[0];

  try {
    const data = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      })
    );

    const amount = parseFloat(
      data.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || "0"
    );

    const isCompliant = amount <= DAILY_BUDGET;

    return {
      control: "COST-1",
      description: `Ensure daily AWS cost is below $${DAILY_BUDGET.toFixed(2)}`,
      results: [
        {
          date: start,
          compliant: isCompliant,
          evidence: { actualSpendUSD: amount.toFixed(2) },
        },
      ],
      summary: {
        thresholdUSD: DAILY_BUDGET,
        actualSpendUSD: amount,
      },
      passed: isCompliant,
    };
  } catch (err) {
    console.log(`Error fetching daily cost:`,err.name, err.message);
    if (err.name === "DataUnavailableException"){
      return {
        control: "COST-1",
        description: `Ensure daily AWS cost is below $${DAILY_BUDGET.toFixed(2)}`,
        results: [],
        summary: {
          note: "Cost Explorer data not yet available. This is expected if the service was just enabled.",
          ingestionStatus: "pending",
        },
        passed: false,
      };  
    }
    else{
      return {
        control: "COST-1",
        description: `Ensure daily AWS cost is below $${DAILY_BUDGET.toFixed(2)}`,
        results: [],
        summary: {
          error: err.message,
        },
        passed: false,
      };
    }
  }
}
