import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { Storyboard } from "./payloads";
import { createCharacterSheetWorkflow } from "./character-sheet-creation.workflow";

export const ComicBookCreatorWorkflow = createWorkflow({
  id: 'comic-book-generation-workflow',
  description: 'Complete pipeline from character idea and style, including character refinement for failed evals',
  inputSchema: z.object({
    storyboard: Storyboard.describe('Visual storyboard with scenes and character descriptions'),
    style: z.string(),
  }),
  outputSchema: z.object({
    imagePath: z.string().describe("the file path for the image file")
  }),
  steps: [],
}).map(async ({inputData, mastra, runtimeContext}) => {
  const {style} = inputData;
  return inputData.storyboard.characters.map((character) => Object.assign({}, character, {
    style: style,
  }))
}).foreach(createCharacterSheetWorkflow)
.map(async ({inputData, getInitData, getStepResult}) => {
  const {storyboard, style} = getInitData();
  const {locations} = storyboard;
  return locations.map((location: any) => Object.assign({}, location, {
    style: style
  }))
})