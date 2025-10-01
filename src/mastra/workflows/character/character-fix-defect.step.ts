import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageData } from "../../tools/types";
import { ImageEditTool } from "../../tools/image.edit.tool";
import {
  OpenAIEditFidelity,
  OpenAIImageBackgrounds,
  OpenAIImageFormats,
  OpenAIImageModels,
  OpenAIImageQuality,
} from "../../constants";
import { CharacterEditTool } from "../../tools/character.edit.tool";

export const CharacterFixDefectStep  = createStep({
  id: "character-fix-defect-step",
  description: "Given a defect and it's bounding box, perform an image edit to fix the defect",
  inputSchema: z.object({
    prompt: z.string().describe("the prompt to use to fix the image"),
    description: z.string().describe("The overall description of the image"),
    characteristics: z.array(z.string()).optional().describe("a list of the character's defining physical characteristics, eg: factial features, hair, scars, body types, height, tattoos, scars, etc, os a scene's main features"),
    situational: z.array(z.string()).optional().describe("a list of situational features (features than may belong to the image in a specific situation, but not always"),
    pose: z.string().optional().describe("the pose of eventual characters in the image"),
    style: z.string().default("Graphic Novel").describe("The art style to apply"),
    mood: z.string().optional().describe("The overall mood to apply to the image"),
    imagePath: z.string().describe("the image file path"),
    maskImage: z.string().describe("the mask image to use"),
    fidelity: z.enum(Object.values(OpenAIEditFidelity) as any).default(OpenAIEditFidelity.high).describe("The fidelity to the original image"),
    model: z.enum(Object.values(OpenAIImageModels) as any).default(OpenAIImageModels.GPT_IMAGE_1).describe("The model to be used to generate the images"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    background: z.enum(Object.values(OpenAIImageBackgrounds) as any).optional().default(OpenAIImageBackgrounds.auto).describe("the image format"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().optional().describe('The pose that was applied'),
  }),
  execute: async ({inputData, mastra, runtimeContext,  runId}) => {
    const {prompt, imagePath, maskImage, model, description, characteristics, situational, pose, style, mood, format, fidelity, references, background, quality} = inputData;
    const editTool = CharacterEditTool;
    let edit: z.infer<typeof editTool.outputSchema>;
    try {
      edit = await editTool.execute({context: {
        prompt: prompt,
        description: description,
        characteristics: characteristics,
        situational: situational,
        pose: pose,
        style: style,
        mood: mood,
        imagePath: imagePath,
        maskImage: maskImage,
        fidelity: fidelity,
        model: model,
        quality: quality,
        format: format,
        background: background,
        references: references,
      }, mastra, runtimeContext, runId})
    } catch (e: unknown) {
      throw new Error(`failed to edit image: ${e}`)
    }

    return edit;
  }
})
