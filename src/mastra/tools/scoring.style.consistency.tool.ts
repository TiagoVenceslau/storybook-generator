import { Tool } from "@mastra/core/tools";
import OpenAI from "openai";
import z from "zod";
import { Score } from "./types";
import { OpenAIImageFormats } from "../constants";

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
  outputSchema: Score,
  execute: async ({context}) => {
    const { image, style, references, threshold, format } = context;

    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
          You are an style image scoring assistant. You are an expert at evaluating the adherence of and image to an art style,
given an art style, or it's description, but also against reference images and identify inconsistencies.

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
        "x": leftmost x coordinate ob the bounding box,
        "y": upmost y coordinate of the bounding box,
        "h": the height of the bounding box,
        "w": "the width of the bounding box
      }
    }
  ]
}

### Example output:
{
  "score": 0.52,
  "reasons": [{
    "reason": "the line weight is noticeably different in all image",
    "bbox": {"x": 0, "y": 0, "h": 1024, "w": 1024}
  },
  {
    "reason": "the contrast if very different from the style",
    "bbox": {"x": 67, "y": 508, "h": 132, "w": 134}
  }]
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Evaluate how closely this matches style: ${style}` },
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
      return json;
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
});
