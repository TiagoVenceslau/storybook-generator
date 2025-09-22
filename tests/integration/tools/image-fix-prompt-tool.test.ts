import dotev from "dotenv";
dotev.config();
import { AliceCharacterEnrichmentStepOutput } from "../outputs/character-enrichment-step.output";
import { setTestFsBasePath } from "../mastra";
import { ImageFixPromptTool } from "../../../src/mastra/tools/image.fix.prompt.tool";
import { CharacterEvaluationToolOutput } from "../outputs/character-evaluation-tool.output";

setTestFsBasePath()

const tool = ImageFixPromptTool;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  it("should run", async () => {

    const score = CharacterEvaluationToolOutput;

    const input = {
      score: score.facial.reasons[0]
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
  })
});