import { BBox } from "./mastra/tools/types";
import { z } from "zod";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { FileApi } from "./FileApi";
import { OpenAI } from "openai";
import { Logger, Logging } from "@decaf-ts/logging";
type BoundingBox = z.infer<typeof BBox>;

export class ImageApi {
  private constructor() {}

  private static _client?: OpenAI

  protected static log: Logger = Logging.for("ImageApi")

  protected static get client(){
    const apiKey = process.env.OPENAI_API_KEY;
    const log = this.log.for("client")
    log.info('🔑 [ImageAPI] API key found, initializing OpenAI...');
    if (!apiKey) {
      log.error('❌ [ImageAPI] OPENAI_AKI_KEY not found in environment variables');
      throw new Error('OPENAI_AKI_KEY not found in environment variables');
    }
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: apiKey,
      });
    }
    return this._client;
  }

  static async generateImage(prompt: string, opts = {
    model: "gpt-image-1",
    format: "jpeg",
    quality: "medium",
    size: "1024x1024",
    background: "opaque"
  }): Promise<{imageData: string, tokensUsed: number}> {
    const log = this.log.for(this.generateImage)
    log.info('🤖OpenAI provider initialized successfully');

    log.info('🚀 Calling OpenAI Images API...');
    const startTime = Date.now();

    try {

      // Generate exactly one image (AI SDK will batch if needed)
      const result = await this.client.images.generate({
        model: opts.model,
        prompt: prompt,
        n: 1,
        size: opts.size as any,
        quality: opts.quality as any,
        output_format: opts.format as any,
        background: opts.background as any,
      });

      const generationTime = Date.now() - startTime;
      console.log(`✅ [Character Generation] API call completed in ${generationTime}ms`);

      if (!result.data?.length || !result.data[0].b64_json) {
        console.error("❌ [Character Generation] No image data returned");
        throw new Error("Image generation failed: empty response");
      }

      const base64 = result.data[0].b64_json;
      console.log("🖼️ [Character Generation] Received 1 generated image");
      console.log(`📊 [Character Generation] Image data size: ${base64.length} characters`);
      const { usage } = result
      return {imageData: `data:image/${opts.format};base64,${base64}`, tokensUsed: usage?.total_tokens || -1}
    } catch (error) {
      console.error('❌ [Character Generation] Error during API call:', error);
      throw error;
    }
  }

  static async editImage(imagePath: string, imageMask: string, prompt: string, opts = {
      model: "gpt-image-1",
      format: "jpeg",
      quality: "medium",
      background: "auto",
      fidelity: "high"
    }, references?: string[] | Record<string, string>): Promise<{imageData: string, tokensUsed: number}> {

    console.log('🤖 [Character Edit Tool] OpenAI provider initialized successfully');

    console.log('🚀 [Character Edit Tool] Calling OpenAI Images API...');
    const startTime = Date.now();

    try {

      function toFile(filePath: string){
        return new File([Buffer.from(fs.readFileSync(filePath))], FileApi.fileName(filePath), { type: `image/${FileApi.extension(filePath)}` });
      }

      const refs = Array.isArray(references) ? references : Object.values(references || {});
      const files = [imagePath, ...refs].map(f => toFile(f));
      const mask = toFile(imageMask);

      if (refs.length)
        prompt = prompt + `\nThe first image is the image to edit, the remaining are references,\n${!Array.isArray(references) ? `## REFERENCES:\n${Object.keys(references as any)}` : ""}`

      // Generate exactly one image (AI SDK will batch if needed)\
      const result = await this.client.images.edit({
        image: files,
        prompt: prompt,
        background: opts.format === "jpeg" ? "opaque" : opts.background as "opaque" | "transparent" | "auto",
        input_fidelity: opts.fidelity as "high" | "low",
        mask: mask,
        model: opts.model,
        n: 1,
        output_format: opts.format as "jpeg"
      })

      const generationTime = Date.now() - startTime;
      console.log(`✅ [Character Edit Tool] API call completed in ${generationTime}ms`);

      if (!result.data?.length || !result.data[0].b64_json) {
        console.error("❌ [Character Edit Tool] No image data returned");
        throw new Error("Character generation failed: empty response");
      }

      const base64 = result.data[0].b64_json;
      console.log("🖼️ [Character Edit Tool] Received 1 generated image");
      console.log(`📊 [Character Edit Tool] Image data size: ${base64.length} characters`);
      const { usage } = result
      return {imageData: `data:image/${opts.format};base64,${base64}`, tokensUsed: usage?.total_tokens || -1}
    } catch (error) {
      console.error('❌ [Character Edit Tool] Error during API call:', error);
      throw error;
    }

  }

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

  static markFinal(p: string){
    const match = p.match(/([\w\\\/\-_\s.]+?)-(\d+)[.\-_]*(edit|mask)?-?(\d+)\.(png|jpeg)/g);
    if (!match)
      throw new Error(`Could image does not match expected naming pattern ${p}`);
    const newName = `${match[1]}-final.${match[5] || match[4] || match[3] || match[2]}`
    FileApi.rename(p, newName);
    return newName;
  }

  static async sizeAndOrientation(img: Buffer){
    const oriented = await sharp(img).rotate().toBuffer(); // auto-orient by EXIF
    const meta = await sharp(oriented).metadata();
    const W = meta.width!, H = meta.height!;
    return { oriented, W, H };
  }

  static avgScore(fixes: {score: number}[]){
    return (fixes.reduce((acc, s) => acc + s.score, 0) / fixes.length)
  }

  static weightedScore(fixes: Record<string, {score: number}>, weights: Record<string, number>){
    const values = Object.entries(fixes);
    return values.reduce((acc, [k, s]) => {
      if (!(k in weights))
        throw new Error(`Weight for ${k} not found in weights`)
      return acc + s.score * weights[k]
    }, 0)
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