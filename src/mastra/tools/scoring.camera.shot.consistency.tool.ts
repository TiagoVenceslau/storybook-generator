import { Tool } from "@mastra/core/tools";
import OpenAI from "openai";
import z from "zod";
import { Score } from "./types";
import { OpenAIImageFormats } from "../constants";
import { ImageApi } from "../../ImageApi";
import { safeParseJSON } from "../../utils";

const client = new OpenAI();

export const ShotConsistencyScorer = new Tool({
  id: "shot-consistency-scorer",
  description: "Scores how consistent the image is with the requested shot.",
  inputSchema: z.object({
    threshold: z.number().max(1).min(0).default(0.95).describe("the threshold for acceptance"),
    description: z.string().describe("The description of the scene"),
    shotType: z.string().describe("the shot type"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).describe("the image format"),
    references: z.array(z.instanceof(Buffer)).optional().describe("reference images to evaluate against")
  }),
  outputSchema: z.object({
      style: Score
  }),
  execute: async ({context}) => {
    const { image, description, shotType, references, threshold, format } = context;
    const {oriented, W, H } = await ImageApi.sizeAndOrientation(image)

    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are an camera shot scoring assistant. You are an expert at evaluating the adherence of and image to the specified camera shot,
given a shot type and an image's description, and also against reference images and identify inconsistencies.
You are a specialist in, when a defect is found, extract a minimal bounding box (bbox) around the defect for later edit.
IT MUST COMPLETELY COVER THE DEFECT.

Bounding box format: xywh, top-left origin, y-down.

Rate character consistency (0-1), provide reason, and bounding box if applicable.

Important grading rubric:
- 1.0: Perfect shot type consistency - it's unmistakenly the requested shot type. The composition related to all elements of the shot os perfect.
- 0.9-1: It's clearly the requested shot type, the the composition of the elements is not perfect
- 0.8-0.9: I's the requested shot type, but there are noticeable errors in the composition of elements;
- 0.5-0.7: Wrong shot type or major inconsistencies in the composition,
- 0.1-0.4: Major visual drift - significant inconsistencies
- 0.0: Complete inconsistency - unrecognizable shot type or description

Rate style consistency across:
- composition 
- framing
- shot type

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
\nEvaluate how closely this image matches this shot type ${shotType} and the description ${description}` },
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
      const json = safeParseJSON(res.choices[0].message.content || "{}");
      return {
        style: json
      };
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
});
