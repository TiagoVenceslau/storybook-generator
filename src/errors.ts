export abstract class BaseError extends Error {
  protected constructor(msg?: string | Error) {
    super(msg instanceof Error ? msg.message : msg);
  }
}

export class IOMismatch extends BaseError {
  constructor(msg?: string | Error) {
    super(msg);
  }
}

export class FileNotFound extends BaseError {
  constructor(msg?: string | Error) {
    super(msg);
  }
}
export class FileConflict extends BaseError {
  constructor(msg?: string | Error) {
    super(msg);
  }
}