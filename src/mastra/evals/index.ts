import { storyboardSpecificEvals } from './storyboard-evals';
import { scriptSpecificEvals } from './script-evals';
import { imageSpecificEvals } from './image-evals';

export { evaluateCharacterConsistency, evaluateStoryboardCharacterConsistency } from './character-consistency-eval';

export const evals = {
  // Storyboard-specific evaluations
  ...storyboardSpecificEvals,
  // Script-specific evaluations
  ...scriptSpecificEvals,
  // Image-specific evaluations
  ...imageSpecificEvals,
};

// Export individual evals for convenience
export const {
  // Storyboard evals
  structure,
  visualPromptQuality,
  storyContentCompleteness,
  characterConsistency,
  narrativeFlow,
  // Image evals
  imageCharacterConsistencyLLM,
  // Script evals
  dialogueQuality,
  characterDevelopment,
  plotCoherence,
  genreAlignment,
} = evals;

// Export the main evals object as default
export default evals;