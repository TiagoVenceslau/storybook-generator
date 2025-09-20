import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { AliceDefault } from "../characters";

setTestFsBasePath()

import { characterEvaluationStep } from "../../../src/mastra/workflows/character/character-evaluation.step";
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";

const step = characterEvaluationStep;
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
  });

  ["character", "pose", "style"].forEach((metric: string) => {
    it(`should run ${metric} metric ${stepName}`, async () => {

      const character = AliceCharacterEnrichmentStepOutput
      const image = AliceDefaultCharacterCreationStepOutput;

      const response = await run.start({
        inputData: Object.assign({}, AliceDefault, {
          project: stepName,
          metric: metric,
          imageUrl: image.images[0].imageUrl,
          description: character.description,
          characteristics: character.characteristics,
          situational: character.situational,
          pose: image.pose,
          mood: "",
          threshold: 0.9,
          style: image.style,
        }),
      })

      expect(response.status).toBe("success")
      const steps = response.steps
      const result = (steps[step.id] as any).output;

      expect(result).toBeDefined();

    })
  })
})