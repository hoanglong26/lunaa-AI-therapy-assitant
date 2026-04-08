declare module "hark" {
  import { EventEmitter } from "events";

  interface HarkOptions {
    threshold?: number;
    interval?: number;
    play?: boolean;
    history?: number;
    smoothing?: number;
  }

  interface Harker extends EventEmitter {
    speaking: boolean;
    setThreshold(threshold: number): void;
    setInterval(interval: number): void;
    stop(): void;
    on(event: "speaking", listener: () => void): this;
    on(event: "stopped_speaking", listener: () => void): this;
    on(event: "volume_change", listener: (dBs: number, threshold: number) => void): this;
  }

  function hark(stream: MediaStream, options?: HarkOptions): Harker;
  export default hark;
}
