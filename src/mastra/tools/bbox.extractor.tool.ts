import { Tool, ToolExecutionContext } from "@mastra/core/tools";
import OpenAI from "openai";
import {z} from "zod"
import { OpenAIImageFormats } from "../constants";
import { Score } from "./types";
import { ImageApi } from "../../ImageApi";
import { safeParseJSON } from "../../utils";

const client = new OpenAI();

export const BoundingBoxExtractorTool = new Tool({
  id: "bounding-box-extractor-tool",
  description: "Extract bounding foxes for a specific feature in the image",
  inputSchema: z.object({
    description: z.string().describe("description of what the bounding box is mean to cover"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).default(OpenAIImageFormats.jpeg).describe("the image format"),
  }),
  outputSchema: z.record(z.string(), Score).describe("a record of all defects and their scores"),
  execute: async ({context}) => {
    const { image, description, format } = context;

    const {oriented, W, H } = await ImageApi.sizeAndOrientation(image)

    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an bounding box generator assistant. You are an expert at evaluating images against a description of a feature,
identify that feature in the image, and extract the bounding box of that feature.
When identifying character features, you take into account their positioning, camera angle and perspective (eg: if requested a right hand, and the character is facing the camera, the right hand is the leftmost hand in the picture).
You are a specialist in, when a defect is found, extract a minimal bounding box (bbox) around the defect for later edit.
IT MUST COMPLETELY COVER THE DESCRIBED FEATURE.

Bounding box format: xywh, top-left origin, y-down.

all ratings should be returned as JSON:
{
  "x": leftmost x coordinate in pixels of the bounding box (x axis points right),
  "y": upmost y coordinate in pixels of the bounding box (y axis points down),
  "h": the height in pixels of the bounding box,
  "w": "the width in pixels of the bounding box
}

all bbox values are relative to ORIGINAL oriented image size

respond with JSON only! never include any markdown format!
`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `            
## Extract the bounding box for this feature
${description}

## Image to evaluate (height: ${H}px, width: ${W}px`},
    // @ts-ignore
            { type: "image_url", image_url: {url: `data:image/${format};base64,` + oriented.toString("base64") }},
          ],
        },
      ],
      temperature: 0.2
    } as any);
    try  {
      const json = safeParseJSON(res.choices[0].message.content || "{}");
      return json;
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
});
