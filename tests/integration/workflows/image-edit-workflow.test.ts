import dotev from "dotenv";
dotev.config();
import { ImageEditWorkflow } from "../../../src/mastra/workflows/image/image-edit.workflow";
import { CharacterConsistencyScorer } from "../../../src/mastra/tools/scoring.character.consistency.tool";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import fs from "fs";
import z from "zod";
import { Score } from "../../../src/mastra/tools/types";
import { OpenAIImageFormats } from "../../../src/mastra/constants";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { Mastra, Run } from "@mastra/core";

setTestFsBasePath()

const includeScoring = false

jest.setTimeout(300000)

describe("ImageEditWorkflow", () => {
  let workflow = ImageEditWorkflow;
  let mastra: Mastra;
  let run: Run

  beforeAll(() => {
    mastra = getMastraForTest(`ImageEditWorkflow test`, {imageEditWorkflow: workflow}, {

    })
    expect(mastra).toBeDefined();
  })

  beforeEach(() => {
  });


  const tool = CharacterConsistencyScorer;

  const toolName = tool.id;

  const character = AliceCharacterEnrichmentStepOutput
  const image = AliceDefaultCharacterCreationStepOutput;

  let defect: any

  it(`should evaluate character with ${toolName}`, async () => {

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
    } as any)) as any;

    expect(result).toBeDefined();
    defect = (result as any);
  })

  it("should process image edits successfully", async () => {

    const fixes = Object.entries(defect).map(([k, def]) => {
      return (def as any).reasons
    }).filter(r => !!r).flat()
    run = await workflow.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});

    const result = await run.start({
      inputData: {
        project: workflow.id,
        style: image.style,
        mood: "",
        pose: image.pose,
        imagePath: image.images[0].imageUrl,
        quality: image.images[0].metadata.quality,
        format: "jpeg",
        description: character.description,
        characteristics: character.characteristics,
        situational: character.situational,
        model: image.images[0].metadata.model,
        fixes: fixes,
        references: [],
      },
    });

    expect(result).toBeDefined();
  });
});