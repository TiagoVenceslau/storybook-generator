import { Tool, ToolExecutionContext } from "@mastra/core/tools";
import OpenAI from "openai";
import {z} from "zod"



const client = new OpenAI();

export const CharacterEnrichmentTool = new Tool({
  id: "character-enrichment-tool",
  description: "Enriches a character's description, defining physical characteristics and situational physical characteristics for ease of recognition and for adherence to a specific style of graphical art",
  inputSchema: z.object({
    description: z.string().describe("the overall textual description of the character"),
    characteristics: z.array(z.string()).describe("a list of the character's defining physical characteristics, eg: color of eyes, body type, height, scars, tattoos, etc"),
    situational: z.array(z.string()).describe("a list of the character's defining physical characteristics, eg: dressed in a blue dress, holding a briefcase in this right hand"),
    style: z.string().optional().describe("The graphical style to adapt the enrichment to"),
    mood: z.string().optional().describe("The overall mood of the scene"),
  }),
  outputSchema: undefined,
  execute: async ({context}) => {
    const { description, characteristics, situational, mood, style } = context;
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `You are a character description enrichment agent. You are an expert at evaluating descriptions of characters, their defining physical features and situational physical features, 
          and enriching each of those, for added detail and depth of the characters, overall recognition between scenes and dramatic effect.
          You always considerer the style and mood when provided, to adapt you enrichment, making sure you adhere to its elements, and usual themes.
          
          You expect the user to provide you with (mandatory):
          - description: the overall textual description of the character;
          - characteristic: a list of the character's defining physical characteristics, eg: color of eyes, body type, height, scars, tattoos, etc;
          - situational: a list of the character's defining physical characteristics, eg: dressed in a blue dress, holding a briefcase in this right hand;
          
          You can optionally receive:
          - style: The graphical style to adapt the enrichment to;
          - mood: The overall mood of the scene;
          
          If you lack any mandatory parameter, ask the user for it
          If asked to proceed immediately, and all mandatory parameters are given, ask no more questions and enrich the character.
          When the situational features no not include clothing, add nightgown for human female characters or boxer shorts for human male characters.
          
          Return format:
          
          {
            "description": // enriched overall description,
            "characteristics": [
              // enriched list of the character's defining physical characteristics
            ],
            situational: [
              // enriched list of the characters situational features
            ]
          }`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `            
## description
${description}

## characteristics:
${characteristics.join(";\n")}

## situational
${situational && situational.length ? `## situational\n${situational.join("\n")}` : ""}

${style ? `## style\n${style}`: ""}

${mood ? `## mood\n${mood}`: ""}
`},
          ],
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    return parsed;
  }
});
