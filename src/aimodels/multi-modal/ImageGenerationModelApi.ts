import { AIModelAPI } from "../AIModelApi";

export abstract class ImageGenerationModelApi<CLIENT, REQUESTCONF> extends AIModelAPI<CLIENT, REQUESTCONF> {
  protected constructor(name: string, vendor: string) {
    super(name, vendor);
  }

  abstract generateImage<CONF, RES>(prompt: string, conf?: CONF, reqConf?: REQUESTCONF): Promise<RES>
  abstract editImage<CONF, RES>(image: string, mask: string, prompt: string, conf?: CONF, reqConf?: REQUESTCONF): Promise<RES>
}