import { ImageGenerationModelApi } from "./ImageGenerationModelApi";
import { OpenAI } from "openai";
import RequestOptions = OpenAI.RequestOptions;

export abstract class OpenAIImageGenerationModel extends ImageGenerationModelApi<OpenAI, RequestOptions>{

  protected get apiKey(){
    if (!process.env["OPENAI_API_KEY"])
      throw new Error("Missing api key");
    return process.env["OPENAI_API_KEY"];
  }

  protected constructor(name: string) {
    super(name, "openai");
  }

  protected getClient(): OpenAI {
    return new OpenAI({apiKey: this.apiKey});
  }
}