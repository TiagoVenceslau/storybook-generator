import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import { ImageFixDefectStep } from "../../../src/mastra/workflows/image/image-fix-defect.step";
import { CharacterConsistencyScorer } from "../../../src/mastra/tools/scoring.character.consistency.tool";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { OpenAIImageFormats } from "../../../src/mastra/constants";
import fs from "fs";
import z from "zod";
import { Score } from "../../../src/mastra/tools/types";
import { ImageFixPromptTool } from "../../../src/mastra/tools/image.fix.prompt.tool";
import { MaskImageTool } from "../../../src/mastra/tools/image.mask.tool";

setTestFsBasePath()

const step = ImageFixDefectStep;
const stepName = step.id;

const includeScoring = false

jest.setTimeout(300000)

describe(`${stepName} test`, () => {
  let mastra: Mastra;
  let wf: Workflow;
  let run: Run;

  beforeAll(() => {
    wf = createWorkflow({
      id: `Test workflow for ${stepName}`,
      inputSchema:  step.inputSchema,
      outputSchema: step.outputSchema,
      steps: [step]
    }).then(step).commit();
    mastra = getMastraForTest(`${stepName} test`, {[`${stepName} test`]: wf}, {
    })
    expect(mastra).toBeDefined();
  })

  beforeEach(async () => {
  })

  const tool = CharacterConsistencyScorer;

  const toolName = tool.id;

  const character = AliceCharacterEnrichmentStepOutput
  const image = AliceDefaultCharacterCreationStepOutput;

  let defect: any
  let prompt: string;
  let mask: string;

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

    defect = ["clothing",  "body", "facial", "hair", "skin", "accessories", "background", "other"].find(key => {
      const n = result[key as keyof typeof result] as any;
      if (!n) return false;
      return n.reasons && n.reasons.length > 0;
    })

    defect = (result as any)[defect as keyof typeof result].reasons[0];
  })

  it ("Should improve prompt for defect", async () => {
    const tool = ImageFixPromptTool;



    const input = {
      score: defect
    }

    const result: {prompt: string}  = await ((tool as any).execute({
      context: Object.assign({}, input, {
      })
    } as any));

    expect(result).toBeDefined();
    prompt = result.prompt;
  })

  it("should mask defect", async () => {
    const tool = MaskImageTool;

    const input = {
      imagePath: image.images[0].imageUrl,
      bbox: defect.bbox,
    }

    const result: {maskPath: string}  = await ((tool as any).execute({
      context: Object.assign({}, input, {
      })
    } as any));

    expect(result).toBeDefined();
    mask = result.maskPath;

  })

  it(`should run ${stepName}`, async () => {
    run = await wf.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});
    const alice = AliceDefaultCharacterCreationStepOutput;

    const response = await run.start({
      inputData: {
        prompt: prompt,
        description: character.description,
        characteristics: character.characteristics,
        situational: character.situational,
        pose: image.pose,
        style: image.style,
        mood: undefined,
        score: defect,
        imagePath: alice.images[0].imageUrl,
        maskImage: mask,
        model: alice.images[0].metadata.model,
        quality: alice.images[0].metadata.quality,
        format: "jpeg",

      }
    })

    expect(response.status).toBe("success")
    const steps = response.steps
    const result = (steps[step.id] as any).output;

    expect(result).toBeDefined();

  })
})