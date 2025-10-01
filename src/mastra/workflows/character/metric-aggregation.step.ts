import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { Score, ScoreReason } from "../../tools/types";
import { ImageApi } from "../../../ImageApi";

export const metricAggregationStep = createStep({
  id: 'metric-aggregation-step',
  description: "aggregates the metrics and decides what to do with the results",
  inputSchema: z.object({
    metrics: z.array(z.object({
      metric: z.enum(["pose", "character", "style", "location"]).describe("metric used"),
      score: Score,
    })),
    regenThreshold: z.number().max(1).min(0).default(0.60).describe("threshold to completely redo image"),
    fixThreshold: z.number().max(1).min(0).default(0.95).describe("the threshold to fix image details"),
  }),
  outputSchema: z.object({
    action: z.enum(["proceed", "fix", "redo", "give-up"]).describe("the recommended action"),
    fixes: z.array(ScoreReason).optional().describe("the list of fixes to apply if applicable"),
    score: z.number().optional().describe("the overall score"),
    reason: z.string().optional().describe("reason for a full regen of image")
  }),
  execute: async ({ inputData }) => {
    const {fixThreshold, regenThreshold, metrics} = inputData;
    let flatMetrics: {score: number,  reasons?: Record<any, any>}[] = metrics.map((m) => Object.values(m)).flat() as any;

    const avgScore = ImageApi.avgScore(flatMetrics);
    const forRegen = flatMetrics.filter(m => {
      return m.score < regenThreshold
    });

    if (forRegen.length) {
      return {
        action: "redo" as any,
        reason: forRegen.map(r => r.reasons?.map((r: any) => r.reason)).flat().join(".\n"),
        score: avgScore
      }
    }

    const toFix = flatMetrics.filter(m => {
      return m.score < fixThreshold
    });
    if (!toFix.length)
      return {action: "proceed" as any}
    return {
      action: "fix" as any,
      fixes: toFix.map(f => f.reasons).flat() as z.infer<typeof ScoreReason>[],
      score:  avgScore
    }
  }
})
