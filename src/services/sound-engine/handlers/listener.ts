import { listen_ggwaveform } from "@/utils/ggwave-utils";
import { Handler } from "./abstract";

// Listens to incoming audio and gives back a string or null
export class ListenerHandler extends Handler {
  stopListening: (() => void) | null = null;
  private decoded: string | null = null;

  protected async runCore(): Promise<void> {
    this.stopListening = await listen_ggwaveform((text) => {
      this.decoded = text;
    });
    // Wait indefinitely until stopped or a message arrives
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (this.decoded !== null) {
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

  get_result(): Promise<string | null> {
    return Promise.resolve(this.decoded);
  }
}
