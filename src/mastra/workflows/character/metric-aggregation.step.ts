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
    regenThreshold: z.number().max(1).min(0).default(0.60).describe("threshold to completely redo image"),
    fixThreshold: z.number().max(1).min(0).default(0.95).describe("the threshold to fix image details"),
  }),
  outputSchema: z.object({
    action: z.enum(["proceed", "fix", "redo", "give-up"]).describe("the recommended action"),
    fixes: z.array(ScoreReason).optional().describe("the list of fixes to apply if applicable"),
    reason: z.string().optional().describe("reason for a full regen of image")
  }),
  execute: async ({ inputData }) => {
    const {fixThreshold, regenThreshold, metrics} = inputData;
    let flatMetrics = metrics.map((m) => {
      return Object.entries(m).map(([k, v]) => Object.assign(v, {metric: k}));
    }).flat();
    const forRegen = flatMetrics.filter(m => (m as z.infer<typeof Score>).score < regenThreshold);

    if (forRegen.length) {
      return {action: "redo" as any, reason: forRegen.map(r => (r as z.infer<typeof Score>).reasons).flat().join(".\n")}
    }

    const toFix = flatMetrics.filter(m => (m as z.infer<typeof Score>).score < fixThreshold);
    if (!toFix.length)
      return {action: "proceed" as any}
    return {
      action: "fix" as any,
      fixes: toFix.map(f => (f as z.infer<typeof Score>).reasons).flat() as z.infer<typeof ScoreReason>[]
    }
  }
})
