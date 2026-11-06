import { listen_ggwaveform } from "@/utils/ggwave-utils";
import { Handler } from "./abstract";

export type ListenerResult = {
  decoded: string | null;
  decodedAt: string | null;
};

// Listens to incoming audio and gives back a string or null
export class ListenerHandler extends Handler {
  stopListening: (() => void) | null = null;
  result: ListenerResult = {
    decoded: null,
    decodedAt: null,
  };

  protected async runCore(): Promise<void> {
    this.stopListening = await listen_ggwaveform((text) => {
      this.result.decoded = text;
      this.result.decodedAt = new Date().toISOString();
    });
    // Wait indefinitely until stopped or a message arrives
    await new Promise<void>((resolve: any) => {
      const check = setInterval(() => {
        if (this.result.decoded !== null) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  stop(): void {
    this.stopListening?.();
    this.stopListening = null;
  }

  get_result(): ListenerResult {
    return this.result;
  }
}
