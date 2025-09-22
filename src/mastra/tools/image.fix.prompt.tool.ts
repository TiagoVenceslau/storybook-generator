import { GenerateTextResult } from "@mastra/core";
import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { ScoreReason } from "./types";
import { ImageFixPromptAgent } from "../agents/image.fix.prompt.agent";

export const ImageFixPromptTool = new Tool({
  id: 'image-edit-prompt-tool',
  description: "Given a single defect, creates a prompt to pass an Image LLM to selectively fix it",
  inputSchema: z.object({
    score: ScoreReason.describe("the score and the reason behind it")
  }),
  outputSchema: z.object({
    prompt: z.string().describe("The generated prompt, meant to pass an Image editing LLM or Toll to selectively fixing the image without compromising style or consistency")
  }),
  execute: async ({ context, mastra, runtimeContext, runId }) => {
    const {score} = context;
    const agent = ImageFixPromptAgent
    let result: GenerateTextResult<any>;
    try {
      result = await agent.generate(`## defect: ${score.reason}`, {
        runId: runId,
        runtimeContext: runtimeContext
      })
    } catch (e: unknown) {
      throw new Error(`failed to receive response from imageFixPromptAgent: ${e}`)
    }

    const {usage, text} = result;

    try  {
      const json = JSON.parse(text);
      return json;
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
})