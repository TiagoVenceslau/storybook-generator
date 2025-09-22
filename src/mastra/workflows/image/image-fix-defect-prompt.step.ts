import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ScoreReason } from "../../tools/types";
import { ImageFixPromptTool } from "../../tools/image.fix.prompt.tool";

export const ImageFixDefectPromptStep  = createStep({
  id: "image-fix-defect--prompt-step",
  description: "Given a defect and it's bounding box, generates a prompt to fix it",
  inputSchema: z.object({
    score: ScoreReason.describe("the score and the reason behind it"),
  }),
  outputSchema: z.object({
    prompt: z.string().describe("The generated prompt, meant to pass an Image editing LLM or Toll to selectively fixing the image without compromising style or consistency")
  }),
  execute: async ({inputData, mastra, runtimeContext,  runId}) => {

    const {score} = inputData;

    const promptTool = ImageFixPromptTool;
    if (!promptTool.execute)
      throw new Error("tool has no execution method")
    let res: {prompt: string};
    try {
      res = await promptTool.execute({context: {score: score}, mastra: mastra, runtimeContext:  runtimeContext, runId: runId});
    } catch (e: unknown){
      throw new Error(e as any)
    }
    return res
  }
})
