import { GenerateTextResult, Tool } from "@mastra/core";
import { z } from "zod";
import { ScoreReason } from "./types";

export const ImageFixPromptTool = new Tool({
  id: 'image-edit-prompt-tool',
  description: "Given a single defect, creates a prompt to pass an Image LLM to selectively fix it",
  inputSchema: z.object({
    score: ScoreReason.describe("the score and the reason behind it")
  }),
  outputSchema: z.object({
    prompt: z.string().describe("The generated prompt, meant to pass an Image editing LLM or Toll to selectively fixing the image without compromising style or consistency")
  }),
  execute: async ({ context, mastra }) => {
    const {score} = context;
    if (!mastra)
      throw new Error(`mastra not found in tool`)
    const agent = mastra.getAgent("imageFixPromptAgent");
    let result: GenerateTextResult<any>;
    try {
      result = await agent.generate(`## defect: ${score.reason}`)
    } catch (e: unknown) {
      throw new Error(`failed to receive response from imageFixPromptAgent: ${e}`)
    }

    const {usage, text} = result;

    return {
      prompt: text
    }
  }
})