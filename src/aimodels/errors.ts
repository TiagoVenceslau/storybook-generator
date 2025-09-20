export class CompletionError extends Error {
  constructor(message: string | Error) {
    super(typeof message === "string" ? message : message.message);
  }
}