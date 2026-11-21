// Every sound the game makes, synthesised live with the Web Audio API — no audio
// files, no network. The context is created on the first user gesture (browsers
// refuse audio before one), and M toggles mute. Each effect is a short envelope
// over one or two oscillators, so a find feels like a chime and a miss like a thud.

/** Frequencies for the little two-note chime a found difference plays. */
const FIND_NOTES = [523.25, 783.99];
const WRONG_NOTE = 110;
const HINT_NOTE = 1046.5;
const WIN_NOTES = [523.25, 659.25, 783.99, 1046.5];
const TICK_NOTE = 880;

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  /** Play one oscillator note: frequency, start delay, length, waveform and volume. */
  function note(frequency, delay, length, type, volume) {
    const audio = ensure();
    if (audio === null || muted) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const start = audio.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + length + 0.05);
  }

  return {
    /** Warm the context up on a click so the first real sound is never late. */
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** A rising two-note chime, one note per panel of the found difference. */
    find() {
      note(FIND_NOTES[0], 0, 0.28, 'sine', 0.22);
      note(FIND_NOTES[1], 0.09, 0.34, 'sine', 0.2);
    },
    /** A low buzz for a click that found nothing. */
    wrong() {
      note(WRONG_NOTE, 0, 0.22, 'sawtooth', 0.12);
      note(WRONG_NOTE / 2, 0, 0.25, 'square', 0.06);
    },
    /** A soft shimmer when a hint lights up. */
    hint() {
      note(HINT_NOTE, 0, 0.4, 'sine', 0.1);
      note(HINT_NOTE * 1.5, 0.12, 0.4, 'sine', 0.08);
    },
    /** An ascending arpeggio when a scene — or the whole hunt — is finished. */
    win() {
      WIN_NOTES.forEach((frequency, index) => note(frequency, index * 0.12, 0.5, 'triangle', 0.18));
    },
    /** A short descending sigh when the clock runs out. */
    lose() {
      note(392, 0, 0.4, 'triangle', 0.15);
      note(311.13, 0.18, 0.55, 'triangle', 0.15);
    },
    /** The quiet tick in the last ten seconds. */
    tick() {
      note(TICK_NOTE, 0, 0.06, 'square', 0.05);
    },
  };
}
