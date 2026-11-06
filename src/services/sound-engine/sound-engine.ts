import { BroadcastHandler } from "./handlers/broadcaster";
import { ListenerHandler } from "./handlers/listener";

// Holds a listener and broadcast handler and has a start_broadcast() and stop_broadcast() and start_listen() and stop_listen() and get_broadcast() and get_listen() for results
export class SoundEngine {
  listener = new ListenerHandler();
  broadcaster = new BroadcastHandler();

  start_broadcast(args: string): void {
    this.broadcaster.run(args);
  }
  stop_broadcast(): void {
    this.broadcaster.stop();
  }
  status_broadcast(): string {
    if (this.broadcaster.expired && !this.broadcaster.isRunning) {
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
    if (this.listener.get_result() !== null) {
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
