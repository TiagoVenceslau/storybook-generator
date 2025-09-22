import { BBox } from "./mastra/tools/types";
import { z } from "zod";
import sharp from "sharp";
import path from "path";
import fs from "fs";
type BoundingBox = z.infer<typeof BBox>;

export class ImageApi {
  private constructor() {}
  
  static addMask(bbox: BoundingBox, bbox2: BoundingBox, ...others: BoundingBox[]): BoundingBox {
    // Normalize to [x1,y1,x2,y2]
    const toEdges = (b: BoundingBox) => ({
      x1: b.x,
      y1: b.y,
      x2: b.x + b.w,
      y2: b.y + b.h,
    });

    const first = toEdges(bbox);
    const second = toEdges(bbox2);

    let minX = Math.min(first.x1, second.x1);
    let minY = Math.min(first.y1, second.y1);
    let maxX = Math.max(first.x2, second.x2);
    let maxY = Math.max(first.y2, second.y2);

    for (const b of others) {
      const e = toEdges(b);
      minX = Math.min(minX, e.x1);
      minY = Math.min(minY, e.y1);
      maxX = Math.max(maxX, e.x2);
      maxY = Math.max(maxY, e.y2);
    }

    return {
      x: minX,
      y: minY,
      w: Math.max(0, maxX - minX),
      h: Math.max(0, maxY - minY),
    };
  }

  static letterBox(bbox: BoundingBox, margin: number = 70): BoundingBox {

    if (margin < 0) throw new Error("Margin must be non-negative");

    // Add margin to all sides
    return {
      x: Math.max(0, bbox.x - margin),
      y: Math.max(0, bbox.y - margin),
      w: bbox.w + (2 * margin), // Add margin to both left and right
      h: bbox.h + (2 * margin), // Add margin to both top and bottom
    };
  }

  static async sizeAndOrientation(img: Buffer){
    const oriented = await sharp(img).rotate().toBuffer(); // auto-orient by EXIF
    const meta = await sharp(oriented).metadata();
    const W = meta.width!, H = meta.height!;
    return { oriented, W, H };
  }

  static async mask(imagePath: string, bbox: BoundingBox){
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

    let output = path.join(
      path.dirname(imagePath),
      path.basename(imagePath, path.extname(imagePath)) + `.mask.png`
    );
    let counter = 0;

    do {
      try {
        fs.statSync(output)
      } catch (e: unknown) {
        break;
      }
      output = path.join(
        path.dirname(imagePath),
        path.basename(imagePath, path.extname(imagePath)) + `.mask_${counter++}.png`)
    } while(true)


    // Important: output must be PNG for the mask (with alpha channel).
    await sharp(Buffer.from(svg))
      .png() // ensures RGBA + preserves transparency outside the rect
      .toFile(output);

    return {
      maskPath: path.resolve(output)
    };
  }
}