import { BRAIN, LINE, AUCTION, promptsFor } from './content.js'

export const POINTS = 10

const BANKS = { brain: BRAIN, line: LINE, auction: AUCTION }

// Who guesses whom: a shifted round-robin. Every player is a target exactly once,
// nobody targets themselves, and the shift rotates each round so pairings change.
export function targetsFor(n, roundNo) {
  if (n < 2) return []
  const shift = 1 + (roundNo % (n - 1))
  return Array.from({ length: n }, (_, i) => (i + shift) % n)
}

// Weighted pick of the next mini-game. Never repeats the previous game.
// Two-player groups lean towards the guessing games; bigger groups get more auctions.
export function pickGame(lastGame, playerCount) {
  const weights = {
    brain: 4,
    line: 3,
    auction: playerCount >= 3 ? 3 : 2,
  }
  const pool = Object.keys(weights).filter((g) => g !== lastGame)
  const total = pool.reduce((s, g) => s + weights[g], 0)
  let r = Math.random() * total
  for (const g of pool) {
    r -= weights[g]
    if (r <= 0) return g
  }
  return pool[0]
}

// Pick a prompt the group has not seen this session. When the bank runs out, reshuffle.
export function pickPrompt(game, intensity, used) {
  const bank = promptsFor(BANKS[game], intensity)
  let fresh = bank.filter((p) => !used.includes(p.id))
  if (fresh.length === 0) fresh = bank
  // Prefer the chosen intensity itself, so Spicy feels spicy.
  const exact = fresh.filter((p) => p.i === intensity)
  const pool = exact.length && Math.random() < 0.65 ? exact : fresh
  return pool[Math.floor(Math.random() * pool.length)]
}

// Score a guessing round. Returns per-player result rows; never trusts anything but recorded answers.
export function scoreGuessRound(game, players, answers, guesses, targets) {
  return players.map((p, i) => {
    const t = targets[i]
    const actual = answers[t]
    const guess = guesses[i]
    const hit =
      game === 'line' ? Math.abs(Number(actual) - Number(guess)) <= 1 : actual === guess
    return { player: i, target: t, guess, actual, hit, points: hit ? POINTS : 0 }
  })
}

export function shuffle(a) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
