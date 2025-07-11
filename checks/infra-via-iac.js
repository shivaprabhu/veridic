import { cloudFormationClient as client } from "../lib/aws-client.js";
import {
  ListStacksCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

export async function checkInfrastructureViaIac() {
  let stacks = [];

  try {
    const response = await client.send(new ListStacksCommand({}));
    const stackSummaries = response.StackSummaries || [];

    stacks = stackSummaries.filter(
      (stack) => stack.StackStatus !== "DELETE_COMPLETE"
    );

    const detailedStacks = await Promise.all(
      stacks.map(async (s) => {
        try {
          const desc = await client.send(
            new DescribeStacksCommand({ StackName: s.StackName })
          );
          return desc.Stacks?.[0] || null;
        } catch {
          return null;
        }
      })
    );

    const validStacks = detailedStacks.filter(Boolean);

    const results = validStacks.map((stack) => ({
      stackName: stack.StackName,
      compliant: true,
      evidence: {
        status: stack.StackStatus,
        creationTime: stack.CreationTime,
        tags: stack.Tags,
      },
    }));

    return {
      control: "CC8.1",
      description: "Infrastructure should be deployed via Infrastructure-as-Code (e.g., CloudFormation or Terraform).",
      results,
      summary: {
        totalStacks: validStacks.length,
        nonCompliant: validStacks.length === 0 ? 1 : 0,
      },
      passed: validStacks.length > 0,
      note:
        validStacks.length === 0
          ? "No CloudFormation stacks found in the current region. Terraform usage not detected."
          : undefined,
    };
  } catch (err) {
    return {
      control: "CC8.1",
      description: "Infrastructure should be deployed via Infrastructure-as-Code (e.g., CloudFormation or Terraform).",
      results: [],
      summary: {
        totalStacks: 0,
        nonCompliant: 1,
      },
      passed: false,
      note: `Error retrieving CloudFormation stacks: ${err.name} — ${err.message}`,
    };
  }
}
