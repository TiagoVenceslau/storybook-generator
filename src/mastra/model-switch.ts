export enum Features {
  EXPORT = "export",
  IMAGE_GEN = "image-gen",
  SCRIPT_GEN = "script-gen",
  STORYBOARD_GEN = "storyboard-gen",
}

export class ModelSwitch {

  private static models: Record<string, Record<string, Record<string, () => any>>>

  private constructor() {
  }

  static register(feature: string, vendor: string, model: string, factory: () => any) {
    if (!this.models) {
      this.models = {}
    }
    if (!this.models[feature]) {
      this.models[feature] = {}
    }

    if (!this.models[feature][vendor]) {}
      this.models[feature][vendor] = {}

    if (!this.models[feature][vendor][model]) {
      this.models[feature][vendor][model] = factory
    } else {
      throw new Error(`Model for feature "${feature}" and vendor "${vendor}" already registered`)
    }
  }

  static get(feature: string, vendor: string) {
    if (!this.models || !this.models[feature])  {
      throw new Error(`Model for feature "${feature}" not registered`)
    }
    return this.models[feature][vendor]
  }

  static getAvailableModels(feature: string) {
    if (!this.models) {
      return []
    }
  }
}
