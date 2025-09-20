import dotev from "dotenv";
dotev.config();
import z from "zod";
import { characterImageGenerationTool } from "../../../src/mastra/tools/character.creation.tool";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { setTestFsBasePath } from "../mastra";

setTestFsBasePath()

const tool = characterImageGenerationTool;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  it("should run", async () => {

    const character = AliceCharacterEnrichmentStepOutput

    const input: z.infer<typeof tool.inputSchema> = {
      project: toolName,
      name: toolName,
      model: "gpt-image-1",
      description: character.description,
      characteristics: character.characteristics,
      situational: character.situational,
      numImages: 1,
      pose: "full body frontal. provocative",
      style: "Dark detective like graphic novel",
      aspectRatio: "4:3",
    }
    let result: z.infer<typeof tool.outputSchema>

    result = await tool.execute({context: input} as any);

    expect(result).toBeDefined();
    expect(result.images).toBeDefined();
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]).toBeDefined();
    expect(result.images[0].imageUrl).toBeDefined();
  })
});