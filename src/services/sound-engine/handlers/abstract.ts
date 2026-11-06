export abstract class Handler {
  isRunning = false;
  expired = false;
  result: any = null;
  stop(): void {}
  async run(args: any = null): Promise<void> {
    if (this.isRunning || this.expired) return;
    this.isRunning = true;
    this.result = await this.runCore(args);
    this.isRunning = false;
    this.expired = true;
  }
  protected abstract runCore(args: any): Promise<void>;
  abstract get_result(): Promise<any>;
  reset(): void {
    this.stop();
    this.isRunning = false;
    this.expired = false;
    this.result = null;
  }
}
