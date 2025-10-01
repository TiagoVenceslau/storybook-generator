import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { GenerateTextResult } from "@mastra/core";
import { CharacterEnrichmentAgent } from "../../agents/character.enrichment.agent";

export const locationEnrichmentStep  = createStep({
  id: "character-enrichment-step",
  description: "enrich a character's description to better suit the style, recognition across images and dramatic effect",
  inputSchema: z.object({
    style: z.string().optional().describe('Visual style for image generation'),
    description: z.string().describe("the location's overall description"),
    characteristics: z.array(z.string()).optional().describe("a list of defining characteristics"),
    situational: z.array(z.string()).optional().describe("a list of situational characteristics"),
  }),
  outputSchema: z.object({
    description: z.string().describe("the location's overall description"),
    characteristics: z.array(z.string()).optional().describe("a list of defining characteristics"),
    situational: z.array(z.string()).optional().describe("a list of situational characteristics"),
  }),
  execute: async ({inputData, mastra}) => {
    const {style, description, characteristics, situational} = inputData;
    const agent = CharacterEnrichmentAgent;
    let result: GenerateTextResult<any>;
    try {
      result = await agent.generate(`         
## description
${description}

${characteristics ? `## characteristics\n${characteristics.map(c => `- ${c}`).join("\n")}`: ""}

${situational ? `## characteristics\n${situational.map(c => `- ${c}`).join("\n")}`: ""}

${style ? `## style\n${style}`: ""}

respond immediately`) as any
    } catch (e: unknown) {
      throw new Error(`Failed call to CharacterEnrichment agent: ${e}`)
    }

    const {usage, text} = result;

    console.log(`Character enrichment step took ${usage.promptTokens} prompt tokens, ${usage.completionTokens}, completion tokens, for a total of ${usage.totalTokens}`)
    let json: {description: string, characteristics: string[], situational: string[]};
    try {
      json = JSON.parse(text)
    } catch (e: unknown) {
      throw new Error(`Failed to deserialize response: ${text}`);
    }

    return json;
  }
})
