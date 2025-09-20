import { Tool, ToolExecutionContext } from "@mastra/core";
import OpenAI from "openai";
import {z} from "zod"
import { Score } from "./types";
import { OpenAIImageFormats } from "../constants";

const client = new OpenAI();

export const PoseConsistencyScorer = new Tool({
  id: "pose-consistency-scoring-tool",
  description: "Scores how consistent a character's pose is across generated images.",
  inputSchema: z.object({
    pose: z.string().describe("the textual description of the character's pose"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).describe("the image format"),
    threshold: z.number().max(1).min(0).default(0.95).describe("The threshold for acceptance"),
    references: z.array(z.instanceof(Buffer)).optional().describe("reference images to evaluate against")
  }),
  outputSchema: z.record(z.string(), Score).describe("a record of all defects and their scores"),
  execute: async ({context}) => {
    const { image, pose, references, format, threshold } = context;
    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an character pose image scoring assistant. You are an expert at evaluating images of characters, 
          evaluating the position they're in and match it against a pose description. You take extra attention to the anatomy of a character to ensure it's correct.

Rate character consistency (0-1), provide reason, and bounding box if applicable.

Important grading rubric:
- 1.0: Perfect visual consistency - it's unmistakenly the same pose,
- 0.9-1: they are clearly the same pose but there are subtle defects
- 0.8-0.9: Minor variations but clearly the same pose
- 0.5-0.7: Noticeable inconsistencies in the pose or anatomy
- 0.1-0.4: Major visual drift - significant inconsistencies
- 0.0: Complete inconsistency - completely difference pose or unrecognizable character

Rate character consistency across:
- body positioning: are all limbs correctly posed for what is expected,
- movement: does the pose express the intended moment or action,
- anatomy correctness

all ratings should be returned as JSON: {
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
  "body": {"score": 0.96}, // near perfect body and limb positioning match but still above ${threshold} so no reasons are necessary
  "movement": {
    "score": 0.81
    "reasons": [{
      "reason": "the character's pose does not express the 'pressed for time walking' action conveniently,
      "bbox": {"x": 34, "y": 56, "h": 235, "w": 89}
    }
  },
  "anatomy": {
    "score": 0.61,
    "reasons": [{
      "reason": "the right hand has extra fingers",
      "bbox": {"x": 34, "y": 56, "h": 235, "w": 89}
    },
    {
      "reason": "there seems to be a third leg",
      "bbox": {"x": 67, "y": 508, "h": 132, "w": 134}
    }]
  }
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `            
## Character Pose description
${pose}

## Image to evaluate
`},
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
