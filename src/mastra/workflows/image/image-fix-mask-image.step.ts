import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata, ScoreReason } from "../../tools/types";
import { ImageFixPromptTool } from "../../tools/image.fix.prompt.tool";
import { ImageEditTool } from "../../tools/image.edit.tool";
import {
  OpenAIEditFidelity,
  OpenAIImageBackgrounds,
  OpenAIImageFormats,
  OpenAIImageModels,
  OpenAIImageQuality,
} from "../../constants";
import { MaskImageTool } from "../../tools/image.mask.tool";

export const ImageFixMaskImageStep  = createStep({
  id: "image-fix-defect-step",
  description: "Given a defect and it's bounding box, perform an image edit to fix the defect",
  inputSchema: z.object({
    score: ScoreReason.describe("the score and the reason behind it"),
    imagePath: z.string().describe("the image file path"),
  }),
  outputSchema: z.object({
    maskPath: z.string().describe("the file path for the mask image file"),
  }),
  execute: async ({inputData, mastra, runtimeContext,  runId}) => {

    const {imagePath, score} = inputData;

    const {bbox} = score;

    const editTool = MaskImageTool;
    let mask: z.infer<typeof editTool.outputSchema>;
    try {
      mask = await editTool.execute({context: {
        bbox: bbox,
        imagePath: imagePath,
      }, mastra, runtimeContext, runId})
    } catch (e: unknown) {
      throw new Error(`failed to edit image: ${e}`)
    }

    return mask;
  }
})
