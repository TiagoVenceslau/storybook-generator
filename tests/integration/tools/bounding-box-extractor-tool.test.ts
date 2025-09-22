import dotev from "dotenv";
dotev.config();
import { setTestFsBasePath } from "../mastra";
import { BoundingBoxExtractorTool } from "../../../src/mastra/tools/bbox.extractor.tool";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import { ImageApi } from "../../../src/ImageApi";
import fs from "fs";

setTestFsBasePath()

const tool = BoundingBoxExtractorTool;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  const score = AliceDefaultCharacterCreationStepOutput;
  const img = Buffer.from(fs.readFileSync(score.images[0].imageUrl))
  it("should run identify the face", async () => {

    const input = {
      image: img,
      description: "the character's face"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`Face mask is in ${faceMask.maskPath}`)
  })


  it("should run identify the right hand", async () => {

    const input = {
      image: img,
      description: "the character's right hand"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`right hand mask is in ${faceMask.maskPath}`)
  })

  it("should run identify both feet", async () => {

    const input = {
      image: img,
      description: "the character's both feet"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`both feet mask is in ${faceMask.maskPath}`)
  })

  it("should run identify the nose", async () => {

    const input = {
      image: img,
      description: "the character's nose"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`nose mask is in ${faceMask.maskPath}`)
  })

  it("should run identify the neck", async () => {

    const input = {
      image: img,
      description: "the character's neck"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`neck mask is in ${faceMask.maskPath}`)
  })

  it("should run identify the tie", async () => {

    const input = {
      image: img,
      description: "the tie"
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
    const faceMask = await ImageApi.mask(score.images[0].imageUrl, result);
    console.log(`tie mask is in ${faceMask.maskPath}`)
  })

});