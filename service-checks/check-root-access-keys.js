import { iamClient as client } from "../lib/aws-client.js"; 
import { GetAccountSummaryCommand } from "@aws-sdk/client-iam";


export async function checkRootNoAccessKeys() {
  try {
    const { SummaryMap } = await client.send(new GetAccountSummaryCommand({}));

    const hasAccessKeys = SummaryMap?.["AccountAccessKeysPresent"] > 0;

    return {
      control: "CC6.3",
      description: "Root account should not have any active access keys",
      results: [
        {
          user: "root",
          compliant: !hasAccessKeys,
          evidence: {
            AccountAccessKeysPresent: SummaryMap?.["AccountAccessKeysPresent"],
          },
        },
      ],
      summary: {
        totalKeys: SummaryMap?.["AccountAccessKeysPresent"] || 0,
        nonCompliant: hasAccessKeys ? 1 : 0,
      },
      passed: !hasAccessKeys,
    };
  } catch (err) {
    return {
      control: "CC6.3",
      description: "Root account should not have any active access keys",
      results: [
        {
          user: "root",
          compliant: false,
          evidence: {
            error: err.name || "UnknownError",
            message: err.message,
          },
        },
      ],
      summary: {
        totalKeys: 0,
        nonCompliant: 1,
      },
      passed: false,
    };
  }
}
