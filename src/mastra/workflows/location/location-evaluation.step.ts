import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { Score } from "../../tools/types";
import { Tool } from "@mastra/core";
import { FileApi } from "../../../FileApi";
import fs from "fs";
import { LocationConsistencyScorer } from "../../tools/scoring.location.consistency.tool";

export const locationEvaluationStep = createStep({
  id: 'location-evaluation-step',
  description: "evaluate the location image against it's description, features and references",
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored"),
    metric: z.enum(["location"]).describe("metric to be used"),
    imageUrl: z.string().describe('image path'),
    description: z.string().describe("A description of the location"),
    characteristics: z.array(z.string()).describe("a list of defining characteristics"),
    situational: z.array(z.string()).describe("a list of situational characteristics"),
    style: z.string().describe('The style that was applied'),
    mood: z.string().optional().describe('the overall mood of the image'),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
    threshold: z.number().min(0).max(1).default(0.95).describe("the minimum required score on all categories to be allowed to proceed")
  }),
  outputSchema: z.object({
    metric: z.enum(["location"]).describe("metric used"),
    score: Score
  }),
  execute: async ({ inputData, mastra, runtimeContext }) => {

    const {metric, imageUrl } = inputData;

    let buffer: Buffer;
    try  {
      buffer = fs.readFileSync(imageUrl);
    } catch (e: unknown) {
      throw new Error(`Could not read file ${imageUrl}`);
    }

    const format = FileApi.extension(imageUrl);

    let tool: Tool<any, any, any>;
    switch (metric) {
      case "location":
        tool = LocationConsistencyScorer;
        break;
      default:
        throw new Error(`Invalid metric: ${metric}`);
    }
    if (!tool.execute)
      throw new Error(`The tool's execute function is not defined. should be impossible`);
    let result: any;
    try {
      result = await tool.execute({
        context: Object.assign({}, inputData, {
          format: format,
          image: buffer,
        }),
        mastra: mastra,
        runtimeContext: runtimeContext
      });
    } catch (e: unknown) {
      throw new Error(`failed calling the evaluation tool`, e as Error)
    }

    return {...result, metric};
  }
})
