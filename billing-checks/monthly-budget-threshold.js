import {budgetsClient} from "../lib/aws-client.js"
import { DescribeBudgetCommand } from "@aws-sdk/client-budgets";


export async function checkMonthlyBudgetThreshold() {
  const results = [];

  const budgetName = "monthly-budget";
  const accountId = process.env.AWS_ACCOUNT_ID;

  try {
    const { Budget } = await budgetsClient.send(
      new DescribeBudgetCommand({
        AccountId: accountId,
        BudgetName: budgetName,
      })
    );

    const budgetLimit = Budget?.BudgetLimit?.Amount;
    const actualSpend = Budget?.CalculatedSpend?.ActualSpend?.Amount;

    const numericLimit = parseFloat(budgetLimit);
    const numericSpend = parseFloat(actualSpend);
    const usagePercent = (numericSpend / numericLimit) * 100;

    const isCompliant = usagePercent < 80;

    results.push({
      budgetName,
      compliant: isCompliant,
      evidence: {
        budgetLimit,
        actualSpend,
        usagePercent: usagePercent.toFixed(2) + "%",
      },
      resource_exists: true,
    });

    return {
      control: "SOC2 CC9.1",
      description: "Check if current monthly AWS spend is within budget (under 80%)",
      results,
      summary: {
        totalBudgets: 1,
        nonCompliant: isCompliant ? 0 : 1,
      },
      passed: isCompliant,
    };
  } catch (err) {
    if (err.name === "NotFoundException") {
      results.push({
        budgetName,
        compliant: true,
        resource_exists: false,
        evidence: {
          message: `Budget '${budgetName}' not found.`,
        },
      });

      return {
        control: "SOC2 CC9.1",
        description: "Check if current monthly AWS spend is within budget (under 80%)",
        results,
        summary: {
          totalBudgets: 0,
          nonCompliant: 0,
        },
        passed: true,
      };
    }

    throw err; // Rethrow other unexpected errors
  }
}
