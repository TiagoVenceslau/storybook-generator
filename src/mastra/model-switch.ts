import { LanguageModel } from "@mastra/core/llm";

/**
 * Enumerates the high-level capabilities (features) supported by this project.
 *
 * These feature identifiers are used as the first key in the ModelSwitch registry.
 * Each feature can map to one or more vendors, and each vendor can map to one or more models.
 *
 * Typical usage:
 * - Register a model factory against a feature/vendor/model triple.
 * - Retrieve a model factory invocation for a feature/vendor/model triple at runtime.
 */
export enum Features {
  EXPORT = "export",
  IMAGE_GEN = "image-gen",
  VISUAL_GEN = "visual-gen",
  SCRIPT_GEN = "script-gen",
  STORYBOARD_GEN = "storyboard-gen",
  NETWORK = "network",
  EVAL_CONSISTENCY = "ev-consistency",
}

/**
 * A lightweight registry/locator for LLM or tool "models" keyed by:
 * - feature (e.g., "script-gen", "image-gen")
 * - vendor (e.g., "openai", "google")
 * - model (e.g., "gpt-5", "gemini-2.5-flash")
 *
 * Responsibilities:
 * - Register factories for concrete models by feature/vendor/model.
 * - Retrieve and invoke the registered factory to obtain a model instance/value.
 *
 * Notes:
 * - The registry is entirely static and in-memory.
 * - The `factory` signature is intentionally generic: (...args: any[]) => any
 *   so it can accommodate differing vendor factory shapes.
 * - `get()` invokes the stored factory passing the `model` as the first argument by convention.
 *
 * Example:
 *   ModelSwitch.register(Features.SCRIPT_GEN, "openai", "gpt-5", openaiFactory)
 *   const model = ModelSwitch.get(Features.SCRIPT_GEN, "openai", "gpt-5")
 *
 * Error handling:
 * - Duplicate registration for the same feature/vendor/model throws an Error.
 * - Accessing a non-registered feature/vendor/model throws an Error.
 */
export class ModelSwitch {

  /**
   * Internal nested map holding factories by feature → vendor → model.
   *
   * Shape:
   * {
   *   [feature: string]: {
   *     [vendor: string]: {
   *       [model: string]: (...args: any[]) => any
   *     }
   *   }
   * }
   */
  private static models: Record<string, Record<string, Record<string, (...args: any[]) => LanguageModel>>>

  static vendor: "openai" | "google" = "openai";

  private constructor() {
  }
  
  /**
   * Builds a human-friendly textual reference for a vendor/model pair.
   *
   * Intended for logs, prompts, or UI messages that describe what model is in use.
   *
   * @param vendor - The provider (e.g., "openai", "google").
   * @param model - The model identifier (e.g., "gpt-5", "gemini-2.5-flash").
   * @returns A descriptive string like "openai' gpt-5 model".
   */
  static modelTextualReference(vendor: string, model: string) {
    return `${vendor}' ${model} model`
  }

  /**
   * Registers a model factory against a feature/vendor/model triple.
   *
   * If the given feature or vendor maps do not exist yet, they are created.
   * If a factory is already registered for the same triple, an error is thrown.
   *
   * @param feature - Feature namespace under which the model is grouped (see Features).
   * @param vendor - Provider/vendor name ("openai", "google", etc.).
   * @param model - Concrete model name (e.g., "gpt-5", "gemini-2.5-flash").
   * @param factory - A factory function that, when invoked, returns the model instance/value.
   *
   * @throws Error If attempting to register a duplicate feature/vendor/model.
   */
  static register(feature: string, vendor: string, model: string, factory: (...args: any[]) => LanguageModel) {
    if (!this.models)
      this.models = {}

    if (!this.models[feature])
      this.models[feature] = {}

    if (!this.models[feature][vendor]) {}
      this.models[feature][vendor] = {}

    if (!this.models[feature][vendor][model]) {
      this.models[feature][vendor][model] = factory
    } else {
      throw new Error(`Model for feature "${feature}" and vendor "${vendor}" already registered`)
    }
  }

  static forFeature(feature: string): LanguageModel {
    if (!this.models || !this.models[feature] || !this.models[feature][this.vendor])
      throw new Error(`No models registered for feature "${feature}" fo current vendor ${this.vendor}`)
    const factory = Object.values(this.models[feature][this.vendor])[0]
    const model = Object.keys(this.models[feature][this.vendor])[0]
    return factory(model)
  }

  /**
   * Retrieves and invokes the registered factory for a feature/vendor/model.
   *
   * By convention, the stored factory is invoked with the `model` as the first argument.
   * If the feature/vendor/model triple is not registered, an error is thrown.
   *
   * @param feature - Feature key (e.g., Features.SCRIPT_GEN).
   * @param vendor - Vendor/provider name ("openai", "google", etc.).
   * @param model - Concrete model name used as both the key and the first argument to the factory.
   * @returns The result of invoking the registered factory for the given triple.
   *
   * @throws Error If the feature, vendor, or model is not registered.
   */
  static get(feature: string, vendor: string, model: string) {
    if (!this.models || !this.models[feature] || !this.models[feature][vendor] || !this.models[feature][vendor][model])  {
      throw new Error(`Model for feature "${feature}" not registered`)
    }
    return this.models[feature][vendor][model](model)
  }
}
