// All sounds are synthesised live with the Web Audio API: no audio files to load or break.
let ctx = null
let muted = false
try { muted = localStorage.getItem('blast-muted') === '1' } catch {}

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function isMuted() { return muted }
export function setMuted(m) {
  muted = m
  try { localStorage.setItem('blast-muted', m ? '1' : '0') } catch {}
}
// iOS only allows audio after a tap; call this from the first button press.
export function unlock() { ac() }

function tone({ freq = 440, to, dur = 0.12, type = 'square', vol = 0.18, delay = 0 }) {
  const a = ac(); if (!a || muted) return
  const t = a.currentTime + delay
  const o = a.createOscillator(); const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t); o.stop(t + dur + 0.02)
}

function noise({ dur = 0.6, vol = 0.6, delay = 0, filter = 900 }) {
  const a = ac(); if (!a || muted) return
  const t = a.currentTime + delay
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
  const s = a.createBufferSource(); s.buffer = buf
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter
  const g = a.createGain(); g.gain.value = vol
  s.connect(f).connect(g).connect(a.destination)
  s.start(t)
}

export const sfx = {
  tap: () => tone({ freq: 660, to: 880, dur: 0.06, type: 'triangle', vol: 0.12 }),
  tick: (hi) => tone({ freq: hi ? 1400 : 1000, dur: 0.04, type: 'square', vol: 0.12 }),
  pass: () => { tone({ freq: 500, to: 1200, dur: 0.12, type: 'sawtooth', vol: 0.1 }) },
  boom: () => {
    noise({ dur: 1.4, vol: 0.9, filter: 700 })
    tone({ freq: 120, to: 30, dur: 0.9, type: 'sine', vol: 0.6 })
  },
  ding: () => { tone({ freq: 880, dur: 0.15, type: 'triangle' }); tone({ freq: 1320, dur: 0.3, type: 'triangle', delay: 0.1 }) },
  buzzer: () => tone({ freq: 140, dur: 0.5, type: 'sawtooth', vol: 0.2 }),
  whoosh: () => tone({ freq: 200, to: 1600, dur: 0.35, type: 'sawtooth', vol: 0.08 }),
  twist: () => { [0, 0.12, 0.24].forEach((d, i) => tone({ freq: 400 + i * 200, dur: 0.12, type: 'square', delay: d, vol: 0.15 })) },
  fanfare: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'square', delay: i * 0.13, vol: 0.14 }))
    tone({ freq: 1047, dur: 0.7, type: 'triangle', delay: 0.55, vol: 0.18 })
  },
  drumroll: (secs = 1.6) => {
    for (let t = 0; t < secs; t += 0.05) noise({ dur: 0.05, vol: 0.25 + t / secs * 0.3, delay: t, filter: 2500 })
  },
  slotTick: () => tone({ freq: 1800, dur: 0.02, type: 'square', vol: 0.06 }),
}

export function buzz(ms = 30) {
  try { navigator.vibrate && navigator.vibrate(ms) } catch {}
}
