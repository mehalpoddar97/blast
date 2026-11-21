import { GAMES, ARCHETYPES, BOMB, DEFEND, ACCUSE, LINE, AUCTION, promptsFor } from './content.js'

export const POINTS = 10
export const MAX_GAMES = 5 // a session is at most 5 games, then the final leaderboard

const BANKS = { bomb: BOMB, defend: DEFEND, accuse: ACCUSE, line: LINE, auction: AUCTION }

// ---- Matching games to the crowd ----
// Rule table (familiarity x venue):
//   Just met     -> icebreakers only: Bomb, Defend, Auction. Where's the Line unlocks from game 3
//                   (you've warmed up by then). Accusation Station never: you can't accuse a stranger.
//                   Prompts capped at Spicy.
//   Good friends -> everything allowed.
//   Dark secrets -> everything allowed, mind-reading games (Accusation, Line) preferred.
//   Quiet place  -> fewer shouty games (Bomb, Auction); House party -> more.
export const NEEDS_KNOWING = ['accuse', 'line']

export function allowedGames(familiarity, gamesDone = 0) {
  return Object.keys(GAMES).filter((g) => {
    if (familiarity !== 'new') return true
    if (g === 'accuse') return false
    if (g === 'line') return gamesDone >= 2
    return true
  })
}

export function lockReason(id, familiarity, gamesDone) {
  if (familiarity !== 'new') return null
  if (id === 'accuse') return 'Locked: you just met'
  if (id === 'line' && gamesDone < 2) return 'Unlocks after 2 games'
  return null
}

// Weighted pick of the next game, plus a one-line reason shown on the slot machine.
// Never repeats the previous game when another one is allowed.
export function pickGame(lastGame, playerCount, venue = 'lively', archs = [], familiarity = 'friends', gamesDone = 0) {
  const weights = { bomb: 4, defend: 4, accuse: 3, line: 3, auction: 3 }
  if (venue === 'quiet') { weights.bomb -= 2; weights.auction -= 1; weights.defend += 1 }
  else { weights.bomb += 2; weights.auction += 1 }
  if (familiarity === 'family') { weights.accuse += 4; weights.line += 3 }
  if (familiarity === 'new') { weights.bomb += 2; weights.defend += 1 }
  if (playerCount === 2) weights.accuse -= 2
  for (const a of archs) for (const gm of ARCHETYPES[a]?.games || []) weights[gm] += 1
  const allowed = allowedGames(familiarity, gamesDone)
  let pool = allowed.filter((g) => g !== lastGame)
  if (pool.length === 0) pool = allowed
  const total = pool.reduce((s, g) => s + Math.max(1, weights[g]), 0)
  let r = Math.random() * total
  let game = pool[0]
  for (const g of pool) {
    r -= Math.max(1, weights[g])
    if (r <= 0) { game = g; break }
  }
  return { game, reason: reasonFor(game, venue, familiarity, archs) }
}

function reasonFor(game, venue, familiarity, archs) {
  if (familiarity === 'new' && !NEEDS_KNOWING.includes(game)) return 'Picked because you just met: zero mind-reading needed 🤝'
  if (familiarity === 'new' && game === 'line') return "You've warmed up. Time to read each other 👀"
  if (familiarity === 'family' && NEEDS_KNOWING.includes(game)) return "Picked because you know each other's secrets 🕵️"
  if (venue === 'lively' && (game === 'bomb' || game === 'auction')) return 'Picked for a loud crowd 🎉'
  if (venue === 'quiet' && (game === 'defend' || game === 'line')) return 'Picked for a quiet spot ☕'
  const fan = Object.keys(ARCHETYPES).find((a) => archs.includes(a) && ARCHETYPES[a].games.includes(game))
  if (fan) return `Picked for your ${ARCHETYPES[fan].label.replace('The ', '')}s ${ARCHETYPES[fan].emoji}`
  return 'Picked to keep things fresh 🎲'
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
// Fuse is always 20 to 45 seconds, random so nobody can count it.
export function fuseMs() {
  return 20000 + Math.floor(Math.random() * 25000) // 20 to 45 seconds
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

// Group-size rules: 2-5 play as individuals, 6-8 split into 2 teams, 9-12 into 3 teams.
export function teamCount(n) {
  return n <= 5 ? 0 : n <= 8 ? 2 : 3
}

export const TEAM_NAMES = [
  { name: 'Team Masala', emoji: '🌶️', color: '#ff2e63' },
  { name: 'Team Chai', emoji: '☕', color: '#ffb800' },
  { name: 'Team Nimbu', emoji: '🍋', color: '#9dff3b' },
]

// Balanced teams: shuffle, sort by archetype, then deal like cards so each team gets a mix.
export function makeTeams(players) {
  const T = teamCount(players.length)
  if (!T) return null
  const idx = players.map((_, i) => i).sort(() => Math.random() - 0.5)
  idx.sort((a, b) => (players[a].arch || '').localeCompare(players[b].arch || ''))
  const teams = TEAM_NAMES.slice(0, T).map((t) => ({ ...t, score: 0, members: [] }))
  idx.forEach((pi, k) => teams[k % T].members.push(pi))
  return teams
}
