import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, ScoreReason } from "../tools/types";
import { characterEnrichmentStep } from "./character/character-enrichment.step";
import { characterCreationStep } from "./character/character-creation.step";


export const createCharacterSheetWorkflow = createWorkflow({
  id: 'character-generation-workflow',
  description: 'Complete pipeline from character idea and style, including character refinement for failed evals',
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
    pose: z.string().default("full body frontal and provocative").describe("the pose of the character")
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("the file path for the image file")
  }),
  steps: [characterEnrichmentStep],
})
  .map(async ({ inputData }) => (inputData)) // trick to handle the defaults or extra data
  .then(characterEnrichmentStep)
  .map(async ({inputData, getInitData}) => {
    const initData = getInitData();
    return {
      image:  Object.assign({}, inputData, inputData, {
        model: "image-gpt-1",
        numImages: 1
      }),
      dalle: Object.assign({}, initData, inputData, {
        model: "dalle-3",
        numImages: 1
      })
    }
  })
  .parallel([characterCreationStep])
  // .then(characterCreationStep)
  .commit();