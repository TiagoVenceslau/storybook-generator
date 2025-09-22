import dotev from "dotenv";
dotev.config();
import { setTestFsBasePath } from "../mastra";
import { ImageEditTool } from "../../../src/mastra/tools/image.edit.tool";
import { ImageFixPromptImageOutput } from "../outputs/image-fix-prompt-image.output";
import { AliceDefaultCharacterCreationStepOutput } from "../outputs/character-creation-step.output";
import { ImageFixMaskImageOutput } from "../outputs/image-fix-mask-image.output";

setTestFsBasePath()

const tool = ImageEditTool;

jest.setTimeout(200000)

const toolName = tool.id;

describe(toolName, () => {

  it("should run", async () => {

    const alice = AliceDefaultCharacterCreationStepOutput
    const prompt = ImageFixPromptImageOutput;
    const mask = ImageFixMaskImageOutput
    const imageFilePath = alice.images[0].imageUrl;
    const input = {
      prompt: prompt.prompt,
      imagePath: imageFilePath,
      maskImage: mask.maskPath,
      references: [],
    }

    const result = await (tool.execute as any)({context: input} as any);

    expect(result).toBeDefined();
  })
});