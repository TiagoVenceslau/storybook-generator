import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { BBox } from "./types";
import { ImageApi } from "../../ImageApi";
import BoundingBox = PDFKit.Mixins.BoundingBox;

export const MaskImageTool = createTool({
  id: 'sum-mask-image-tool',
  description: 'calculares the sum of all provided bounding boxes',
  inputSchema: z.array(BBox).min(2).describe("The bounding boxes to be added together"),
  outputSchema: z.object({
    bbox: BBox.describe("the file path for the mask image file"),
  }),
  execute: async ({ context, mastra }) => {
    console.log('🛠️ [Mask Sum Tool] Tool execution started...');
    const bbox = ImageApi.addMask(context[0], context[1], ...context.slice(2));
    return {
      bbox: bbox
    }
  },
});