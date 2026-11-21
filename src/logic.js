import { GAMES, ARCHETYPES, BOMB, DEFEND, ACCUSE, LINE, AUCTION, promptsFor } from './content.js'

export const POINTS = 10
export const MAX_GAMES = 5 // a session is at most 5 games, then the final leaderboard

const BANKS = { bomb: BOMB, defend: DEFEND, accuse: ACCUSE, line: LINE, auction: AUCTION }

// Weighted pick of the next game for the episode. Never repeats the previous game
// when another one exists. Quiet venues get fewer loud bomb rounds.
// The vibe check matters: each player's archetype adds weight to the games they love,
// and groups who know each other well get more mind-reading games.
export function pickGame(lastGame, playerCount, venue = 'lively', archs = [], familiarity = 'friends') {
  const weights = {
    bomb: venue === 'quiet' ? 2 : 4,
    defend: playerCount >= 3 ? 4 : 3,
    accuse: playerCount >= 3 ? 4 : 2,
    line: familiarity === 'new' ? 2 : 4,
    auction: venue === 'quiet' ? 2 : 3,
  }
  if (familiarity === 'new') { weights.bomb += 1; weights.auction += 1 }
  for (const a of archs) for (const gm of ARCHETYPES[a]?.games || []) weights[gm] += 2
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
  return Math.min(n || playerCount, 3) // short episodes: max 3 rounds
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
// Fuse is always 30 to 60 seconds, random so nobody can count it.
export function fuseMs() {
  return 30000 + Math.floor(Math.random() * 30000)
}

// The group's dominant archetype (ties broken by order) and its top games.
export function groupProfile(archs) {
  const counts = {}
  for (const a of archs) counts[a] = (counts[a] || 0) + 1
  const top = Object.keys(ARCHETYPES).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0]
  const gameScore = {}
  for (const a of archs) for (const gm of ARCHETYPES[a].games) gameScore[gm] = (gameScore[gm] || 0) + 1
  const games = Object.keys(gameScore).sort((a, b) => gameScore[b] - gameScore[a]).slice(0, 2)
  return { top, games }
}
