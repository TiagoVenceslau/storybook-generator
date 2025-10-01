import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, ScoreReason } from "../../tools/types";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../../constants";
import { ImageFixDefectPromptStep } from "./image-fix-defect-prompt.step";
import { ImageFixMaskImageStep } from "./image-fix-mask-image.step";
import { ImageFixDefectStep } from "./image-fix-defect.step";

export const ImageEditWorkflow = createWorkflow({
  id: 'image-edit-workflow',
  description: 'Image edit workflow, given a defect, tries to correct them via the image edit api',
  inputSchema: z.object({
    project: z.string().default("miguel").describe("The project name (also where files are stored)"),
    imagePath: z.string().describe("The path to the image to edit"),
    style: z.string().describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    name: z.string().describe("The name of the character"),
    pose: z.string().default("Full body frontal, neutral pose, neutral expression, natural light").describe("the pose of the character"),
    numImages: z.number().default(1).describe("The number of images to create"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("the image generation model to use"),
    fix: ScoreReason.describe("the defect to fix"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
    model: z.string().describe("the model used")
  }),
  steps: [ImageFixMaskImageStep, ImageFixDefectPromptStep, ImageFixDefectStep]
}).map(async ({inputData}) => {
  return {
    score: inputData.fix,
    imagePath: inputData.imagePath,
  }
}).map(ImageFixMaskImageStep)
  .map(async ({getInitData}) => {
  return {score: getInitData().fix};
}).then(ImageFixDefectPromptStep)
  .map(async ({inputData, getInitData, getStepResult}) => {
    const {fix, imagePath} = getInitData();
    const {maskPath} = getStepResult("image-fix-mask-image" as any);
    return {
      score: fix,
    }
  }).map(ImageFixDefectStep)
//
  .commit()