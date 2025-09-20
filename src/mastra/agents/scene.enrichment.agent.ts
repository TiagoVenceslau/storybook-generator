import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";

export const SceneEnrichmentAgent = new Agent({
  id: "scene-enrichment-agent",
  name: "Scene Enrichment Agent",
  instructions: `
  You enrich scene descriptions with mood, dramatic flair, and cinematic perspective
  while respecting illustration style and shot type.
  `,
  model: openai("gtp-5-nano)")
});