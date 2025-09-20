import dotev from "dotenv";
dotev.config();

import { CharacterEnrichmentAgent } from "../../../src/mastra/agents/character.enrichment.agent";
import { AliceDefault, Character } from "../characters";
import { setTestFsBasePath } from "../mastra";

setTestFsBasePath()

const agentName = "character-enrichment-agent";

jest.setTimeout(100000)

describe(`${agentName} test`, () => {
  it("should generates responses", async() => {
    const alice = AliceDefault;
    const response = await CharacterEnrichmentAgent.generate(`
    ## description
    ${alice.description}
    ## characteristics
    ${alice.characteristics.join(";\n")}
    ## situational
    ${alice.situational.join(";\n")}
    `);

    expect(response).toBeDefined();
    let result: Character;
    try {
      result = Object.assign({}, alice, JSON.parse(response.text)) as Character;
    } catch (e: unknown) {
      throw new Error(`failed to parse response from ${agentName}: ${e}`)
    }

    expect(result).toBeDefined();
    expect(result.name).toEqual(alice.name);
    expect(result.description).not.toEqual(alice.description);
    expect(result.characteristics).not.toEqual(alice.characteristics);
    expect(result.situational).not.toEqual(alice.situational);
  })
})