import { z } from "zod";


export const BBox = z.object({
  x: z.number().describe("leftmost x coordinate of the bounding box in pixels"),
  y: z.number().describe("upmost y coordinate of the bounding box in pixels"),
  h: z.number().describe("the height of the bounding box in pixels"),
  w: z.number().describe("the width of the bounding box in pixels"),
})

export const ScoreReason = z.object({
  reason: z.string().describe("a specific reason for a lower score"),
  bbox: BBox.describe("the bounding for for the defect")
})

export const Score = z.object({
  score: z.number().min(0).max(1).describe("the global score. 1 is better than 0"),
  reasons: z.array(ScoreReason).optional().describe("The list of reasons for a score lower than 1")
}).describe("The aggregated results for a defined metric and the reasons and bounding boxes for unperfect scores");

export const ImageMetadata = z.object({
  generationTime: z.number().describe('Time taken to generate in milliseconds'),
  model: z.string().describe('AI model used for generation'),
  quality: z.string().describe('Quality setting used'),
  aspectRatio: z.string().optional().describe('Aspect ratio used'),
  tokensUsed: z.number().describe('the number of tokens used by the model')
})

export const ImageData = z.object({
  imageUrl: z.string().describe('Local file path of the generated image'),
  prompt: z.string().describe('The final prompt used for generation'),
  style: z.string().describe('The style that was applied'),
  metadata: ImageMetadata.optional(),
})

export const CharacterVisualDefinition = z.object({
  description: z.string().describe("A physical description of the character"),
  characteristics: z.array(z.string()).describe("a list of defining physical characteristics"),
  situational: z.array(z.string()).describe("a list of situational physical characteristics"),
})

export const StyledCharacterDefinition = z.intersection(CharacterVisualDefinition, z.object({
  style: z.string().default("Graphical Novel").describe('Visual style for image generation'),
  mood: z.string().optional().describe('the overall mood of the image'),
  name: z.string().describe("The name of the character"),
  pose: z.string().default("Full body frontal, neutral pose").describe("the pose of the character"),
}))
