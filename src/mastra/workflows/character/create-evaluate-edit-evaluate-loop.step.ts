import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, ScoreReason } from "../../tools/types";

export const characterGenerationAndRefinementStep = createStep({
  id: 'character-image-generation-refinement-step',
  description: 'Calls the createCharacterImage workflow',
  inputSchema: z.object({
    style: z.string().describe('Visual style for image generation'),
    name: z.string().describe("The name of the character"),
    description: z.string().describe("A physical description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    situational: z.array(z.string()).optional().describe("a list of defining physical characteristics"),
    project: z.string().describe("The project folder"),
    pose: z.string().describe("the pose of the character"),
    model: z.string().describe("the image generation model to use"),
    numImages: z.number().describe("The number of different images to create"),
    currentIteration: z.number().default(1).describe("the current iteration"),
    maxIteration: z.number().default(5).describe("the maximum allowed iterations before giving up"),
    evaluationThreshold: z.number().max(1).min(0).default(0.95).describe("the threshold for acceptance"),
  }),
  outputSchema: z.object({
    images: z.array(ImageMetadata).describe("the final images as requested"),
    iterations: z.number().describe("the number of iterations before arriving at the image")
  }),
  execute: async ({ inputData, mastra }) => {
    const characterGeneration = mastra.getWorkflow("createCharacterImageWorkflow");

    let result: {
      images: z.infer<typeof ImageMetadata>[],
      totalImages: number,
      style: string,
      pose: string,
      iterations: number,
      model: string,
      action: "proceed" | "give-up" | "redo" | "fix",
      fixes?: z.infer<typeof ScoreReason>[],
      reason?: string
    };

    try {
      const run = await characterGeneration.createRunAsync();
      result = await run.start({
        inputData: inputData
      }) as any
    } catch (e: unknown){
      throw new Error(`Failed to run workflow character-image-generation-workflow`, e as Error)
    }

    const {action, iterations, fixes, reason, images} = result;

    switch (action){
      case "proceed":
        console.log(`Image evaluated as above the threshold on all levels`)
        return {
          images: images,
          iterations: iterations
        };
      case "fix":
        if (!fixes || fixes.length)
          throw new Error(`Image needs fixing but no fixes were supplied`)
        console.log(`Image needs fixing:\n${fixes?.map(f => f.reason).join("\n")}`);
        let result :any;
        try {
          const fixWorkflow = mastra.getWorkflow("fix-image-workflow");
          const r = await fixWorkflow.createRunAsync();
          result = await r.start({});
        } catch(e: unknown) {

        }
      case "give-up":
        throw new Error("Could not achieve an acceptable result in the allowed iterations")
      case "redo":
    }
  }
});
