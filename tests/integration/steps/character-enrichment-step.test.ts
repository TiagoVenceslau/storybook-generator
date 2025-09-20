import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { characterEnrichmentStep } from "../../../src/mastra/workflows/character/character-enrichment.step";
import { getMastraForTest } from "../mastra";
import { AliceDefault, Character } from "../characters";
import { CharacterEnrichmentAgent } from "../../../src/mastra/agents/character.enrichment.agent";

const stepName = "character-enrichment-step";
const step = characterEnrichmentStep;

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
      characterEnrichmentAgent: CharacterEnrichmentAgent,
    })
    expect(mastra).toBeDefined();
  })

  beforeEach(async () => {
    run = await wf.createRunAsync({runId: expect.getState().currentTestName, disableScorers: !!(includeScoring)});
  })

  it(`should run ${stepName}`, async () => {
    const response = await run.start({
      inputData: Object.assign({}, AliceDefault, {
        style: "Dark detective like graphic novel"
      }),
    })

    expect(response.status).toBe("success")
    const steps = response.steps
    const result = (steps[step.id] as any).output;

    expect(result).toBeDefined();
    expect(result.description).not.toEqual(AliceDefault.description);
    expect(result.characteristics).not.toEqual(AliceDefault.characteristics);
    expect(result.situational).not.toEqual(AliceDefault.situational);
  })
})