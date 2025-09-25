import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, Score, ScoreReason } from "../../tools/types";
import { characterCreationStep } from "./character-creation.step";
import { characterEvaluationStep } from "./character-evaluation.step";
import { metricAggregationStep } from "./metric-aggregation.step";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../../constants";

export const createEditCharacterImageWorkflow = createWorkflow({
  id: 'character-image-create-edit-workflow',
  description: 'Complete pipeline from description, pose and style, to creation/edit and final evaluation',
  inputSchema: z.object({
    project: z.string().default("miguel").describe("The project name (also where files are stored)"),
    style: z.string().default("dark, moody detective like graphic novel in aggressive strokes and strong colors").describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    name: z.string().describe("The name of the character"),
    pose: z.string().default("Full body frontal, neutral pose, neutral expression, natural light").describe("the pose of the character"),
    numImages: z.number().default(1).describe("The number of images to create"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    description: z.string().default(`
    A tall beautiful blond haired middle aged woman, with a strategically located mole on the right side of her chin,
    blue piecing eyes and a gorgeous smile, whenever she was willing to use it. Slim and elegant figure.
    She is dressed only in a loose white man's dress shirt  and a loose red tie, holding a gun on her right hand. 
    `).describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("the image generation model to use"),
    fixes: z.array(ScoreReason).optional().describe("a list of scores for each fix"),
    fixThreshold: z.number().max(1).min(0).default(0.90).describe("the threshold for acceptance"),
    regenThreshold: z.number().max(1).min(0).default(0.7).describe("the threshold for acceptance"),
    references: z.array(z.string()).optional().describe("a list of reference image paths"),
    action: z.enum(["create", "edit"]).default("create").describe("whether to create or edit the character image"),
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
    model: z.string().describe("the model used")
  }),
  steps: [characterCreationStep, imageEdicharacterEvaluationStep, metricAggregationStep]
}).map(async ({inputData}) => {
  return inputData;
})
  .branch([
  [async ({inputData}) => inputData.action === "create", characterCreationStep],
  [async ({inputData}) => inputData.action === "edit", characterCreationStep]
])
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