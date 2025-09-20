import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { BBox } from "./types";
import sharp from "sharp";
import path from "path"

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
    const { width, height } = await sharp(imagePath).metadata();
    if (!width || !height) throw new Error("Could not read image dimensions.");

    // Validate & clamp bbox to image bounds (optional but safer)
    const x = Math.max(0, Math.min(bbox.x, width - 1));
    const y = Math.max(0, Math.min(bbox.y, height - 1));
    const w = Math.max(1, Math.min(bbox.w, width - x));
    const h = Math.max(1, Math.min(bbox.h, height - y));

    // Build an SVG that has a transparent canvas and one opaque black rect.
    // Sharp will rasterize this to a PNG with alpha.
    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="black" />
    </svg>
  `.trim();

    const output = path.join(
      path.dirname(imagePath),
      path.basename(imagePath, path.extname(imagePath)) + `.mask.png`
    );

    // Important: output must be PNG for the mask (with alpha channel).
    await sharp(Buffer.from(svg))
      .png() // ensures RGBA + preserves transparency outside the rect
      .toFile(output);

    return {
      maskPath: path.resolve(output)
    };
  },
});