// Gentle generative background music made with Web Audio — no audio files.
// Soft pentatonic plucks (Thai-ish scale) over a quiet drone and flowing water.

const SCALE = [0, 2, 4, 7, 9]; // C D E G A
const ROOT = 261.63; // C4

export function createMusic() {
  let ctx, master, echo, playing = false, timer = null, step = 0, last = 2;

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    // soft echo for a spacious, reverb-ish tail
    echo = ctx.createGain();
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1800;
    echo.connect(delay).connect(tone).connect(fb).connect(delay);
    tone.connect(master);
    echo.connect(master);

    drone(ROOT / 2, 0.05);
    drone((ROOT / 2) * 1.5, 0.03);
    water();
  }

  function drone(freq, level) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = level;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07 + Math.random() * 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = level * 0.6;
    lfo.connect(lfoGain).connect(g.gain);
    o.connect(g).connect(master);
    o.start();
    lfo.start();
  }

  function water() {
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 3; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 500;
    f.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lg = ctx.createGain();
    lg.gain.value = 220;
    lfo.connect(lg).connect(f.frequency);
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(f).connect(g).connect(master);
    src.start();
    lfo.start();
  }

  function pluck(freq, when, vel) {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.12 * vel, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 2.4);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(master);
    g.connect(echo);
    o.start(when); o2.start(when);
    o.stop(when + 2.5); o2.stop(when + 2.5);
  }

  // gentle random walk over the scale, in short phrases with rests
  function schedule() {
    if (!playing) return;
    const now = ctx.currentTime;
    const phrase = step % 8;
    if (phrase < 6 && Math.random() < 0.85) {
      last = Math.max(0, Math.min(9, last + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const deg = SCALE[last % 5] + 12 * Math.floor(last / 5);
      pluck(ROOT * 2 ** (deg / 12), now + 0.02, 0.6 + Math.random() * 0.4);
      if (phrase === 0) pluck(ROOT * 2 ** ((deg - 12) / 12), now + 0.02, 0.4); // soft bass on phrase start
    }
    step++;
    timer = setTimeout(schedule, [520, 780, 780, 1040][Math.floor(Math.random() * 4)]);
  }

  return {
    get playing() { return playing; },
    async start() {
      if (playing) return;
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch { /* iOS only */ }
      if (!ctx) setup();
      await ctx.resume();
      playing = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.75, ctx.currentTime, 1.2);
      schedule();
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearTimeout(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      setTimeout(() => { if (!playing) ctx.suspend(); }, 1500);
    },
  };
}
