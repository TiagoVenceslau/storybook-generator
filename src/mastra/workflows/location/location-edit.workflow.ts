import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, ScoreReason } from "../../tools/types";
import {
  OpenAIEditFidelity,
  OpenAIImageFormats,
  OpenAIImageModels,
  OpenAIImageQuality,
  OpenAIImageSize,
} from "../../constants";
import { ImageFixDefectPromptStep } from "../image/image-fix-defect-prompt.step";
import { ImageFixMaskImageStep } from "../image/image-fix-mask-image.step";
import { ImageApi } from "../../../ImageApi";
import { ImageFixDefectStep } from "../image/image-fix-defect.step";
import { LocationFixDefectStep } from "./location-fix-defect.step";

export const LocationEditWorkflow = createWorkflow({
  id: 'character-edit-workflow',
  description: 'Image edit workflow, given a list of defect, tries to correct them via the image edit api',
  inputSchema: z.object({
    project: z.string().default("miguel").describe("The project name (also where files are stored)"),
    style: z.string().describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    pose: z.string().describe("the pose of the character"),
    imagePath: z.string().describe("The path to the image to edit"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("the image generation model to use"),
    fixes: z.array(ScoreReason).describe("a list of scores for each fix"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
    model: z.string().describe("the model used")
  }),
  steps: [ImageFixDefectPromptStep, ImageFixMaskImageStep, LocationFixDefectStep]
}).map(async ({inputData}) => {
  const {fixes} = inputData;
  return fixes.map(s => {
    return {
      score: s
    }
  })
}, {id: "map-to-scores"})
  .foreach(ImageFixDefectPromptStep, {concurrency: 5})
  .map(async ({inputData, getInitData, getStepResult}) => {
    const {fixes, imagePath} = getInitData();

    return {
      score: {
        bbox: fixes.length > 1 ? ImageApi.addMask(fixes[0].bbox, fixes[1].bbox, ...fixes.slice(2).map((f: any) => f.bbox)) : fixes[0].bbox,
      },
      imagePath: imagePath
    }
  }, {id: "sum-masks-for-masking"})
  .then(ImageFixMaskImageStep)
  .map(async ({getInitData, inputData, getStepResult}) => {
    const initData = getInitData();
    const prompts = (getStepResult(ImageFixDefectPromptStep) as unknown as any[]).map((prompt: any) => prompt.prompt).join(" and ");

    // @ts-ignore
    const lowestScore = initData.fixes.reduce((acc: number, fix: any) => Math.floor(acc, fix.score), 1)
    return {
      prompt: prompts,
      description: initData.description,
      characteristics: initData.characteristics,
      situational: initData.situational,
      pose: initData.pose,
      style: initData.style,
      mood: initData.mood,
      imagePath: initData.imagePath,
      maskImage: inputData.maskPath,
      fidelity: lowestScore < 0.65 ? OpenAIEditFidelity.low : OpenAIEditFidelity.high,
      model: initData.model,
      quality: initData.quality,
      format: initData.format,
      background: initData.background,
      references: initData.references,
    }
  }, {id: "map-for-editing"})
  .then(LocationFixDefectStep)
  .commit()