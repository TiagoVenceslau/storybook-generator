import { Tool, ToolExecutionContext } from "@mastra/core/tools";
import OpenAI from "openai";
import {z} from "zod"
import { OpenAIImageFormats } from "../constants";
import { Score } from "./types";

const client = new OpenAI();

export const CharacterConsistencyScorer = new Tool({
  id: "character-consistency-scoring-tool",
  description: "Scores how consistent a character is across generated images.",
  inputSchema: z.object({
    description: z.string().describe("the textual description of the character"),
    characteristics: z.array(z.string()).optional().describe("the defining physical characteristics of a character"),
    situational: z.array(z.string()).optional().describe("the situational physical characteristics of a character"),
    image: z.instanceof(Buffer).describe("The buffer for the image to be scored"),
    format: z.enum(Object.values(OpenAIImageFormats) as any).describe("the image format"),
    threshold: z.number().max(1).min(0).default(0.95).describe("The threshold for acceptance"),
    references: z.array(z.instanceof(Buffer)).optional().describe("reference images to evaluate against")
  }),
  outputSchema: z.record(z.string(), Score).describe("a record of all defects and their scores"),
  execute: async ({context}) => {
    const { image, description, characteristics, situational, references, format, threshold } = context;
    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an character image scoring assistant. You are an expert at evaluating images of characters, 
and match them against their physical description. You take extra attention to a character's defining physical features and
to the correct anatomy of a character.
You are also capable of evaluating against reference images of the character and identify missed/incorrect features.
You recognize when specific features are hidden from view due to the perspective, shot type or character position and ignore then in your evaluation.

When you find missing physical features, you check again to see if it's a matter of perspective, framing, or lighting. If so, ignore it.

Rate character consistency (0-1), provide reason, and bounding box if applicable.

Important grading rubric:
- 1.0: Perfect visual consistency - it's unmistakenly the same character. All the visible features clearly belong to the character and are well placed.,
- 0.9-1: they are clearly the same character but there are subtle differences
- 0.8-0.9: Minor variations but clearly the same characters
- 0.5-0.7: Noticeable inconsistencies in some features
- 0.1-0.4: Major visual drift - significant inconsistencies
- 0.0: Complete inconsistency - unrecognizable between images

Rate character consistency across:
- facial features (eys, nose, mouth, face, shape),
- hair (color, style, length),
- clothing/attire (colors, style, accessories),
- body type and proportions,
- distinctive marks or features,

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

respond with JSON only! never include any markdown format!

### Example output (if the threshold was 0.95):
{
  "facial": {"score": 1}, // perfect facial match
  "hair": {"score": 0.96}, // near perfect hair match but still above the example threshold of 0.95 so no reasons are necessary
  "clothing": {
    "score": 0.86,
    "reasons": [{
      "reason": "the tie should be blue, not black",
      "bbox": {"x": 34, "y": 56, "h": 235, "w": 89}
    },
    {
      "reason": "the should are not formal shoes.",
      "bbox": {"x": 67, "y": 508, "h": 132, "w": 134}
    }]
  },
  "body": {
    "score": 0.82,
    "reasons": [{
      "reason": "the right hand has 6 fingers instead of 5",
      "bbox": {"x": 67, "y": 304, "h": 50, "w": 89}
    }]
  },
  "features": {
    "score": 0.78,
    "reasons": [{
      "reason": "character is not holding a gun in the right hand",
      "bbox": {"x": 204, "y": 286, "h": 40, "w": 79}
    }]
  }
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `            
## Character description
${description}

${characteristics && characteristics.length ? `## Defining physical characteristics\n${characteristics.join(";\n")}` : ""}

${situational && situational.length ? `## Situational physical characteristics\n${situational.join(";\n")}` : ""}

## Image to evaluate

`},
    // @ts-ignore
            { type: "image_url", image_url: {url: `data:image/${format};base64,` + image.toString("base64") }},
            ...(references  && references.length ? [
              {type: "text", text: "\n## References images\n"},
              ...references.map((r,i) => {
                return [
                  {type: "text", text: `\n### reference image ${i}\n`},
    // @ts-ignore
                  { type: "image_url", image_url: {url: `data:image/${format};base64,` + r.toString("base64") }},
                ]
              }).flat()
            ] : [])
          ],
        },
      ],
      temperature: 0.2
    } as any);
    try  {
      const json = JSON.parse(res.choices[0].message.content || "{}");
      return json;
    } catch (e: unknown) {
      throw new Error("Unable to deserialize response")
    }
  }
});
