
jest.setTimeout(100000);

import { generateScript } from "../../src/mastra";

const input = {
  "storyIdea": "Harry, a little blue eyed boy, capable of talking to animals for some magic reason\n     and dressed in a shirt and overalls goes walking though the the lush woods.\n     On his shoulder goes his friend Luna, an unusually large blue spotted raven.\n     As they're walking, they see a pink rabbit try to pick up a carrot, buried in the ground.\n     That carrot turns out to be a Mole's tail,  and while she is initially shocked, they all laugh and become friends",
  "style": "Coloring Book",
  "title": "Even a mistake can make a friend",
  "genre": "child",
  "tone": "playful, cheerful"
}

describe("Script generation", () => {
  it("should generate a script", async () => {

    const result = await generateScript(input.storyIdea, input);
    expect(result).toBeDefined();

  })
});