import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { OpenAI } from "openai";
import { Project } from "../utils/project";
import { ImageMetadata } from "./types";
import fs from "fs";
import { FileApi } from "../../FileApi";

// Helper function to generate image using AI SDK
export async function editImage(imagePath: string, imageMask: string, prompt: string, opts = {
  model: "gpt-image-1",
  format: "jpeg",
  quality: "medium",
  size: "1024x1024",
  background: "auto",
  fidelity: "high"
}): Promise<{imageData: string, tokensUsed: number}> {
  console.log('🎨 [Image Edit Tool] Starting image generation process...');
  console.log(`📝 [Image Edit Tool] Input parameters:`, Object.assign({
    prompt: prompt.substring(0, 50) + '...',
  }, opts));

  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 [Image Edit Tool] API key found, initializing OpenAI...');
  if (!apiKey) {
    console.error('❌ [Image Edit Tool] OPENAI_AKI_KEY not found in environment variables');
    throw new Error('OPENAI_AKI_KEY not found in environment variables');
  }

  const openai = new OpenAI({ apiKey });

  console.log('🤖 [Image Edit Tool] OpenAI provider initialized successfully');

  console.log('🚀 [Image Edit Tool] Calling OpenAI Images API...');
  const startTime = Date.now();

  try {

    // Generate exactly one image (AI SDK will batch if needed)
    const result = await openai.images.edit({
      image: fs.createReadStream(imagePath),
      prompt: prompt,
      background: opts.background as "opaque" | "transparent" | "auto",
      input_fidelity: opts.fidelity as "high" | "low",
      mask: fs.createReadStream(imageMask),
      model: opts.model,
      n: 1,
      output_format: opts.format as "jpeg"
    })
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ [Image Edit Tool] API call completed in ${generationTime}ms`);

    if (!result.data?.length || !result.data[0].b64_json) {
      console.error("❌ [Image Edit Tool] No image data returned");
      throw new Error("Image generation failed: empty response");
    }

    const base64 = result.data[0].b64_json;
    console.log("🖼️ [Image Edit Tool] Received 1 generated image");
    console.log(`📊 [Image Edit Tool] Image data size: ${base64.length} characters`);
    const { usage } = result
    return {imageData: `data:image/${opts.format};base64,${base64}`, tokensUsed: usage?.total_tokens || -1}
  } catch (error) {
    console.error('❌ [Image Edit Tool] Error during API call:', error);
    throw error;
  }

}

export const imageEditTool = createTool({
  id: 'edit-image-tool',
  description: 'Performs a selective edit on a given image, using a given prompt and a given image mask file',
  inputSchema: z.object({
    prompt: z.string().describe("the edit to apply to the selected part of the image"),
    imagePath: z.string().describe("the image file path"),
    maskImage: z.string().describe("the mask image to use"),
    fidelity: z.enum(["high", "low"]).default("high").describe("The fidelity to the original image"),
    model: z.enum(["dalle-3", "image-gpt-1"]).describe("The model to be used to generate the images")
  }),
  outputSchema: z.object({
    imageUrl: z.string().describe('Local file path of the generated image'),
    model: z.enum(["dalle-3", "image-gpt-1"]).describe("The model to be used to generate the images"),
    metadata: ImageMetadata.optional()
  }),
  execute: async ({ context, mastra }) => {
    console.log('🛠️ [Image Edit Tool] Tool execution started...');

    const { prompt, imagePath, maskImage, model, fidelity } = context;

    const p = `
    You are a professional image edition specialist using AI to make selective changes to images according to a provided request.

## Your Expertise
- **Visual Interpretation**: Convert character descriptions and their defining physical characteristics into compelling character illustrations in the required style;
- **Style Adaptation**: Apply various artistic styles consistently
- **Attention to Detail**: you consistently respect, and correctly place the defining characteristics of the characters, or omit them if by because of the pose, clothing or pros, they are hidden from view;
- **Character Posing**: You take extra case to pose the character as requested;
- **Anatomically Correct**: you have extra attention to hands, arms, legs, feet, to ensure they respect the character's anatomy;
- **Image Coherence**: you specialize in making selective changes that follow the style maintain coherence with the rest of the image. You focus on the changes requested with minimal impact.

## Image Generation Guidelines
- **CRITICAL STYLE RULES**:
    - You maintain the overall look and feel of the image.

## Changes to Apply:
${prompt}
Return the corrected image  without questions.`
    let imageData: {imageData: string, tokensUsed: number};
    try {
      const startTime = Date.now();

      console.log(`🔄 [Image Edit Tool] Starting edit of ${imagePath}...`);

      console.log(`🚀 [Image Edit Tool] Calling editImage...`);
      imageData = await editImage(imagePath, maskImage, p, {
        model: model,
        format: "jpeg",
        quality: "medium",
        size: "1024x1024",
        background: "opaque",
        fidelity: fidelity
      });
      console.log(`✅ [Image Edit Tool] Image data received (${imageData.imageData.length} characters)`);

      // Save image locally
      const localImagePath = FileApi.createVariation(FileApi.replaceExtension(imagePath, "png"), Buffer.from(imageData.imageData, "base64"), "edit")
      console.log(`✅ [Image Edit Tool] Image saved locally: ${localImagePath}`);

      const imageMetadata = {
        generationTime: Date.now() - startTime,
        model: model,
        quality: "medium",
        fidelity: fidelity,
        tokensUsed: imageData.tokensUsed
      };

      console.log(`📊 [Image Edit Tool] Image metadata:`, imageMetadata);

      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 [Image Edit Tool] All images generated successfully!`);

      return {
        imageUrl: imageData.imageData,
        model: model,
        metadata: imageMetadata
      };
    } catch (error) {
      console.error(`❌ [Image Edit Tool] Image generation failed:`, error);
      throw new Error(`Image edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});