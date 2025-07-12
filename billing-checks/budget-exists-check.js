import { budgetsClient as client } from "../lib/aws-client.js";
import { DescribeBudgetsCommand } from "@aws-sdk/client-budgets";


export async function checkBudgetExists() {
  const results = [];
  const accountId = process.env.AWS_ACCOUNT_ID;

  let budgets = [];

  try {
    const res = await client.send(
      new DescribeBudgetsCommand({
        AccountId: accountId,
      })
    );
    budgets = res.Budgets || [];
  } catch (err) {
    return {
      control: "SOC2 CC9.1",
      description: "Check if budgets are defined in AWS",
      results: [
        {
          check: "Budget Existence",
          compliant: false,
          evidence: { error: err.message },
        },
      ],
      summary: {
        compliant: 0,
        nonCompliant: 1,
      },
      passed: false,
    };
  }

  const isCompliant = budgets.length > 0;

  results.push({
    check: "Budget Existence",
    compliant: isCompliant,
    evidence: {
      budgets: budgets.map((b) => ({"budgetName":b.BudgetName,"budgetLimit":`${b.BudgetLimit.Units}${b.BudgetLimit.Amount}` })),
    },
  });

  return {
    control: "SOC2 CC9.1",
    description: "Check if predefined budgets exist in AWS",
    results,
    summary: {
      compliant: isCompliant ? 1 : 0,
      nonCompliant: isCompliant ? 0 : 1,
    },
    passed: isCompliant,
  };
}
