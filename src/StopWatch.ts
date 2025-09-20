import { Logger } from "@decaf-ts/logging";

export class StopWatch {
  protected startTime?: Date;
  protected steps?: {step: string | number, time: Date}[];

  constructor(protected readonly log: Logger) {
  }

  start(){
    this.startTime = new Date();
    return this;
  }

  step(ref?: string | number){
    if (!this.steps)
      this.steps = [];
    ref = ref || this.steps.length + 1
    const step = {
      step: ref,
      time: new Date()
    }
    this.steps.push(step)
    this.log.verbose(`Starting step ${step.step}${this.steps.length > 1 ? `. previous step took ${step.time.getTime() - this.steps[this.steps.length - 2].time.getTime()} ms` : ''}`);
    return this;
  }

  stop(){
    if (!this.startTime)
      throw new Error("Stop watch is not running")
    const stopTime = new Date();
    const startTime = this.startTime
    const elapsed = stopTime.getTime() - startTime.getTime();
    this.log.info(`Stop watch time ${elapsed} ms`);
    if (this.steps)
      this.log.verbose(`Steps:\n${this.steps.map(s => {
        return `step ${s.step} took ${s.time.getTime() - startTime.getTime() as any} ms`
      }).join("\n")}`);
    this.startTime = undefined;
    this.startTime = undefined;
    return this;
  }

  static start(log: Logger) {
    return new StopWatch(log).start();
  }
}