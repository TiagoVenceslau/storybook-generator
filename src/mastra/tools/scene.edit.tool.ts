import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ImageData } from "./types";
import { FileApi } from "../../FileApi";
import {
  OpenAIEditFidelity, OpenAIImageBackgrounds,
  OpenAIImageFormats,
  OpenAIImageModels,
  OpenAIImageQuality,
} from "../constants";
import { ImageApi } from "../../ImageApi";


export const SceneEditTool = createTool({
  id: 'scene-character-tool',
  description: 'Performs a selective edit on a given character image, using a given prompt and a given image mask file',
  inputSchema: z.object({
    prompt: z.string().describe("the edit to apply to the selected part of the image"),
    description: z.string().describe("The overall description of the character"),
    characteristics: z.array(z.string()).optional().describe("a list of the character's defining physical characteristics, eg: factial features, hair, scars, body types, height, tattoos, scars, etc, os a scene's main features"),
    situational: z.array(z.string()).optional().describe("a list of situational features (features than may belong to the image in a specific situation, but not always"),
    style: z.string().default("Graphic Novel").describe("The art style to apply"),
    mood: z.string().optional().describe("The overall mood to apply to the image"),
    imagePath: z.string().describe("the image file path"),
    maskImage: z.string().describe("the mask image to use"),
    fidelity: z.enum(Object.values(OpenAIEditFidelity) as any).default(OpenAIEditFidelity.high).describe("The fidelity to the original image"),
    model: z.enum(Object.values(OpenAIImageModels) as any).default(OpenAIImageModels.GPT_IMAGE_1).describe("The model to be used to generate the images"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
    background: z.enum(Object.values(OpenAIImageBackgrounds) as any).optional().default(OpenAIImageBackgrounds.auto).describe("the image format"),
    references: z.array(z.string()).or(z.record(z.string(), z.string())).optional().describe("a list of reference image paths"),
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied')
  }),
  execute: async ({ context, mastra }) => {
    console.log('🛠️ [Scene Edit Tool] Tool execution started...');

    const { prompt, imagePath, maskImage, model, description, characteristics, situational, style, mood, background, fidelity, format, quality, references } = context;

    const p = `
        You are a professional image generation specialist using AI to edit character images to create character sheets for characters.

## Your Expertise
- **Visual Interpretation**: Convert character descriptions and their defining physical characteristics into compelling character illustrations in the required style;
- **Style Adaptation**: Apply various artistic styles consistently
- **Character Visualization**: Bring characters to life with consistent appearances in the given pose;
- **Attention to Detail**: you consistently respect, and correctly place the defining characteristics of the characters, or omit them if by because of the pose, clothing or pros, they are hidden from view;
- **Character Posing**: You take extra case to pose the character as requested;
- **Facial Details and Expressions**: you take extra care to create detailed, expressive and life-like faces;
- **Anatomically Correct**: you have extra attention to hands, arms, legs, feet, to ensure they respect the character's anatomy;
- **Pure White Backgrounds**: you specialize in making representation of the characters in given poses  for reference purposes (eg Character Sheet) so always put them against pure white background
- **Framing**: your complete images always fit the frame_size;
- **Complete character**: unless specified by the user, the complete character (body, limbs, extremities, head, both feet, both hands) must be in frame;
- **Visual Interpretation**: Convert character descriptions and their defining physical characteristics into compelling character illustrations in the required style;
- **Style Adaptation**: Apply various artistic styles consistently
- **Attention to Detail**: you consistently respect, and correctly place the defining characteristics of the characters, or omit them if by because of the pose, clothing or pros, they are hidden from view;
- **Character Posing**: You take extra case to pose the character as requested;
- **Anatomically Correct**: you have extra attention to hands, arms, legs, feet, to ensure they respect the character's anatomy;
- **Image Coherence**: you specialize in making selective changes that follow the style maintain coherence with the rest of the image unless asked otherwise. You focus on the changes requested with minimal impact.

## Image Generation Guidelines
- **CRITICAL STYLE RULES**:
    - If the user asks for "Ghibli style", use "Ghibli-esque".
    - If the user asks for "Disney style", use "Disney-esque".
    - If the user asks for a specific author/studio use "in a \${author_or_studio_name}esque style".
    - Do NOT use "Ghibli" or "Disney" or any author/studio directly as a style name.
    - You maintain the overall look and feel of the image unless specified otherwise.
- **CRITICAL RULES**: 
    - Only affect change of the provided mask;
    - You evaluate the description of the original image given to and maintain consistency with it in your edits;
    - You always include the character's defining characteristics in your edits when they apply, but also know when to omit them because they are hidden from view;
    - You always include the situational features as described, when given and applicable;
    - you respect character poses when they are provided;
    - you respect the provided style when moods when provided;
    - when provided references, you include them in you evaluation and use them as references or as otherwise specified by the user;
    - if you cannot perform the select change on the mask you are given, return "MASK ERROR";
    - Your respect all the above rules, but are still proficient making the requested edits;

## Changes to Apply:
${prompt}

## description of original image
${description}

${characteristics ? `## Image's defining characteristics\n${characteristics.join(";\n")}` : ""}
${situational ? `## Image's situational characteristics\n${situational.join(";\n")}` : ""}
${pose ? `## Pose\n${pose}` : ""}

## style:
${style}

${mood ? `## Mood\n${mood}` : ""}`
    let imageData: {imageData: string, tokensUsed: number};
    try {
      const startTime = Date.now();

      console.log(`🔄 [Scene Edit Tool] Starting edit of ${imagePath}...`);

      console.log(`🚀 [Scene Edit Tool] Calling editImage...`);
      imageData = await ImageApi.editImage(imagePath, maskImage, p, {
        model: model,
        format: format,
        quality: quality,
        background: background,
        fidelity: fidelity
      }, references);
      console.log(`✅ [Scene Edit Tool] Image data received (${imageData.imageData.length} characters)`);


      const matches = imageData.imageData.match(/^data:(.+);base64,(.*)$/);
      if (!matches) {
        throw new Error("Invalid base64 image string");
      }

      // Save image locally
      const localImagePath = FileApi.createVariation(imagePath, Buffer.from(matches[2], "base64"), "edit")
      console.log(`✅ [Scene Edit Tool] Image saved locally: ${localImagePath}`);

      const imageMetadata = {
        generationTime: Date.now() - startTime,
        model: model,
        quality: quality,
        fidelity: fidelity,
        tokensUsed: imageData.tokensUsed,
        format: format,
      };

      console.log(`📊 [Scene Edit Tool] Image metadata:`, imageMetadata);

      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 [Scene Edit Tool] All images generated successfully!`);

      return {
        images: [{
          imageUrl: localImagePath,
          prompt: p,
          style: style,
          metadata: imageMetadata
        }],
        totalImages: 1,
        style: style,
        pose: pose,
      };
    } catch (error) {
      console.error(`❌ [Scene Edit Tool] Image generation failed:`, error);
      throw new Error(`Image edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});