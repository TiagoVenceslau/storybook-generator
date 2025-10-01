import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageData, ImageMetadata, Score, ScoreReason } from "../../tools/types";
import { locationCreationStep } from "./location-creation.step";
import { locationEvaluationStep } from "./location-evaluation.step";
import { metricAggregationStep } from "../character/metric-aggregation.step";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../../constants";
import { LocationEditWorkflow } from "./location-edit.workflow";

export const createEditLocationImageWorkflow = createWorkflow({
  id: 'character-image-create-edit-workflow',
  description: 'Complete pipeline from description, pose and style, to creation/edit and final evaluation',
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored)"),
    style: z.string().describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    imagePath: z.string().optional().describe('the image to edit, if any'),
    name: z.string().describe("The name of the location"),
    numImages: z.number().default(1).describe("The number of images to create"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    description: z.string().describe("A description of the location"),
    characteristics: z.array(z.string()).optional().describe("a list of defining  characteristics"),
    situational: z.array(z.string()).optional().describe("a list of situational characteristics"),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("the image generation model to use"),
    fixes: z.array(ScoreReason).optional().describe("a list of scores for each fix"),
    fixThreshold: z.number().max(1).min(0).default(0.90).describe("the threshold for acceptance"),
    regenThreshold: z.number().max(1).min(0).default(0.7).describe("the threshold to require a complete regen"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths with or without description"),
    action: z.enum(["create", "edit"]).default("create").describe("whether to create or edit the character image"),
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    model: z.string().describe("the model used"),
    action: z.string().describe("the recommended action"),
    tokensUsed: z.number().describe("the amount of tokens used"),
    score: z.number().describe("the score of the image against it's metrics"),
    fixes: z.array(ScoreReason).optional().describe("a list of scores for each fix"),
  }),
  steps: [locationCreationStep, metricAggregationStep]
}).map(async ({inputData}) => {
  return inputData;
})
  .branch([
  [async ({inputData}) => inputData.action === "create", locationCreationStep],
  [async ({inputData}) => inputData.action === "edit", LocationEditWorkflow]
])
  .map(async ({inputData, getInitData})  => {
    const {evaluationThreshold, project, description, pose, style, mood, references, characteristics, situational} = getInitData()
    const data = Object.assign({}, inputData[locationCreationStep.id] ||  inputData[LocationEditWorkflow.id])

    return ["location"].map(metric => ({
      project: project,
      metric: metric,
      imageUrl: (data.images[0] as any).imageUrl,
      description: description,
      characteristics: characteristics,
      situational: situational,
      style: style,
      mood: mood,
      references: references,
      threshold: evaluationThreshold
    }))
  })
  .foreach(locationEvaluationStep, {concurrency: 5})
  .map(async ({inputData, getInitData}) => {
    const initData = getInitData();
    const {regenThreshold, fixThreshold} = initData;
    const metrics = inputData.map(input => Object.entries(input).reduce((acc: Record<string, any>, [key, val])  => {
      if (key === "metric")
        return acc;
      acc[key] = val;
      return acc;
    }, {})).flat();
    return {
      metrics: metrics,
      currentIteration: 1,
      maxIterations: 5,
      regenThreshold: regenThreshold,
      fixThreshold: fixThreshold,
    }
  })
  .then(metricAggregationStep)
  .map(async ({getInitData, inputData, getStepResult}) => {
    const input = getInitData()
    let creationStep: any;
    let editStep: any;
    try {
      creationStep = getStepResult(locationCreationStep)
    } catch (e: unknown) {
      throw new Error(`Failed to retrieve results from character image creation step`, e as Error);
    }
    try {
      editStep = getStepResult(LocationEditWorkflow)
    } catch (e: unknown) {
      throw new Error(`Failed to retrieve results from image edit step`, e as Error);
    }

    const result = Object.assign({}, inputData, creationStep || {}, editStep|| {}, {
      iterations: input.currentIteration,
      model: input.model
    })

    return result;
  })
  .commit()