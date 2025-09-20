import dotev from "dotenv";
dotev.config();

import { setTestFsBasePath } from "../mastra";
import { ImageFixPromptAgent } from "../../../src/mastra/agents/image.fix.prompt.agent";
import { CharacterEvaluationToolOutput } from "../outputs/character-evaluation-tool.output";

setTestFsBasePath()

const agent = ImageFixPromptAgent;
const agentName = agent.name;

jest.setTimeout(100000)

describe(`${agentName} test`, () => {
  it("should generates responses", async() => {
    const reasons = CharacterEvaluationToolOutput
    const response = await agent.generate(`
## defects
${Object.entries(reasons)
      .filter(([, val]) => (val as any).reasons && (val as any).reasons.length)
      .map(([key, val]) => `- ${key}:\n${(val as any).reasons
        .map((r: any) => r.reason)}`)}
`);
    expect(response).toBeDefined();
    let result: {prompt: string};
    try {
      result = JSON.parse(response.text);
    } catch (e: unknown) {
      throw new Error(`failed to parse response from ${agentName}: ${e}`)
    }

    expect(result).toBeDefined();
    expect(result.prompt).toBeDefined();
  })
})