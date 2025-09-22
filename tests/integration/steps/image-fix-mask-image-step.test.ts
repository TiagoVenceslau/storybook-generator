import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { characterEnrichmentStep } from "../../../src/mastra/workflows/character/character-enrichment.step";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { AliceDefault } from "../characters";
import { CharacterEnrichmentAgent } from "../../../src/mastra/agents/character.enrichment.agent";
import { ImageFixMaskImageStep } from "../../../src/mastra/workflows/image/image-fix-mask-image.step";
import { CharacterEvaluationToolOutput } from "../outputs/character-evaluation-tool.output";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";

setTestFsBasePath()

const step = ImageFixMaskImageStep;
const stepName = step.id;

const includeScoring = false

jest.setTimeout(100000)

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
    run = await wf.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});
  })

  it(`should run ${stepName}`, async () => {
    const defects = CharacterEvaluationToolOutput;
    const alice = AliceDefaultCharacterCreationStepOutput;

    const response = await run.start({
      inputData: {
        score: defects.facial.reasons[0],
        imagePath: alice.images[0].imageUrl,
      }
    })

    expect(response.status).toBe("success")
    const steps = response.steps
    const result = (steps[step.id] as any).output;

    expect(result).toBeDefined();
    expect(result.maskPath).toBeDefined();

  })
})