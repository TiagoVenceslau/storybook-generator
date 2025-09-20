import { LoggedClass } from "@decaf-ts/logging";
import { Conversation } from "../types";

export abstract class AIModelAPI<CLIENT, REQUESTCONF> extends LoggedClass {

  protected abstract get apiKey(): string

  private _client?: CLIENT

  protected constructor(readonly name: string, readonly vendor: string) {
    super();
  }

  protected abstract getClient(): CLIENT

  protected client(){
    if (!this._client)
      this._client = this.getClient();
    return this._client;
  }

  abstract generate<RESPONSE, CONF>(prompt: string | Conversation, opts?: CONF, reqOpts?: REQUESTCONF): Promise<RESPONSE>;
  abstract complete<RESPONSE, CONF>(prompt: string | Conversation, opts?: CONF, reqOpts?: REQUESTCONF): Promise<RESPONSE>;

}