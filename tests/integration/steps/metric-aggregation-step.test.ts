import dotev from "dotenv";
dotev.config();
import { Mastra, Run, Workflow } from "@mastra/core";
import { createWorkflow } from "@mastra/core/workflows";
import { getMastraForTest, setTestFsBasePath } from "../mastra";
import { AliceDefault, Character } from "../characters";
import { metricAggregationStep } from "../../../src/mastra/workflows/character/metric-aggregation.step";
import { z } from "zod";
import { CharacterEvaluationToolOutput } from "../outputs/character-evaluation-tool.output";
import { PoseEvaluationToolOutput } from "../outputs/pose-evaluation-tool.output";
import { StyleEvaluationToolOutput } from "../outputs/style-evaluation-tool.output";

setTestFsBasePath()

const step = metricAggregationStep;
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
    const input: z.infer<typeof step.inputSchema> = {
      metrics: [CharacterEvaluationToolOutput, PoseEvaluationToolOutput, StyleEvaluationToolOutput] as any[],
      regenThreshold: 0.7,
      fixThreshold: 0.9
    }
    const response = await run.start({
      inputData: input,
    })

    expect(response.status).toBe("success")
    const steps = response.steps
    const result = (steps[step.id] as any).output;

    expect(result).toBeDefined();
  })
})