import { Agent, Mastra, Workflow } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { FileApi } from "../../src/FileApi";
import path from "path";

// Create shared storage for all memory instances
const sharedStorage = new LibSQLStore({
  url: "file:mastra-memory.db", // Back to original
});

export function setTestFsBasePath(){
  FileApi.cwd = path.join(process.cwd(), "tests", "outputs")
}

export function getMastraForTest(testName: string, workflows: Record<string, Workflow>, agents: Record<string, Agent>){
  return new Mastra({
    agents: agents,
    networks: {
    },
    vnext_networks: {
    },
    workflows: workflows,
    server: {
      host: "localhost",
      port: 8080,
    },
    bundler: {
      sourcemap: true,
      externals: [
        "sharp",
        "undici",
        "formatdata-node"
      ]
    },
    storage: sharedStorage, // Enable shared storage for memory
    logger: new PinoLogger({
      name: testName,
      level: 'debug',
    }),
  });
}