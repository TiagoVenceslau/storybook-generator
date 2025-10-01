import dotev from "dotenv";
dotev.config();

import { OpenAIImageFormats, OpenAIImageQuality, OpenAIImageSize } from "../../../src/mastra/constants";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { Mastra, Run } from "@mastra/core";
import { createCharacterSheetWorkflow } from "../../../src/mastra/workflows/character-sheet-creation.workflow";
import { AliceDefault } from "../characters";
import {
  createEditCharacterImageWorkflow
} from "../../../src/mastra/workflows/character/create-edit-character-image.workflow";

setTestFsBasePath()

const includeScoring = false

jest.setTimeout(3000000)

const fixThreshold: number = 0.95;
const regenThreshold: number =  0.70;

describe("Create edit character workflow", () => {
  let workflow = createCharacterSheetWorkflow;
  let mastra: Mastra;
  let run: Run

  beforeAll(() => {
    mastra = getMastraForTest(`createCharacterSheetWorkflow test`, {createCharacterSheetWorkflow: workflow,  [createEditCharacterImageWorkflow.id]: createEditCharacterImageWorkflow}, {

    })
    expect(mastra).toBeDefined();
  })

  beforeEach(() => {
  });


  const character = AliceDefault


  let score: number;

  it(`should create Alice Character`, async () => {

    run = await workflow.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});

    const result: any = await run.start({
      inputData: {
        project: workflow.id,
        style: `dark detective comic book style. with pure white backgrounds and natural lighting`,
        character: Object.assign({}, character, {
          role: "protagonist"
        }),
        size: OpenAIImageSize.x1024x1792,
        quality: OpenAIImageQuality.medium,
        format: OpenAIImageFormats.png,
        fixThreshold: fixThreshold,
        regenThreshold: regenThreshold,
        maxIterations: 5
      },
    });
    expect(result.status).toEqual("success");

    expect(result).toBeDefined();
    expect(result.result.images).toBeDefined();
    expect(result.result.totalImages).toEqual(1);
    expect(result.result.action).toEqual("fix");
    expect(result.result.fixes).toBeDefined();
    score = result.result.score;
    console.log(`Creation score: ${score}`)
  })

});