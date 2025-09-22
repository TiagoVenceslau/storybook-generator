import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ImageMetadata } from "../../tools/types";
import { ImageEditTool } from "../../tools/image.edit.tool";
import {
  OpenAIEditFidelity,
  OpenAIImageBackgrounds,
  OpenAIImageFormats,
  OpenAIImageModels,
  OpenAIImageQuality,
} from "../../constants";

export const ImageFixDefectStep  = createStep({
  id: "image-fix-defect-step",
  description: "Given a defect and it's bounding box, perform an image edit to fix the defect",
  inputSchema: z.object({
    prompt: z.string().describe("the prompt to use to fix the image"),
    imagePath: z.string().describe("the image file path"),
    maskImage: z.string().describe("the mask image to use"),
    fidelity: z.enum(Object.values(OpenAIEditFidelity) as any).default(OpenAIEditFidelity.high).describe("The fidelity to the original image"),
    model: z.enum(Object.values(OpenAIImageModels) as any).default(OpenAIImageModels.GPT_IMAGE_1).describe("The model to be used to generate the images"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    background: z.enum(Object.values(OpenAIImageBackgrounds) as any).optional().default(OpenAIImageBackgrounds.auto).describe("the image format"),
    references: z.array(z.string()).optional().describe("list of reference images"),
  }),
  outputSchema: z.object({
    imageUrl: z.string().describe('Local file path of the generated image'),
    model: z.string().describe("The model to be used to generate the images"),
    metadata: ImageMetadata.optional()
  }),
  execute: async ({inputData, mastra, runtimeContext,  runId}) => {
    const {prompt, imagePath, maskImage, model, format, fidelity, references, background, quality} = inputData;
    const editTool = ImageEditTool;
    let edit: z.infer<typeof editTool.outputSchema>;
    try {
      edit = await editTool.execute({context: {
        prompt: prompt,
        imagePath: imagePath,
        maskImage: maskImage,
        fidelity: fidelity,
        model: model,
        quality: quality,
        format: format,
        background: background,
        references: references,
      }, mastra, runtimeContext, runId})
    } catch (e: unknown) {
      throw new Error(`failed to edit image: ${e}`)
    }

    return edit;
  }
})
