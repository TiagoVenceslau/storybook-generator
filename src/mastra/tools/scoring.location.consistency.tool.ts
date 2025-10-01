import { Tool } from "@mastra/core/tools";
import OpenAI from "openai";
import z from "zod";
import { Score } from "./types";
import { OpenAIImageFormats } from "../constants";
import { ImageApi } from "../../ImageApi";
import { safeParseJSON } from "../../utils";

const client = new OpenAI();

export const LocationConsistencyScorer = new Tool({
  id: "location-consistency-scorer",
  description: "Scores how consistent the generated location image is against it's description",
  inputSchema: z.object({
    threshold: z.number().max(1).min(0).default(0.95).describe("the threshold for acceptance"),
    description: z.string().describe("A description of the location"),
    characteristics: z.array(z.string()).describe("a list of defining characteristics"),
    situational: z.array(z.string()).describe("a list of situational characteristics"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).describe("the image format"),
    references: z.array(z.instanceof(Buffer)).optional().describe("reference images to evaluate against")
  }),
  outputSchema: z.object({
      style: Score
  }),
  execute: async ({context}) => {
    const { image, description, characteristics, situational, references, threshold, format } = context;
    const {oriented, W, H } = await ImageApi.sizeAndOrientation(image)

    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are an image consistency scoring assistant. You are an expert at evaluating the adherence of and image to it's description,
but also against reference images and identify inconsistencies.
You are a specialist in, when a defect is found, extract a minimal bounding box (bbox) around the defect for later edit.
IT MUST COMPLETELY COVER THE DEFECT.

Bounding box format: xywh, top-left origin, y-down.

Rate character consistency (0-1), provide reason, and bounding box if applicable.

Important grading rubric:
- 1.0: Perfect description consistency - all elements described are perfectly evident in the image;
- 0.9-1: the image and description clearly match, but there are small inconsistencies;
- 0.8-0.9: the image and descriptions match, but characteristics or situational characteristics  are missing;
- 0.5-0.7: Noticeable inconsistencies between the image and the description,
- 0.1-0.4: Major visual drift - significant inconsistencies
- 0.0: Complete inconsistency - unrecognizable match images or description

Rate style consistency across:
- description
- characteristics
- situational

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
    "reason": "the image does not match the description because...",
    "bbox": // bounding box for the whole image 
  },
  {
    "reason": "there is an element missing",
    "bbox": // bounding box for the specific defect's location
  }]
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `## Image to evaluate (height: ${H}px, width: ${W}px
\nEvaluate how closely this matches:
 - the description: ${description};
 - the defining characteristics: ${characteristics}
 - the situational characteristics: ${situational}` },
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
