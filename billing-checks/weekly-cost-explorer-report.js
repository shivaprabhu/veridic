import { costExplorerClient as client } from "../lib/aws-client.js"; 
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";


export async function checkWeeklyCostExplorerReport() {
  function formatDate(date) {
    return date.toISOString().split("T")[0]; // gets YYYY-MM-DD
  }

  const end = formatDate(new Date()); // today
  const start = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago


  try {
    const { ResultsByTime } = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }]
      })
    );

    const results = ResultsByTime.map(day => {
      return {
        date: day.TimePeriod.Start,
        services: day.Groups.map(group => ({
          service: group.Keys[0],
          amount: parseFloat(group.Metrics.UnblendedCost.Amount)
        }))
      };
    });

    const allServices = new Set();
    let totalSpend = 0;

    results.forEach(day => {
      day.services.forEach(svc => {
        allServices.add(svc.service);
        totalSpend += svc.amount;
      });
    });

    return {
      control: "CC9.2",
      description: "Weekly AWS cost report by service",
      results,
      summary: {
        totalDays: results.length,
        uniqueServices: allServices.size,
        totalSpend: parseFloat(totalSpend.toFixed(2))
      },
      passed: true
    };
  } catch (err) {
    if (err.name === "DataUnavailableException") {
      return {
        control: "CC9.2",
        description: "Weekly AWS cost report by service",
        results: [],
        summary: {
          totalDays: 0,
          uniqueServices: 0,
          totalSpend: 0
        },
        passed: false,
        note: "Cost Explorer data is not yet available. If just enabled, wait up to 24 hours."
      };
    }

    throw err;
  }
}
