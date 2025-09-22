import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { BBox } from "./types";
import { ImageApi } from "../../ImageApi";

export const MaskImageTool = createTool({
  id: 'mask-image-tool',
  description: 'creates a mask image from the provided image and bounding box',
  inputSchema: z.object({
    imagePath: z.string().describe("The project name (used to create folder to hold materials"),
    bbox: BBox.describe("the bounding box to mask"),
  }),
  outputSchema: z.object({
    maskPath: z.string().describe("the file path for the mask image file"),
  }),
  execute: async ({ context, mastra }) => {
    console.log('🛠️ [Image Mask Tool] Tool execution started...');
    const {imagePath, bbox} = context;

    const expanded = ImageApi.letterBox(bbox, 70)
    return ImageApi.mask(imagePath, expanded);
  },
});