import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata } from "../../tools/types";
import { characterCreationStep } from "./character-creation.step";
import { characterEvaluationStep } from "./character-evaluation.step";
import { metricAggregationStep } from "./metric-aggregation.step";

export const createCharacterImageWorkflow = createWorkflow({
  id: 'character-image-generation-workflow',
  description: 'Complete pipeline from description and style, to final evaluation',
  inputSchema: z.object({
    style: z.string().default("dark detective like graphic novel").describe('Visual style for image generation'),
    name: z.string().default("Alice").describe("The name of the character"),
    description: z.string().default(`
    A tall beautiful blond haired middle aged woman, with a strategically located mole on the right side of her chin,
    blue piecing eyes and a gorgeous smile, whenever she was willing to use it. Slim and elegant figure.
    She is dressed only in a white man's shirt 
    `).describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    project: z.string().default("miguel").describe("The project folder"),
    pose: z.string().default("full body frontal and provocative").describe("the pose of the character"),
    model: z.string().describe("the image generation model to use"),
    numImages: z.number().describe("The number of different images to create"),
    currentIteration: z.number().default(1).describe("the current iteration"),
    maxIteration: z.number().default(5).describe("the maximum allowed iterations before giving up"),
    evaluationThreshold: z.number().max(1).min(0).default(0.95).describe("the threshold for acceptance"),
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
    iterations: z.number().describe("The number of iterations performed before achieving the result"),
    model: z.string().describe("the model used")
  }),
  steps: [characterCreationStep, characterEvaluationStep, metricAggregationStep]
}).map(async ({inputData}) => {
  return inputData;
}).then(characterCreationStep)
  .map(async ({inputData, getInitData})  => {
    const {evaluationThreshold} = getInitData()
    return {
      character: Object.assign({}, inputData,  {
        metric: "character",
        threshold: evaluationThreshold
      }),
      style: Object.assign({}, inputData, {
        metric: "style",
        threshold: evaluationThreshold
      }),
      pose: Object.assign({}, inputData, {
        metric: "pose",
        threshold: evaluationThreshold
      })
    }
  })
  .parallel([characterEvaluationStep, characterEvaluationStep, characterEvaluationStep])
  .map(async ({inputData, getInitData}) => {
    const initData = getInitData();
    const {threshold} = initData;
    return {
      metrics: inputData,
      currentIteration: 1,
      maxIterations: 5,
      regenThreshold: threshold - Math.floor((threshold - 50)/2),
      fixThreshold: threshold
    }
  })
  .then(metricAggregationStep)
  .map(async ({getInitData, inputData, getStepResult}) => {
    const input = getInitData()
    let creationStep: any;
    try {
      creationStep = getStepResult("create-character-image" as any)
    } catch (e: unknown) {
      throw new Error(`Failed to retrieve results from character image creation step`, e as Error);
    }
    return Object.assign({}, inputData, creationStep, {
      iterations: input.currentIteration,
      model: input.model
    })
  })
  .commit()