import { BroadcastHandler } from "./handlers/broadcaster";
import { ListenerHandler } from "./handlers/listener";

// Holds a listener and broadcast handler and has a start_broadcast() and stop_broadcast() and start_listen() and stop_listen() and get_broadcast() and get_listen() for results
export class SoundEngine {
  listener = new ListenerHandler();
  broadcaster = new BroadcastHandler();

  start_broadcast(args: any): void {
    this.broadcaster.run(args);
  }
  stop_broadcast(): void {
    this.stop_broadcast();
  }
  status_broadcast(): string {
    if (this.broadcaster.result) {
      return "Broadcast sent!";
    }
    if (this.broadcaster.isRunning) {
      return "Broadcasting...";
    } else {
      return "Standing by...";
    }
  }

  start_listen(): void {
    this.listener.run();
  }
  stop_listen(): void {
    this.listener.stop();
  }
  status_listen(): string {
    if (this.listener.result !== null) {
      return "Message received!";
    }
    if (this.listener.isRunning) {
      return "Listening...";
    } else {
      return "Standing by...";
    }
  }
}

export const soundEngine: SoundEngine = new SoundEngine();
