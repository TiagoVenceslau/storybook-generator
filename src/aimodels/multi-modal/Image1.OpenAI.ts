import { OpenAIImageGenerationModel } from "./OpenAIImageGenerationModel";
import { Conversation } from "../../types";
import {
// @ts-ignore
  Completion,
// @ts-ignore
  CompletionCreateParamsStreaming, Image, ImageEditParamsNonStreaming,
// @ts-ignore
  ImageGenerateParamsNonStreaming,
// @ts-ignore
  ImagesResponse,
} from "openai/client";
import RequestOptions = OpenAI.RequestOptions;
import { CompletionError } from "../errors";
import { StopWatch } from "../../StopWatch";
import { OpenAI } from "openai";
import fs from "fs";

export class Image1OpenAI extends OpenAIImageGenerationModel {
  constructor() {
    super("image-gpt-1");
  }


  async generateImage<RES>(prompt: string, opts: Omit<ImageGenerateParamsNonStreaming, "prompt" | "model"> = {}, reqOpts?: RequestOptions): Promise<RES> {
    let result: ImagesResponse;
    const log = this.log.for(this.generateImage)
    const stopWatch = StopWatch.start(log);
    try {
      log.debug(`Running a generate image request on ${this.vendor}'s ${this.name} completions`);

      result = await this.client().images.generate({
        ...opts,
        prompt: prompt as unknown as string,
        model: this.name
      }, reqOpts)
      stopWatch.stop()
    } catch (e: unknown) {
      stopWatch.stop()
      throw new CompletionError(e as Error);
    }
    const {usage, data} = result;
    log.info(`Running an image generation request on ${this.vendor}'s ${this.name} model took ${usage.total_tokens} tokens`);
    const {images} = data;
    return {
      image: images[0],
      background: data.background,
      format: data.output_format,
      quality: data.quality,
      size: data.size
    } as RES
  }

  async editImage<RES>(image: string, mask: string, prompt: string, opts: Omit<ImageEditParamsNonStreaming, "prompt" | "model"> = {}, reqOpts?: RequestOptions): Promise<RES> {
    let result: ImagesResponse;
    const log = this.log.for(this.generateImage)
    const stopWatch = StopWatch.start(log);
    try {
      log.debug(`Running an edit image request on ${this.vendor}'s ${this.name} completions`);
      result = await this.client().images.edit({
        ...opts,
        image: fs.createReadStream(image),
        mask: fs.createReadStream(mask),
        response_format: "b64_json",
        prompt: prompt as unknown as string,
        model: this.name
      }, reqOpts)
      stopWatch.stop()
    } catch (e: unknown) {
      stopWatch.stop()
      throw new CompletionError(e as Error);
    }
    const {usage, data} = result;
    log.info(`Running an image edit request on ${this.vendor}'s ${this.name} model took ${usage.total_tokens} tokens`);
    const {images} = data;
    return {
      image: images[0],
      background: data.background,
      format: data.output_format,
      quality: data.quality,
      size: data.size
    } as RES
  }

  async generate<RESPONSE>(prompt: string | Conversation, opts: Omit<CompletionCreateParamsStreaming, "prompt" | "model"> = {}, reqOpts?: OpenAI.RequestOptions): Promise<RESPONSE> {
    return this.complete(prompt, opts, reqOpts);
  }

  async complete<RESPONSE>(prompt: string | Conversation, opts: Omit<CompletionCreateParamsStreaming, "prompt" | "model"> = {}, reqOpts?: RequestOptions): Promise<RESPONSE> {
    let result: Completion
    const log = this.log.for(this.complete)
    const stopWatch = StopWatch.start(log);
    try {
      log.debug(`Running a completion request on ${this.vendor}'s ${this.name} completions`);

      result = await this.client().completions.create({
        ...opts,
        prompt: prompt as unknown as string,
        model: this.name
      }, reqOpts)
      stopWatch.stop()
    } catch (e: unknown) {
      stopWatch.stop()
      throw new CompletionError(e as Error);
    }
    const {usage, completions} = result;

    log.info(`Running a completion request on ${this.vendor}'s ${this.name} model took ${usage.total_tokens} tokens`);

    return completions[completions.length - 1] as RESPONSE;
  }
}
