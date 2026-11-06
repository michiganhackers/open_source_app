import { play_ggwaveform, string_to_ggwaveform } from "@/utils/ggwave-utils";
import { Handler } from "./abstract";

// Sends out audio given a string message and result is a bool for if broadcast finished and finished successfully
export class BroadcastHandler extends Handler {
  protected async runCore(payload: string): Promise<void> {
    const waveform = await string_to_ggwaveform(payload!);
    play_ggwaveform(waveform);
    // Wait for playback to finish
    await new Promise<void>((resolve) =>
      setTimeout(resolve, (waveform.length / 48000) * 1000),
    );
  }

  get_result(): Promise<boolean> {
    return Promise.resolve(this.expired);
  }
}
