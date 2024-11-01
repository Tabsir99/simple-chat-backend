import EventEmitter from "events";
import { injectable } from "inversify";

@injectable()
export class EventManager {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  public emit<T>(eventName: string, payload: T): boolean {
    return this.emitter.emit(eventName, payload);
  }

  public on<T>(eventName: string, listener: (payload: T) => void): void {
    this.emitter.on(eventName, listener);
  }

  public once<T>(eventName: string, listener: (payload: T) => void): void {
    this.emitter.once(eventName, listener);
  }

  public off(eventName: string, listener: (...args: any[]) => void): void {
    this.emitter.off(eventName, listener);
  }

  public removeAllListeners(eventName?: string): void {
    this.emitter.removeAllListeners(eventName);
  }

  public totalListenersCount() {
    const events = this.emitter.eventNames(); // Get all event names
    let totalListeners = 0;

    events.forEach((event) => {
      totalListeners += this.emitter.listenerCount(event); // Sum listeners for each event
    });

    return totalListeners;
  }

  public eventNames(): Array<string | symbol> {
    return this.emitter.eventNames();
  }
}
