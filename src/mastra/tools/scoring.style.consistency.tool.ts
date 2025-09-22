import { Tool } from "@mastra/core/tools";
import OpenAI from "openai";
import z from "zod";
import { Score } from "./types";
import { OpenAIImageFormats } from "../constants";
import { ImageApi } from "../../ImageApi";

const client = new OpenAI();

export const StyleConsistencyScorer = new Tool({
  id: "style-consistency-scorer",
  description: "Scores how consistent the generated style is with the illustration style.",
  inputSchema: z.object({
    threshold: z.number().max(1).min(0).default(0.95).describe("the threshold for acceptance"),
    style: z.string().describe("the graphical style"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).describe("the image format"),
    references: z.array(z.instanceof(Buffer)).optional().describe("reference images to evaluate against")
  }),
  outputSchema: z.object({
      style: Score
  }),
  execute: async ({context}) => {
    const { image, style, references, threshold, format } = context;
    const {oriented, W, H } = await ImageApi.sizeAndOrientation(image)

    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are an style image scoring assistant. You are an expert at evaluating the adherence of and image to an art style,
given an art style, or it's description, but also against reference images and identify inconsistencies.
You are a specialist in, when a defect is found, extract a minimal bounding box (bbox) around the defect for later edit.
IT MUST COMPLETELY COVER THE DEFECT.

Bounding box format: xywh, top-left origin, y-down.

Rate character consistency (0-1), provide reason, and bounding box if applicable.

Important grading rubric:
- 1.0: Perfect style consistency - it's unmistakenly the same style. Line weights, shading weights, color palette and overall design all match the style
- 0.9-1: they are clearly the same style but there are subtle differences in line weights, palette or design
- 0.8-0.9: Minor variations in in line weights, shading weights, palette or design but clearly the same style
- 0.5-0.7: Noticeable inconsistencies in line weights, shading weights, palette or design,
- 0.1-0.4: Major visual drift - significant inconsistencies
- 0.0: Complete inconsistency - unrecognizable style between images or description

Rate style consistency across:
- Lighting conditions and atmosphere match the style
- Line weight match
- Shading weight match
- Color palette matches the style
- Art style consistency

the resulting value is the average between all ot them.
Rating should be returned as JSON: {
  "score": number, 0-1,
  if (score lower than ${threshold}):
  "reasons": [ // array of reasons for the score, and their corresponding bounding box
    {
      "reason": "string describing the reason for the lower score"
      "bbox": {
        "x": leftmost x coordinate in pixels of the bounding box (x axis points right),
        "y": upmost y coordinate in pixels of the bounding box (y axis points down),
        "h": the height in pixels of the bounding box,
        "w": "the width in pixels of the bounding box
      }
    }
  ]
}

### Example output:
{
  "score": 0.52,
  "reasons": [{
    "reason": "the line weight is noticeably different in all image",
    "bbox": // bounding box for the whole image 
  },
  {
    "reason": "the contrast if very different from the style",
    "bbox": // bounding box for the specific defect's location
  }]
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `## Image to evaluate (height: ${H}px, width: ${W}px
\nEvaluate how closely this matches style: ${style}` },
            // @ts-ignore
            { type: "image_url", image_url: {url:`data:image/${format};base64,` + image.toString("base64") }},
            ...(references  && references.length ? [
              {type: "text", text: "\n## Reference images\n"},
              ...references.map((r,i) => {
                return [
                  {type: "text", text: `\n### reference image ${i}\n`},
                  { type: "image_url", image_url: {user:`data:image/${format};base64,` + r.toString("base64") }},
                ]
              }).flat()
            ] : [])
          ],
        },
      ],
    } as any);

    try  {
      const json = JSON.parse(res.choices[0].message.content || "{}");
      return {
        style: json
      };
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
});
