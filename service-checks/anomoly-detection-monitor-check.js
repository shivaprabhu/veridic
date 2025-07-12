import { costExplorerClient as client } from "../lib/aws-client.js";
import { GetAnomalyMonitorsCommand } from "@aws-sdk/client-cost-explorer";


export async function checkAnomalyMonitorExists() {
  const results = [];
  let monitors = [];

  try {
    const res = await client.send(
      new GetAnomalyMonitorsCommand({})
    );
    monitors = res.AnomalyMonitors || [];

    if (monitors.length === 0) {
      return {
        control: "SOC2 CC9.2",
        description: "Verify anomaly detection monitor is set up",
        results: [
          {
            check: "Anomaly Monitors",
            compliant: true,
            resource_enabled: false,
            evidence: "No anomaly monitors found",
          },
        ],
        summary: {
          compliant: 0,
          nonCompliant: 1,
        },
        passed: false,
      };
    }

  } 
  catch (err) {
    console.log("Error fetching anomaly monitors:", err.name, err.message);
    
    return {
      control: "SOC2 CC9.2",
      description: "Verify anomaly detection monitor is set up",
      results: [
        {
          check: "Anomaly Monitors",
          compliant: false,
          evidence: { error: `${err.name} ${err.message}` },
        },
      ],
      summary: {
        compliant: 0,
        nonCompliant: 1,
      },
      passed: false,
    };
  }

  const isCompliant = monitors.length > 0;

  results.push({
    check: "Anomaly Monitors",
    compliant: isCompliant,
    evidence: {
      monitorNames: monitors.map((m) => m.MonitorName),
    },
  });

  return {
    control: "SOC2 CC9.2",
    description: "Verify that at least one Cost Anomaly Monitor is set up",
    results,
    summary: {
      compliant: isCompliant ? 1 : 0,
      nonCompliant: isCompliant ? 0 : 1,
    },
    passed: isCompliant,
  };
}
