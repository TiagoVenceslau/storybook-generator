import dotev from "dotenv";
dotev.config();
import z from "zod";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { setTestFsBasePath } from "../mastra";
import { OpenAIImageFormats } from "../../../src/mastra/constants";
import { CharacterConsistencyScorer } from "../../../src/mastra/tools/scoring.character.consistency.tool";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import { Score } from "../../../src/mastra/tools/types";
import fs from "fs";
import { PoseConsistencyScorer } from "../../../src/mastra/tools/scoring.pose.consistency.tool";

setTestFsBasePath()

const tool = PoseConsistencyScorer;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  it("should run", async () => {

    const character = AliceCharacterEnrichmentStepOutput
    const image = AliceDefaultCharacterCreationStepOutput;

    const input = {
      pose: image.pose,
      format: OpenAIImageFormats.jpeg as any,
      threshold: 0.90,
    }

    const buffer = fs.readFileSync(image.images[0].imageUrl);

    const result: Record<string, z.infer<typeof Score>> = await ((tool as any).execute({
      context: Object.assign({}, input, {
        image: buffer,
      })
    } as any));

    expect(result).toBeDefined();
  })
});