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
import { ImageApi } from "../../../src/ImageApi";

setTestFsBasePath()

const tool = CharacterConsistencyScorer;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  let defects: any;

  const character = AliceCharacterEnrichmentStepOutput
  const image = AliceDefaultCharacterCreationStepOutput;

  it("should run", async () => {

    const input = {
      description: character.description,
      characteristics: character.characteristics,
      situational: character.situational,
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
    defects = result;
  })
  it("should extract  valid bounding boxes", async () => {

    for (const key in defects) {
      let defect = defects[key as keyof typeof defects];
      if (!defect.reasons) continue;
      for (const reason of defect.reasons) {
        const {maskPath} =  await ImageApi.mask(image.images[0].imageUrl, reason.bbox)
      }
    }
  })
});