// The wall's voice.
//
// Sound is doing real teaching work here, not decoration. A hold that lights
// silently is a hold that might have been a rendering glitch; a hold that
// lights and speaks is a hold that meant it. And because pitch follows height,
// the route is audible as a shape --- which is how a player holds eight of them
// in their head.

/** Web Audio starts suspended and only a real press may resume it. */
export class Voice {
  private context: AudioContext | undefined;
  private bus: GainNode | undefined;

  /** Must be called from inside a click, tap or keydown handler. */
  unlock(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const bus = context.createGain();
    bus.gain.value = 0.9;
    bus.connect(context.destination);
    this.context = context;
    this.bus = bus;
    void context.resume();
  }

  private ring(hz: number, at: number, seconds: number, level: number): void {
    const context = this.context;
    const bus = this.bus;
    if (!context || !bus) return;

    // Two partials and a fast decay: closer to a struck plastic hold than a
    // sine, and it survives being played eight times in a row without turning
    // into a drone.
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
    // setTargetAtTime, not setValueAtTime: the tail keeps gliding through a
    // main-thread stall instead of stepping when the thread recovers.
    gain.gain.setTargetAtTime(0.0001, at + 0.012, seconds / 3);
    gain.connect(bus);

    const tone = context.createOscillator();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(hz, at);

    const shimmer = context.createGain();
    shimmer.gain.value = 0.28;
    const upper = context.createOscillator();
    upper.type = "sine";
    upper.frequency.setValueAtTime(hz * 3.02, at);
    upper.connect(shimmer);
    shimmer.connect(gain);

    tone.connect(gain);
    tone.start(at);
    upper.start(at);
    tone.stop(at + seconds + 0.1);
    upper.stop(at + seconds + 0.1);
  }

  /** One hold, struck. */
  strike(hz: number, delay = 0): void {
    if (!this.context) return;
    this.ring(hz, this.context.currentTime + delay, 0.6, 0.32);
  }

  /** A fall: the pitch drops out from under the player. */
  fall(hz: number): void {
    const context = this.context;
    const bus = this.bus;
    if (!context || !bus) return;
    const at = context.currentTime;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    gain.gain.setTargetAtTime(0.0001, at + 0.1, 0.34);
    gain.connect(bus);

    const tone = context.createOscillator();
    tone.type = "sawtooth";
    tone.frequency.setValueAtTime(hz, at);
    tone.frequency.exponentialRampToValueAtTime(
      Math.max(40, hz / 5),
      at + 0.75,
    );
    tone.connect(gain);
    tone.start(at);
    tone.stop(at + 1.1);
  }

  /** Topping out: the route, played as a chord that keeps rising. */
  fanfare(pitches: readonly number[]): void {
    if (!this.context) return;
    pitches.forEach((hz, index) => {
      this.ring(hz, this.context!.currentTime + index * 0.09, 1.6, 0.26);
    });
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
