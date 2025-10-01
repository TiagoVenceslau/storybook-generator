import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageData } from "../../tools/types";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../../constants";
import { createEditLocationImageWorkflow } from "./create-edit-location-image.workflow";
import { Run } from "@mastra/core";
import { ImageApi } from "../../../ImageApi";

export const characterGenerationAndRefinementStep = createStep({
  id: 'character-image-generation-refinement-step',
  description: 'Calls the createCharacterImage workflow',
  inputSchema: z.object({
    project: z.string().describe("The project name (also where files are stored)"),
    style: z.string().describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    imagePath: z.string().optional().describe('the image to edit, if any'),
    name: z.string().describe("The name of the character"),
    pose: z.string().describe("the pose of the character"),
    numImages: z.number().default(1).describe("The number of images to create"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("the image generation model to use"),
    fixThreshold: z.number().max(1).min(0).default(0.90).describe("the threshold for acceptance"),
    regenThreshold: z.number().max(1).min(0).default(0.7).describe("the threshold for acceptance"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
    maxIterations: z.number().default(5).describe("The maximum number of iterations before returning the best result")
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
    model: z.string().describe("the model used"),
    action: z.string().describe("the recommended action"),
    tokensUsed: z.number().describe("the amount of tokens used"),
    score: z.number().describe("the score of the image against it's metrics"),
    iterations: z.number().describe("the amount of iterations required until the generated image passed validation"),
  }),
  execute: async ({ inputData, mastra, runtimeContext, runId }) => {
    const {maxIterations} = inputData;
    let action = "create"
    let iteration = 1;
    const wf = mastra.getWorkflow(createEditLocationImageWorkflow.id)
    let run: Run;
    let fixes: any[] = []
    let image = inputData.imagePath

    let results: any[] = []
    do {
      try {
        run = await wf.createRunAsync({runId: [runId, iteration].join("-")});
      } catch (e: unknown) {
        throw new Error(`Failed to create run: ${e}`)
      }
      try {
        let result = await run.start({
          inputData: {...inputData, action: action, fixes: fixes, imagePath: image}
        })

        if (result.status !== "success")
          throw new Error(`Failed to run workflow: ${result.status}`)

        results.push(result.result);
        action = result.result.action;
        image = result.result.images[0].imageUrl;
        fixes = result.result.fixes;
      } catch (e: unknown) {
        throw new Error(`Failed to run workflow: ${e}`)
      }
      if (action === "proceed")
        break;
      if (action === "fix")
        action = "edit"
      else
        action = "create"
    } while(iteration++ < maxIterations)

    const bestResult = results.sort((a, b) => a.score - b.score)
    console.log(`Best result is ${bestResult[0].score}`)

    const filePath = ImageApi.markFinal(image as string)

    return Object.assign({}, bestResult[0], {
      iterations: iteration
    });
  }
});
