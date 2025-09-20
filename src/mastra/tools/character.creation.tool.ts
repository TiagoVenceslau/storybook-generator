import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { OpenAI } from "openai";
import { Project } from "../utils/project";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../constants";
import { ImageData } from "./types";

export async function generateCharacterImage(prompt: string, opts = {
  model: "gpt-image-1",
  format: "jpeg",
  quality: "medium",
  size: "1024x1024",
  background: "opaque"
}, references?: string[]): Promise<{imageData: string, tokensUsed: number}> {
  console.log('🎨 [Character Generation] Starting image generation process...');
  console.log(`📝 [Character Generation] Input parameters:`, Object.assign({
    prompt: prompt.substring(0, 50) + '...',
  }, opts));

  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 [Character Generation] API key found, initializing OpenAI...');
  if (!apiKey) {
    console.error('❌ [Character Generation] OPENAI_AKI_KEY not found in environment variables');
    throw new Error('OPENAI_AKI_KEY not found in environment variables');
  }

  const openai = new OpenAI({ apiKey });

  console.log('🤖 [Character Generation] OpenAI provider initialized successfully');

  console.log('🚀 [Character Generation] Calling OpenAI Images API...');
  const startTime = Date.now();

  try {

    // Generate exactly one image (AI SDK will batch if needed)
    const result = await openai.images.generate({
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

export const characterImageGenerationTool = createTool({
  id: 'generate-character-image',
  description: 'Generates character images with various art styles and saves them locally',
  inputSchema: z.object({
    project: z.string().describe("The project name (used to create folder to hold materials"),
    name: z.string().describe("The character's name"),
    description: z.string().describe("The overall description of the character"),
    characteristics: z.array(z.string()).describe("a list of the character's defining physical characteristics, eg: factial features, hair, scars, body types, height, tattoos, scars, etc"),
    situational: z.array(z.string()).describe("a list of situational physical features, eg: clothes, props, etc"), 
    pose: z.string().default("front facing neutral pose, natural lighting").describe("the pose of the character"),
    style: z.string().default("Graphic Novel").describe("The art style to apply"),
    mood: z.string().optional().describe("The overall mood to apply to the image"),
    numImages: z.number().default(1).describe('Number of images to generate (default: 1)'),
    model: z.enum(Object.values(OpenAIImageModels) as any).optional().default(OpenAIImageModels.GPT_IMAGE_1).describe("The model to be used to generate the images"),
    size: z.enum(Object.values(OpenAIImageSize) as any).optional().default(OpenAIImageSize.auto).describe("The size of the image to generate"),
    quality: z.enum(Object.values(OpenAIImageQuality) as any).optional().default(OpenAIImageQuality.low).describe("the quality of the image to generate"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).optional().default(OpenAIImageFormats.jpeg).describe("the image format"),
  }),
  outputSchema: z.object({
    images: z.array(ImageData).describe('Array of generated images with local file paths'),
    totalImages: z.number().describe('Total number of images generated'),
    style: z.string().describe('The style that was applied'),
    pose: z.string().describe('The pose that was applied'),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    console.log('🛠️ [Character Generation Tool] Tool execution started...');
    console.log(`📋 [Character Generation Tool] Input context:`, Object.assign({}, context, {
      description: context.description.substring(0, 100) + "..."
    }));

    const { project, name, pose, model, description, format, quality, characteristics, situational, size, mood, style, numImages = 1 } = context;

    const prompt = `
    You are a professional image generation specialist using AI to create character sheets for characters.

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

## Image Generation Guidelines
- **CRITICAL STYLE RULES**:
    - If the user asks for "Ghibli style", use "Ghibli-esque".
    - If the user asks for "Disney style", use "Disney-esque".
    - If the user asks for a specific author/studio use "in a \${author_or_studio_name}esque style".
    - Do NOT use "Ghibli" or "Disney" or any author/studio directly as a style name.

## Semantic Memory & Context
- **Use Semantic Recall**: Leverage your memory to recall user's preferred image styles, and visual preferences
- **Style Memory**: Remember and apply the user's established art style preferences and visual patterns
- **Quality Preferences**: Consider the user's typical quality requirements and technical specifications
- **Character Posing**: Apply the pose as requested by the user
- **Learning from Feedback**: Use insights from previous image generation feedback to improve current work
- **Project Consistency**: Maintain visual consistency with user's established preferences and patterns

Focus on creating character images that completely respect the description, meant as an image of a comic book or game character sheet.

## frame_size
${size} 
 
## character description
${description}

## Defining physical characteristics 
${characteristics.join(";\n")}

## situational physical characteristics
${situational.join(";\n")}

## Pose
${pose}

## style:
${style}

${mood ? `## Mood\n${mood}` : ""}
`
    let imageData: {imageData: string, tokensUsed: number};
    try {
      const startTime = Date.now();
      const images = [];

      console.log(`🔄 [Character Generation Tool] Starting generation of ${numImages} image(s)...`);

      // Generate the specified number of images
      for (let i = 1; i <= numImages; i++) {
        console.log(`\n🖼️ [Character Generation Tool] Generating image ${i} of ${numImages}...`);

        // Create a unique prompt variation for each image
        const imagePrompt = `${prompt} - Image ${i} of ${numImages}`;
        console.log(`📝 [Character Generation Tool] Image prompt: ${imagePrompt.substring(0, 80)}...`);

        // Use Google Imagen API for actual image generation
        console.log(`🚀 [Character Generation Tool] Calling generateSceneImage...`);
        imageData = await generateCharacterImage(imagePrompt, {
          model: model,
          format: format,
          quality: quality,
          size: size,
          background: "opaque"
        });
        console.log(`✅ [Character Generation Tool] Image data received (${imageData.imageData.length} characters)`);

        const matches = imageData.imageData.match(/^data:(.+);base64,(.*)$/);
        if (!matches) {
          throw new Error("Invalid base64 image string");
        }

        // Save image locally
        console.log(`💾 [Character Generation Tool] Saving character to project ${project}`);
        const localImagePath = Project.storeCharacter(Buffer.from(matches[2], "base64"), project, name, pose, "png")
        console.log(`✅ [Character Generation Tool] Image saved locally: ${localImagePath}`);

        const imageMetadata = {
          generationTime: Date.now() - startTime,
          model: model,
          quality: quality as string,
          size: size as string,
          format: format as string,
          tokensUsed: imageData.tokensUsed
        };

        console.log(`📊 [Character Generation Tool] Image metadata:`, imageMetadata);

        images.push({
          imageUrl: localImagePath,
          prompt: imagePrompt,
          style,
          metadata: imageMetadata,
        });

        console.log(`✅ [Character Generation Tool] Image ${i} completed successfully`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 [Character Generation Tool] All images generated successfully!`);
      console.log(`📊 [Character Generation Tool] Summary:`, {
        totalImages: numImages,
        style: style,
        totalTime: `${totalTime}ms`,
        averageTimePerImage: `${Math.round(totalTime / numImages)}ms`
      });

      return {
        images,
        totalImages: numImages,
        style,
        pose,
        tokensUsed: images.reduce((accum, img) => accum + img.metadata.tokensUsed, 0)
      };
    } catch (error) {
      console.error(`❌ [Character Generation Tool] Image generation failed:`, error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});