export abstract class Handler {
  isRunning = false;
  expired = false;
  duration = 0;
  elapsed = 0;
  stop(): void {}
  getProgress(): number {
    return this.duration > 0 ? Math.min(this.elapsed / this.duration, 1) : 0;
  }
  async run(args: any = null): Promise<void> {
    if (this.isRunning || this.expired) return;
    this.isRunning = true;
    this.elapsed = 0;
    const start = Date.now();
    const timer = setInterval(() => {
      this.elapsed = Date.now() - start;
    }, 50);
    await this.runCore(args);
    clearInterval(timer);
    this.elapsed = Date.now() - start;
    this.isRunning = false;
    this.expired = true;
  }
  protected abstract runCore(args: any): Promise<void>;
  abstract get_result(): any;
  reset(): void {
    this.stop();
    this.isRunning = false;
    this.expired = false;
  }
}
