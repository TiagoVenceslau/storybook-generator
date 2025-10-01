import dotev from "dotenv";
dotev.config();
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import { OpenAIImageFormats } from "../../../src/mastra/constants";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { Mastra, Run } from "@mastra/core";
import {
  createEditCharacterImageWorkflow
} from "../../../src/mastra/workflows/character/create-edit-character-image.workflow";

setTestFsBasePath()

const includeScoring = false

jest.setTimeout(300000)

const fixThreshold: number = 0.95;
const regenThreshold: number =  0.70;

describe("Create edit character workflow", () => {
  let workflow = createEditCharacterImageWorkflow;
  let mastra: Mastra;
  let run: Run

  beforeAll(() => {
    mastra = getMastraForTest(`createEditCharacterImageWorkflow test`, {createEditCharacterImageWorkflow: workflow}, {

    })
    expect(mastra).toBeDefined();
  })

  beforeEach(() => {
  });


  const character = AliceCharacterEnrichmentStepOutput
  const image = AliceDefaultCharacterCreationStepOutput;

  let fixes: any[]
  let resultImage: string;

  let score: number;

  it(`should create Alice Character`, async () => {

    run = await workflow.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});

    const result: any = await run.start({
      inputData: {
        project: workflow.id,
        name: "Alice",
        style: image.style,
        mood: "",
        pose: image.pose,
        quality: image.images[0].metadata.quality,
        format: OpenAIImageFormats.jpeg,
        description: character.description,
        characteristics: character.characteristics,
        situational: character.situational,
        model: image.images[0].metadata.model,
        references: [],
        fixThreshold: fixThreshold,
        regenThreshold: regenThreshold,
        action: "create"
      },
    });
    expect(result.status).toEqual("success");

    expect(result).toBeDefined();
    expect(result.result.images).toBeDefined();
    expect(result.result.totalImages).toEqual(1);
    expect(result.result.action).toEqual("fix");
    expect(result.result.fixes).toBeDefined();
    fixes = result.result.fixes as any;
    resultImage = result.result.images[0].imageUrl;
    score = result.result.score;
    console.log(`Creation score: ${score}`)
  })

  it("should process image edits successfully", async () => {

    run = await workflow.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});

    const result: any = await run.start({
      inputData: {
        project: workflow.id,
        name: "Alice",
        style: image.style,
        mood: "",
        pose: image.pose,
        imagePath: resultImage,
        quality: image.images[0].metadata.quality,
        format: OpenAIImageFormats.jpeg,
        description: character.description,
        characteristics: character.characteristics,
        situational: character.situational,
        model: image.images[0].metadata.model,
        references: [],
        fixThreshold: fixThreshold,
        regenThreshold: regenThreshold,
        action: "edit",
        fixes: fixes
      },
    });

    expect(result).toBeDefined();
    expect(result.status).toEqual("success");
    expect(result.result.images).toBeDefined();
    expect(result.result.totalImages).toEqual(1);
    // expect(result.result.action).toEqual("fix");
    expect(result.result.fixes).toBeDefined();
    const editScore = result.result.score;

    console.log(`edit score: ${editScore} vs ${score}`)
    expect(editScore).toBeGreaterThan(score);
  });
});