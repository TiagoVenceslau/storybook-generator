import { Features, ModelSwitch } from "./model-switch";
import 'dotenv/config'; // Load .env early
import fs from 'node:fs';
import path from 'node:path';

import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { scriptGeneratorAgent } from './agents/script-generator-agent';
import { storyboardAgent } from './agents/storyboard-agent';
import { imageGeneratorAgent } from './agents/image-generator-agent';
import { exportAgent } from './agents/export-agent';
import { storyboardNetwork, storyboardNetworkLegacy } from './agentnetwork/agent-network';
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { automatedAgentNetworkWorkflow } from "./workflows/agent-network-automated-workflow";

ModelSwitch.register(Features.NETWORK, "openai", "gpt-5", openai)
ModelSwitch.register(Features.NETWORK, "google", "gemini-2.5-flash", google)
ModelSwitch.register(Features.SCRIPT_GEN, "openai", "gpt-5", openai)
ModelSwitch.register(Features.SCRIPT_GEN, "google", "gemini-2.5-flash", google)
ModelSwitch.register(Features.STORYBOARD_GEN, "openai", "gpt-5", openai)
ModelSwitch.register(Features.STORYBOARD_GEN, "google", "gemini-2.5-flash", google)
ModelSwitch.register(Features.IMAGE_GEN, "openai", "gpt-5", openai)
ModelSwitch.register(Features.IMAGE_GEN, "google", "gemini-2.5-flash", google)
ModelSwitch.register(Features.EXPORT, "openai", "gpt-5", openai)
ModelSwitch.register(Features.EXPORT, "google", "gemini-2.5-flash", google)
ModelSwitch.register(Features.VISUAL_GEN, "openai", "gpt-image-1", openai)
ModelSwitch.register(Features.VISUAL_GEN, "google", "imagen-3.0-generate-002", google)
ModelSwitch.register(Features.EVAL_CONSISTENCY, "openai", "gpt-4o", openai)
ModelSwitch.register(Features.EVAL_CONSISTENCY, "google", "gemini-2.5-flash", google)

console.log(`API key for OpenAI: ${process.env["OPENAI_API_KEY"] ? 'set' : 'not set'}`);

// Create shared storage for all memory instances
const sharedStorage = new LibSQLStore({
  url: "file:mastra-memory.db", // Back to original
});

export const mastra = new Mastra({
  agents: {
    scriptGeneratorAgent: scriptGeneratorAgent(),
    storyboardAgent: storyboardAgent(),
    imageGeneratorAgent: imageGeneratorAgent(),
    exportAgent: exportAgent(),
  },
  networks: {
    storyboardNetworkLegacy: storyboardNetworkLegacy(),
  },
  vnext_networks: {
    storyboardNetwork: storyboardNetwork(),
  },
  workflows: {
    automatedAgentNetworkWorkflow,
  },
  server: {
    host: "localhost",
    port: 8080,
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    }
  },
  bundler: {
    sourcemap: true,
  },
  storage: sharedStorage, // Enable shared storage for memory
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

// Export convenience functions from agent-network
export {
  generateCompleteStoryboard,
  generateScript,
  createStoryboard,
  generateStoryboardImages,
  exportStoryboard,
  storyIdeaToPDF,
  scriptToPDF,
  generateCompleteStoryboardSync,
  storyIdeaToPDFSync,
  scriptToPDFSync,
  streamScriptGeneration,
  streamStoryboardCreation,
  streamImageGeneration,
  streamPDFExport,
} from './agentnetwork/agent-network';

// Export schemas for type safety
export * from './schemas/script-schema';
export * from './schemas/storyboard-schema';
export * from './schemas/export-schema';

// Export memory configuration
export * from './memory-config';




// Export evals
export * from './evals';
export * from './evals/storyboard-evals';
export * from './evals/script-evals';
