import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { Score } from "../../tools/types";
import { Tool } from "@mastra/core";
import { CharacterConsistencyScorer } from "../../tools/scoring.character.consistency.tool";
import { StyleConsistencyScorer } from "../../tools/scoring.style.consistency.tool";
import { PoseConsistencyScorer } from "../../tools/scoring.pose.consistency.tool";

export const characterEvaluationStep = createStep({
  id: 'character-evaluation-step',
  description: "evaluate the character image against it's description, features and references",
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored"),
    metric: z.enum(["pose", "character", "style"]).describe("metric to be used"),
    imageUrl: z.string().describe('image path'),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).describe("a list of situational physical characteristics"),
    pose: z.string().describe("the pose of the character"),
    style: z.string().describe('The style that was applied'),
    mood: z.string().optional().describe('the overall mood of the image'),
    references: z.array(z.string()).optional().describe("a list of reference image paths"),
    threshold: z.number().min(0).max(1).default(0.95).describe("the minimum required score on all categories to be allowed to proceed")
  }),
  outputSchema: z.object({
    metric: z.enum(["pose", "character", "style"]).describe("metric used"),
    score: Score
  }),
  execute: async ({ inputData }) => {

    const {metric, style, threshold, imageUrl, references} = inputData;

    let tool: Tool<any, any, any>;
    let input: any = {
      threshold: threshold,
      style: style,
      image: imageUrl,
      references: references
    };
    switch (metric) {
      case "character":
        tool = CharacterConsistencyScorer;
        break;
      case "style":
        tool = StyleConsistencyScorer;
        break;
      case "pose":
        tool = PoseConsistencyScorer;
        break;
      default:
        throw new Error(`Invalid metric: ${metric}`);
    }
    if (!tool.execute)
      throw new Error(`The tool's execute function is not defined. should be impossible`);
    let result: any;
    try {
      result = await tool.execute(input);
    } catch (e: unknown) {
      throw new Error(`failed calling the evaluation tool`, e as Error)
    }

    return {...result, metric};
  }
})
