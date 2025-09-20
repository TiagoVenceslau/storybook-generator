import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { Score, ScoreReason } from "../../tools/types";

export const metricAggregationStep = createStep({
  id: 'metric-aggregation-step',
  description: "aggregates the metrics and decides what to do with the results",
  inputSchema: z.object({
    metrics: z.array(z.object({
      metric: z.enum(["pose", "character", "style"]).describe("metric used"),
      score: Score,
    })),
    currentIteration: z.number().default(1).describe("the current iteration"),
    maxIterations: z.number().default(5).describe("the maximum cumulative number of iterations for regens or fixes"),
    regenThreshold: z.number().max(1).min(0).default(0.60).describe("threshold to completely redo image"),
    fixThreshold: z.number().max(1).min(0).default(0.95).describe("the threshold to fix image details"),
  }),
  outputSchema: z.object({
    action: z.enum(["proceed", "fix", "redo", "give-up"]).describe("the recommended action"),
    fixes: z.array(ScoreReason).optional().describe("the list of fixes to apply if applicable"),
    reason: z.string().optional().describe("reason for a full regen of image")
  }),
  execute: async ({ inputData }) => {
    const {fixThreshold, regenThreshold, currentIteration, maxIterations, metrics} = inputData;
    const forRegen = metrics.filter(m => m.score.score < regenThreshold);

    if (forRegen.length) {
      if (currentIteration > maxIterations)
        return {action: "give-up" as any}
      return {action: "redo" as any, reason: forRegen.map(r => r.score.reasons).flat().join(".\n")}
    }

    const toFix = metrics.filter(m => m.score.score < fixThreshold);
    if (!toFix.length)
      return {action: "proceed" as any}
    return {
      action: "fix" as any,
      fixes: toFix.map(f => f.score.reasons).flat() as z.infer<typeof ScoreReason>[]
    }
  }
})
