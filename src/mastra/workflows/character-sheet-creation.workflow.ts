import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { characterEnrichmentStep } from "./character/character-enrichment.step";
import { Character } from "./payloads";
import { OpenAIImageFormats, OpenAIImageQuality, OpenAIImageSize } from "../constants";
import { characterGenerationAndRefinementStep } from "./character/character-create-evaluate-edit-evaluate-loop.step";


export const createCharacterSheetWorkflow = createWorkflow({
  id: 'character-generation-workflow',
  description: 'Complete pipeline from character idea and style, including character refinement for failed evals',
  inputSchema: z.object({
    project: z.string().default("miguel").describe("The project name (also where files are stored)"),
    style: z.string().describe('Visual style for image generation'),
    mood: z.string().optional().describe('the overall mood of the image'),
    character: Character.describe("the character details"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    fixThreshold: z.number().max(1).min(0).default(0.90).describe("the threshold for acceptance"),
    regenThreshold: z.number().max(1).min(0).default(0.7).describe("the threshold to require a complete regen"),
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("the file path for the image file")
  }),
  steps: [characterEnrichmentStep],
})
  .map(async ({ inputData }) => {
    return {
      style: inputData.style,
      description: inputData.character.description,
      characteristics: inputData.character.characteristics,
      situational: inputData.character.situational,
      role: inputData.character.role,
      name: inputData.character.name,
    }
  }) // trick to handle the defaults or extra data
  .then(characterEnrichmentStep)
  .map(async ({inputData, getInitData}) => {
    const initData = getInitData();
    return Object.assign({}, initData, inputData, {
      model: "gpt-image-1",
      numImages: 1,
      name: initData.character.name,
      pose: "Full body frontal, neutral pose, neutral expression, natural light"
    })
  })
  .then(characterGenerationAndRefinementStep)
  .map(async ({inputData, getInitData, getStepResult}) => {
    const initData = getInitData();
    const enrichment = getStepResult(characterEnrichmentStep);
    return [
      "full body back view. looking  at sky. neutral expression. natural light.",
      "closeup to face, confident enigmatic expression. natural light.",
    ].map(pose => Object.assign({}, enrichment, initData, {
      pose: pose,
      references: {
        "reference image": inputData.images[0].imageUrl,
      },
      style: initData.style,
      role: initData.character.role,
      name: initData.character.name,
    }))
  }).foreach(characterGenerationAndRefinementStep)
  .commit();