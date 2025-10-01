import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageData, ImageMetadata } from "../../tools/types";
import { characterImageGenerationTool } from "../../tools/character.creation.tool";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../../constants";

export const locationCreationStep = createStep({
  id: 'create-location-image',
  description: 'generate a location image based on the description',
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored)"),
    model: z.enum(Object.values(OpenAIImageModels) as any).describe("the image model to be used"),
    style: z.string().default("Graphical Novel").describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    name: z.string().describe("The name of the location"),
    description: z.string().describe("A description of the location"),
    characteristics: z.array(z.string()).describe("a list of defining characteristics"),
    situational: z.array(z.string()).describe("a list of situational characteristics"),
    numImages: z.number().default(1).describe("The number of images to create"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
  }),
  execute: async ({ inputData, mastra, runtimeContext }) => {
    const {style, name, project, mood, model, situational, description, characteristics} = inputData;

    const charCreationTool = characterImageGenerationTool;
    let result: any;

    try {

      result = await charCreationTool.execute({context: {
        project: project,
        model: model,
        name: name,
        description: description,
        characteristics: characteristics,
        situational: situational,
        style: style,
        mood: mood,
        numImages: 1,
        size: OpenAIImageSize.x1024x1536,
        quality: OpenAIImageQuality.low,
        format: OpenAIImageFormats.jpeg
      }, mastra, runtimeContext: runtimeContext});
    } catch (e: unknown) {
      throw new Error(`Failed to get response from Character  Creation tool: ${e}`)
    }

    return result;
  }
})
