import { GAMES, BOMB, DEFEND, ACCUSE, LINE, AUCTION, promptsFor } from './content.js'

export const POINTS = 10

const BANKS = { bomb: BOMB, defend: DEFEND, accuse: ACCUSE, line: LINE, auction: AUCTION }

// Weighted pick of the next game for the episode. Never repeats the previous game
// when another one exists. Quiet venues get fewer loud bomb rounds.
export function pickGame(lastGame, playerCount, venue = 'lively') {
  const weights = {
    bomb: venue === 'quiet' ? 2 : 4,
    defend: playerCount >= 3 ? 4 : 3,
    accuse: playerCount >= 3 ? 4 : 2,
    line: 3,
    auction: venue === 'quiet' ? 2 : 3,
  }
  let pool = Object.keys(GAMES).filter((g) => g !== lastGame)
  if (pool.length === 0) pool = Object.keys(GAMES)
  const total = pool.reduce((s, g) => s + (weights[g] || 3), 0)
  let r = Math.random() * total
  for (const g of pool) {
    r -= weights[g] || 3
    if (r <= 0) return g
  }
  return pool[0]
}

// How many rounds an episode of this game lasts for this group.
export function episodeLength(game, playerCount) {
  const n = GAMES[game].rounds
  return n || Math.min(playerCount, 4)
}

// Pick a prompt the group has not seen this session. When the bank runs out, reuse.
export function pickPrompt(game, intensity, used) {
  const bank = promptsFor(BANKS[game], intensity)
  let fresh = bank.filter((p) => !used.includes(p.id))
  if (fresh.length === 0) fresh = bank
  // Lean towards the chosen intensity so Unhinged actually feels unhinged.
  const exact = fresh.filter((p) => p.i === intensity)
  const pool = exact.length && Math.random() < 0.75 ? exact : fresh
  return pool[Math.floor(Math.random() * pool.length)]
}

// Secret bomb fuse in ms. Random so nobody can count it.
export function fuseMs() {
  return 18000 + Math.floor(Math.random() * 22000) // 18 to 40 seconds
}
