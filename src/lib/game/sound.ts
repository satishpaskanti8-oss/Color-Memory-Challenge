// Tiny Web Audio SFX engine — no external audio files, all synthesised.

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

type ToneOpts = { freq: number; dur?: number; type?: OscillatorType; gain?: number; delay?: number; slideTo?: number };

function tone({ freq, dur = 0.14, type = "sine", gain = 0.16, delay = 0, slideTo }: ToneOpts) {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(vol).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click: () => tone({ freq: 520, dur: 0.07, type: "triangle", gain: 0.1 }),
  reveal: () => tone({ freq: 660, dur: 0.12, type: "sine", gain: 0.1 }),
  tick: () => tone({ freq: 880, dur: 0.05, type: "square", gain: 0.05 }),
  correct: () => {
    tone({ freq: 660, dur: 0.1, type: "sine" });
    tone({ freq: 880, dur: 0.14, type: "sine", delay: 0.08 });
  },
  wrong: () => {
    tone({ freq: 220, dur: 0.18, type: "sawtooth", gain: 0.12, slideTo: 120 });
  },
  combo: (n: number) => tone({ freq: 520 + Math.min(n, 12) * 60, dur: 0.12, type: "triangle" }),
  coin: () => {
    tone({ freq: 1100, dur: 0.06, type: "square", gain: 0.08 });
    tone({ freq: 1500, dur: 0.1, type: "square", gain: 0.08, delay: 0.05 });
  },
  levelComplete: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.22, type: "triangle", delay: i * 0.11 }));
  },
  achievement: () => {
    [784, 988, 1318].forEach((f, i) => tone({ freq: f, dur: 0.2, type: "sine", delay: i * 0.09 }));
  },
  mystery: () => {
    [400, 600, 900, 1200].forEach((f, i) => tone({ freq: f, dur: 0.14, type: "triangle", delay: i * 0.08 }));
  },
  gameOver: () => {
    [440, 380, 300, 220].forEach((f, i) => tone({ freq: f, dur: 0.24, type: "sawtooth", gain: 0.1, delay: i * 0.14 }));
  },
  finale: () => {
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) =>
      tone({ freq: f, dur: 0.3, type: "triangle", delay: i * 0.13 }),
    );
  },
};

export function vibrate(pattern: number | number[], allowed: boolean) {
  if (!allowed || typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
