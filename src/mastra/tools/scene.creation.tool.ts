import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { OpenAI } from "openai";
import { Project } from "../utils/project";
import { OpenAIImageFormats, OpenAIImageModels, OpenAIImageQuality, OpenAIImageSize } from "../constants";
import { ImageData } from "./types";
import { Character, Location, Scene } from "../workflows/payloads";
import { ImageApi } from "../../ImageApi";

export const sceneImageGenerationTool = createTool({
  id: 'generate-scene-image',
  description: 'Generates scene images with various art styles and saves them locally',
  inputSchema: z.object({
    project: z.string().describe("The project name (used to create folder to hold materials"),
    name: z.string().describe("The location's name"),
    scene: Scene.describe("The scene descriptions and elements"),
    characters: z.array(Character).describe("The full list of possible characters"),
    locations: z.array(Location).describe("The full list of possible locations"),
    shotType: z.string().describe("the camera shot or point of view"),
    style: z.string().describe("The art style to apply"),
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
    tokensUsed: z.number().describe("The token usage of the tool")
  }),
  execute: async ({ context, mastra, runtimeContext, runId }) => {
    console.log('🛠️ [Scene generation Tool] Tool execution started...');

    const { project, name, model, locations, scene, shotType, format, quality, characters, size, mood, style, numImages = 1 } = context;

    const location = locations.find(l => l.name === scene.location.name);
    if (!location)
      throw new Error(`Invalid location: ${scene.location.name}`)
    let chars: any[] = [];
    if (scene.characters && scene.characters.length)
      chars = characters.filter(c => scene.characters?.map(c => c.name).includes(c.name)).map(c => Object.assign({}, c, {
        situational: scene.characters?.find(c2 => c.name === c2.name)?.situational
      }))

    const prompt = `
    You are a professional comic bool scene generation specialist using AI to create images for comic book scenes according to a given description, characteristics, shot type, characters and a visual style.

## Your Expertise
- **Visual Interpretation**: Convert scene descriptions and their defining characteristics into compelling illustrations in the required style;
- **Style Adaptation**: Apply various artistic styles consistently
- **Scene Visualization**: Bring locations and characters to life with consistent appearances in the given pose;
- **Attention to Detail**: you consistently respect, and correctly place the defining characteristics of the locations and characters, or omit them if by because perspective or  obstruction, they are hidden from view;
- **Character posing**: you pose characters according to the provided descriptions and characteristics;
- **Character expressions**: you draw characters with compelling expressions, matching the given description;
- **Framing**: your complete images always fit the frame_size;

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

Focus on creating location images that completely respect the description, meant as an image of a comic book.

## frame_size
${size} 
 
## scene description
${scene.description}

## location description 
${location.description}

## location defining characteristics 
${location.characteristics.join("\n")}

## location situational characteristics 
${location.situational ? `## location situational characteristics\n${location.situational.join("\n")}` : ""}

${chars.length ? `## characters\n${chars.map(c => `### Character name: ${c.name}
###  Character description:
${c.description}

### Defining characteristics:
${c.characteristics.join("\n")}

### Situational Characteristics
${c.situational.join("\n")}`)}` : ""}

## ShotType
${shotType}

## style:
${style}

${mood ? `## Mood\n${mood}` : ""}
`
    let imageData: {imageData: string, tokensUsed: number};
    try {
      const startTime = Date.now();
      const images = [];

      console.log(`🔄 [Scene generation Tool] Starting generation of ${numImages} image(s)...`);

      // Generate the specified number of images
      for (let i = 1; i <= numImages; i++) {
        console.log(`\n🖼️ [Scene generation Tool] Generating image ${i} of ${numImages}...`);

        // Create a unique prompt variation for each image
        const imagePrompt = `${prompt} - Image ${i} of ${numImages}`;
        console.log(`📝 [Scene generation Tool] Image prompt: ${imagePrompt.substring(0, 80)}...`);

        // Use Google Imagen API for actual image generation
        console.log(`🚀 [Scene generation Tool] Calling generateSceneImage...`);
        imageData = await ImageApi.generateImage(imagePrompt, {
          model: model,
          format: format,
          quality: quality,
          size: size,
          background: "opaque"
        });
        console.log(`✅ [Scene generation Tool] Image data received (${imageData.imageData.length} characters)`);

        const matches = imageData.imageData.match(/^data:(.+);base64,(.*)$/);
        if (!matches) {
          throw new Error("Invalid base64 image string");
        }

        // Save image locally
        console.log(`💾 [Scene generation Tool] Saving character to project ${project}`);
        const localImagePath = Project.storeScene(Buffer.from(matches[2], "base64"), project, name, "png")
        console.log(`✅ [Scene generation Tool] Image saved locally: ${localImagePath}`);

        const imageMetadata = {
          generationTime: Date.now() - startTime,
          model: model,
          quality: quality as string,
          size: size as string,
          format: format as string,
          tokensUsed: imageData.tokensUsed
        };

        console.log(`📊 [Scene generation Tool] Image metadata:`, imageMetadata);

        images.push({
          imageUrl: localImagePath,
          prompt: imagePrompt,
          style,
          metadata: imageMetadata,
        });

        console.log(`✅ [Scene generation Tool] Image ${i} completed successfully`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 [Scene generation Tool] All images generated successfully!`);
      console.log(`📊 [Scene generation Tool] Summary:`, {
        totalImages: numImages,
        style: style,
        totalTime: `${totalTime}ms`,
        averageTimePerImage: `${Math.round(totalTime / numImages)}ms`
      });

      return {
        images,
        totalImages: numImages,
        style,
        tokensUsed: images.reduce((accum, img) => accum + img.metadata.tokensUsed, 0)
      };
    } catch (error) {
      console.error(`❌ [Scene generation Tool] Image generation failed:`, error);
      throw new Error(`Scene generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});