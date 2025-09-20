import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { characterEnrichmentStep } from "../../../src/mastra/workflows/character/character-enrichment.step";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { AliceDefault, Character } from "../characters";
import { CharacterEnrichmentAgent } from "../../../src/mastra/agents/character.enrichment.agent";
import { characterCreationStep } from "../../../src/mastra/workflows/character/character-creation.step";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";

const step = characterCreationStep;
const stepName = characterCreationStep.id;

const includeScoring = false
setTestFsBasePath()
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
      // characterEnrichmentAgent: CharacterEnrichmentAgent,
    })
    expect(mastra).toBeDefined();
  })

  beforeEach(async () => {
    run = await wf.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});
  })

  it(`should run ${stepName}`, async () => {

    const input = Object.assign({}, AliceCharacterEnrichmentStepOutput, {
      project: stepName,
      name: stepName,
      model: "gpt-image-1",
      numImages: 1,
      evaluationThreshold: 0.90,
      pose: "FULL BODY frontal (head and toes must me in the frame). provocative",
      style: "Dark detective like color graphic novel"
    })

    const response = await run.start({
      inputData: input,
    })

    expect(response.status).toBe("success")
    const steps = response.steps
    const result = (steps[step.id] as any).output;

    expect(result).toBeDefined();
  })
})