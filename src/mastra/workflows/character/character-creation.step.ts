import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata } from "../../tools/types";
import { characterImageGenerationTool } from "../../tools/character.creation.tool";
import { RuntimeContext } from "@mastra/core/runtime-context";

export const characterCreationStep = createStep({
  id: 'create-character-image',
  description: 'generate a character image based on the description',
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored"),
    model: z.enum(["dalle-3", "gpt-image-1"]).describe("the image model to be used"),
    style: z.string().default("Graphical Novel").describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    name: z.string().describe("The name of the character"),
    pose: z.string().default("Full body frontal, neutral pose").describe("the pose of the character"),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).describe("a list of situational physical characteristics"),
    numImages: z.number().default(1).describe("The number of images to create")
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
  }),
  execute: async ({ inputData, mastra }) => {
    const {style, name, project, pose, mood, model, situational, description, characteristics} = inputData;

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
        pose: pose,
        style: style,
        mood: mood,
        aspectRatio: "4:3",
        numImages: 1
      }, mastra, runtimeContext: new RuntimeContext()});
    } catch (e: unknown) {
      throw new Error(`Failed to get response from Character  Creation tool: ${e}`)
    }

    return result;
  }
})
