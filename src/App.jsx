import { useEffect, useRef, useState } from 'react'
import { GAMES, DURATIONS, GROUP_QS, ARCH_Q, ARCHETYPES, GROUP_NAMES } from './content.js'
import { pickGame, pickPrompt, episodeLength, fuseMs, groupProfile, makeTeams, POINTS, MAX_GAMES } from './logic.js'
import { shareCard } from './share.js'
import { sfx, buzz, unlock, isMuted, setMuted } from './sound.js'

const SAVE_KEY = 'blast-game-v2'

const fresh = () => ({
  screen: 'home',
  players: [],
  intensity: 'spicy',
  venue: 'lively',
  familiarity: 'friends',
  duration: 12,
  gamesDone: 0,
  teams: null, // 6+ players: [{ name, emoji, color, score, members }]
  startedAt: null,
  roundNo: 0, // total rounds played this session
  lastGame: null,
  used: [],
  episode: null, // { game, total, done }
  round: null,
  history: [],
})

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY))
    if (s && s.screen) return s
  } catch {}
  return fresh()
}

// Scoreboard units: teams when playing in teams, otherwise players.
export function units(g) {
  return g.teams ? g.teams.map((t) => ({ ...t, members: t.members })) : g.players
}
export function teamOf(g, i) {
  return g.teams ? g.teams.findIndex((t) => t.members.includes(i)) : i
}
const scoresOf = (s) => (s.teams ? s.teams.map((t) => t.score) : s.players.map((p) => p.score))

function newRound(s, game) {
  const prompt = pickPrompt(game, s.intensity, s.used)
  const n = s.players.length
  const twistChance = { chill: 0.3, spicy: 0.5, unhinged: 0.7 }[s.intensity]
  // Spotlight: whoever has had the fewest turns goes next (ties go round the circle),
  // so with 12 players everyone gets a turn before anyone gets a second one.
  // In team mode the spotlight rotates team by team, then to that team's least-used member.
  const pool = s.teams ? s.teams[s.roundNo % s.teams.length].members : s.players.map((_, i) => i)
  const startAt = s.roundNo % pool.length
  let holder = pool[startAt]
  for (let k = 0; k < pool.length; k++) {
    const i = pool[(startAt + k) % pool.length]
    if ((s.players[i].spots || 0) < (s.players[holder].spots || 0)) holder = i
  }
  return {
    used: [...s.used, prompt.id],
    players: s.players.map((p, i) => (i === holder ? { ...p, spots: (p.spots || 0) + 1 } : p)),
    round: {
      game,
      prompt,
      step: 'ready',
      // rotate who starts / who defends so nobody hogs the spotlight
      holder,
      passes: 0,
      endsAt: null,
      twist: game === 'defend' && Math.random() < twistChance,
      pick: null, // accuse: predictor's secret pick
      accused: [],
      secret: 5, // line: reader's secret number
      bidder: null, // auction
      bid: 3,
      count: 0,
    },
  }
}

export default function App() {
  const [g, setG] = useState(load)
  const [muted, setM] = useState(isMuted())
  const [quit, setQuit] = useState(false)

  // Leave the current game. keep=false throws away the points scored in it.
  const leaveGame = (keep, to = 'episodeEnd') => {
    setQuit(false)
    setG((s) => {
      const restore = !keep && s.episode?.startScores
      const players = restore && !s.teams ? s.players.map((p, i) => ({ ...p, score: s.episode.startScores[i] ?? p.score })) : s.players
      const teams = restore && s.teams ? s.teams.map((t, i) => ({ ...t, score: s.episode.startScores[i] ?? t.score })) : s.teams
      const inGame = !['episodeEnd', 'summary'].includes(s.screen)
      return { ...s, players, teams, screen: to, gamesDone: s.gamesDone + (inGame && s.episode?.done > 0 ? 1 : 0), round: s.round ? { ...s.round, scored: true } : s.round }
    })
    if (to === 'summary') sfx.fanfare(); else sfx.whoosh()
  }
  const scoredThisGame = g.episode?.startScores && scoresOf(g).some((v, i) => v !== g.episode.startScores[i])
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(g)) } catch {}
  }, [g])
  const set = (patch) => setG((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  const setRound = (patch) => setG((s) => ({ ...s, round: { ...s.round, ...patch } }))

  // Start a new episode of a given (or random) game for the same group.
  const startEpisode = (chosen) =>
    setG((s) => {
      const game = chosen || pickGame(s.lastGame, s.players.length, s.venue, s.players.map((p) => p.arch).filter(Boolean), s.familiarity)
      return {
        ...s,
        screen: chosen ? 'rules' : 'slot',
        lastGame: game,
        episode: { game, total: episodeLength(game, s.players.length), done: 0, startScores: scoresOf(s) },
        ...newRound(s, game),
      }
    })

  const nextRound = () => setG((s) => ({ ...s, screen: 'play', ...newRound(s, s.episode.game) }))

  const skipPrompt = () =>
    setG((s) => {
      const prompt = pickPrompt(s.round.game, s.intensity, s.used)
      return { ...s, used: [...s.used, prompt.id], round: { ...s.round, prompt } }
    })

  // results: [{ player, points, note }]. Idempotent: a round can only score once.
  const applyScores = (results, headline) =>
    setG((s) => {
      if (s.round.scored) return s
      const players = s.players.map((p, i) => {
        const r = results.find((x) => x.player === i)
        if (!r) return p
        return { ...p, score: p.score + r.points }
      })
      // Teams score the BEST result among their members, never the sum, so bigger teams get no edge.
      const teams = s.teams?.map((t) => {
        const best = Math.max(0, ...results.filter((x) => t.members.includes(x.player)).map((x) => x.points))
        return { ...t, score: t.score + best }
      })
      return {
        ...s,
        players,
        teams: teams || s.teams,
        screen: 'roundEnd',
        roundNo: s.roundNo + 1,
        episode: { ...s.episode, done: s.episode.done + 1 },
        round: { ...s.round, results, headline, scored: true },
        history: [...s.history, { game: s.round.game, headline }],
      }
    })

  // New group: go through the vibe check first.
  const startSetup = (players, duration) => setG({ ...fresh(), players, duration, screen: 'quiz' })
  const finishQuiz = ({ venue, intensity, familiarity, archs }) => {
    setG((s) => {
      const players = s.players.map((p, i) => ({ ...p, arch: archs[i] }))
      return { ...s, venue, intensity, familiarity, players, teams: makeTeams(players), startedAt: Date.now() }
    })
    set({ screen: 'profile' })
  }
  // Same squad again: keep their vibe and archetypes, reset scores.
  const replay = () => {
    setG((s) => ({ ...fresh(), players: s.players.map((p) => ({ ...p, score: 0, spots: 0 })), teams: s.teams?.map((t) => ({ ...t, score: 0 })) || null, intensity: s.intensity, venue: s.venue, familiarity: s.familiarity, duration: s.duration, startedAt: Date.now() }))
    startEpisode()
  }

  const play =
    g.round?.game === 'bomb' ? (
      <Bomb g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
    ) : g.round?.game === 'defend' ? (
      <Defend g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
    ) : g.round?.game === 'accuse' ? (
      <Accuse g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
    ) : g.round?.game === 'line' ? (
      <Line g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
    ) : g.round?.game === 'auction' ? (
      <Auction g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
    ) : null

  const screens = {
    home: <Home g={g} onStart={() => { unlock(); sfx.whoosh(); set({ screen: 'setup' }) }} onResume={() => { unlock(); set({ screen: g.round?.scored ? 'roundEnd' : 'play' }) }} />,
    setup: <Setup onBack={() => set({ screen: 'home' })} onGo={startSetup} />,
    quiz: <Quiz g={g} onDone={finishQuiz} />,
    profile: <Profile g={g} onGo={() => startEpisode()} />,
    slot: <Slot g={g} onDone={() => set({ screen: 'rules' })} />,
    rules: <Rules g={g} onGo={() => { sfx.whoosh(); set({ screen: 'play' }) }} />,
    play,
    roundEnd: <RoundEnd g={g} onNext={nextRound} onEpisodeEnd={() => set((s) => ({ screen: 'episodeEnd', gamesDone: s.gamesDone + 1 }))} />,
    episodeEnd: <EpisodeEnd g={g} onRandom={() => startEpisode()} onPick={(id) => startEpisode(id)} onFinish={() => { sfx.fanfare(); set({ screen: 'summary' }) }} />,
    summary: (
      <Summary
        g={g}
        onAgain={replay}
        onHome={() => setG(fresh())}
      />
    ),
  }

  return (
    <div className={'app game-' + (g.round?.game || 'none')}>
      {!['home', 'setup', 'quiz', 'profile'].includes(g.screen) && (
        <TopBar
          g={g}
          muted={muted}
          onMute={() => { setMuted(!muted); setM(!muted) }}
          onQuit={() => { sfx.tap(); setQuit(true) }}
        />
      )}
      {quit && (
        <QuitMenu
          g={g}
          scored={scoredThisGame && !['episodeEnd', 'summary'].includes(g.screen)}
          inGame={!['episodeEnd', 'summary'].includes(g.screen)}
          onSwitch={(keep) => leaveGame(keep, 'episodeEnd')}
          onEnd={(keep) => leaveGame(keep, 'summary')}
          onHome={() => { setQuit(false); setG(fresh()) }}
          onClose={() => setQuit(false)}
        />
      )}
      <main key={g.screen + (g.round?.step ?? '') + g.roundNo} className="screen">
        {screens[g.screen] || screens.home}
      </main>
    </div>
  )
}

/* ---------------- shared bits ---------------- */

function TopBar({ g, muted, onMute, onQuit }) {
  const ep = g.episode
  const [help, setHelp] = useState(false)
  return (
    <header className="topbar">
      {help && ep && (
        <div className="modal" onClick={() => setHelp(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <HowTo game={ep.game} />
            <button className="btn big" onClick={() => { sfx.tap(); setHelp(false) }}>Got it 👍</button>
          </div>
        </div>
      )}
      <span className="logo-sm">BLAST</span>
      <span className="muted tiny">{ep ? `Game ${Math.min(g.gamesDone + 1, MAX_GAMES)}/${MAX_GAMES} · ${GAMES[ep.game].emoji} ${Math.min(ep.done + 1, ep.total)}/${ep.total}` : ''}</span>
      <span>
        {ep && <button className="help-btn" onClick={() => { sfx.tap(); setHelp(true) }}>? Rules</button>}
        <button className="icon" onClick={onMute} aria-label="sound">{muted ? '🔇' : '🔊'}</button>
        <button className="link" onClick={onQuit}>Quit</button>
      </span>
    </header>
  )
}

function QuitMenu({ g, scored, inGame, onSwitch, onEnd, onHome, onClose }) {
  const [action, setAction] = useState(null) // 'switch' | 'end' waiting for the points question
  const go = (a) => {
    sfx.tap()
    if (scored) return setAction(a)
    a === 'switch' ? onSwitch(true) : onEnd(true)
  }
  const game = g.episode ? GAMES[g.episode.game] : null
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {action ? (
          <>
            <h2 className="shout center-text">Count these points?</h2>
            <p className="tag center-text">Points were scored in this round of {game?.title}. Keep them in the final tally?</p>
            <button className="btn big" onClick={() => (action === 'switch' ? onSwitch(true) : onEnd(true))}>✅ Yes, keep them</button>
            <button className="btn ghost" onClick={() => (action === 'switch' ? onSwitch(false) : onEnd(false))}>❌ No, scrap this game's points</button>
          </>
        ) : (
          <>
            <h2 className="shout center-text">Pause! ⏸️</h2>
            {inGame && <button className="btn big" onClick={() => go('switch')}>🔀 Switch to another game</button>}
            <button className="btn" onClick={() => go('end')}>👑 End & see the leaderboard</button>
            <button className="btn ghost" onClick={() => { sfx.tap(); onHome() }}>🏠 Quit to home (new group)</button>
            <button className="link" onClick={onClose}>Keep playing</button>
          </>
        )}
      </div>
    </div>
  )
}

// Infographic rules: 3 picture steps + how you score.
function HowTo({ game: id }) {
  const game = GAMES[id]
  return (
    <div className="howto">
      <div className="howto-head" style={{ background: game.color }}>
        <span>{game.emoji}</span>{game.title}
      </div>
      {game.steps.map((st, k) => (
        <div key={k} className="step" style={{ animationDelay: `${k * 0.15}s` }}>
          <span className="step-n" style={{ background: game.color }}>{k + 1}</span>
          <span className="step-icon">{st.icon}</span>
          <span className="step-text"><b>{st.big}</b><small>{st.small}</small></span>
        </div>
      ))}
      <div className="score-chip">🏆 {game.score}</div>
    </div>
  )
}

// Who's in the spotlight, and who's next. Scrolls sideways for big groups.
function TurnStrip({ g, current }) {
  const n = g.players.length
  if (g.teams) {
    const t = teamOf(g, current)
    return (
      <div className="strip">
        {g.teams.map((tm, k) => (
          <span key={k} className={'strip-name' + (k === t ? ' on' : '')}>{tm.emoji} {tm.name}</span>
        ))}
        <span className="strip-hint">Team turn: {g.teams[t].name} · teams take turns, members rotate</span>
      </div>
    )
  }
  return (
    <div className="strip">
      {g.players.map((p, i) => (
        <span key={i} className={'strip-name' + (i === current ? ' on' : '') + ((p.spots || 0) > 0 && i !== current ? ' done' : '')}>
          {i === current ? '⭐ ' : ''}{p.name}
        </span>
      ))}
      {n > 4 && <span className="strip-hint">⭐ = spotlight now · everyone gets a turn before repeats</span>}
    </div>
  )
}

function ranked(players) {
  return players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score)
}

function MiniBoard({ g }) {
  const list = ranked(units(g))
  const top = list[0]?.score ?? 0
  return (
    <div className="board">
      {list.map((p, k) => (
        <div key={p.i} className={'board-row' + (p.score === top && top > 0 ? ' lead' : '')}>
          <span className="rank">{p.score === top && top > 0 ? '👑' : k + 1}</span>
          <span className="bname">{p.members ? `${p.emoji} ${p.name}` : p.name}{p.members && <small className="members">{p.members.map((m) => g.players[m].name).join(', ')}</small>}</span>{p.arch && <span className="arch">{ARCHETYPES[p.arch]?.emoji}</span>}
          <span className="bscore">{p.score}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- screens ---------------- */

function Home({ g, onStart, onResume }) {
  const canResume = g.players.length >= 2 && g.round
  return (
    <div className="center stack">
      <div className="burst">💥</div>
      <h1 className="logo">BLAST</h1>
      <p className="tag">The pocket game show for 2 to 12 friends.<br />One phone. No sign-up. Pass it around.</p>
      <button className="btn big" onClick={onStart}>Start a BLAST</button>
      {canResume && <button className="btn ghost" onClick={onResume}>Resume last game</button>}
      <p className="tiny muted">Same app. Different people. Completely different chaos.</p>
    </div>
  )
}

function Setup({ onBack, onGo }) {
  const [names, setNames] = useState(['', ''])
  const [duration, setDuration] = useState(12)
  const [err, setErr] = useState('')
  const inputs = useRef([])

  const update = (i, v) => setNames((n) => n.map((x, k) => (k === i ? v : x)))
  const add = () => {
    if (names.length >= 12) return
    sfx.tap()
    setNames((n) => [...n, ''])
    setTimeout(() => inputs.current[names.length]?.focus(), 30)
  }
  const remove = (i) => setNames((n) => n.filter((_, k) => k !== i))
  const pick = (fn, v) => { sfx.tap(); fn(v) }

  const go = () => {
    const clean = names.map((n) => n.trim()).filter(Boolean)
    if (clean.length < 2) { sfx.buzzer(); return setErr('Add at least 2 players.') }
    const lower = clean.map((n) => n.toLowerCase())
    if (new Set(lower).size !== lower.length) { sfx.buzzer(); return setErr('Two players have the same name. Add an initial.') }
    onGo(clean.map((name) => ({ name, score: 0 })), duration)
  }

  return (
    <div className="stack">
      <button className="link back" onClick={onBack}>← Back</button>
      <h2>Who's playing?</h2>
      <div className="names">
        {names.map((n, i) => (
          <div className="name-row" key={i}>
            <input
              ref={(el) => (inputs.current[i] = el)}
              value={n}
              maxLength={14}
              placeholder={`Player ${i + 1}`}
              onChange={(e) => { update(i, e.target.value); setErr('') }}
              onKeyDown={(e) => e.key === 'Enter' && (i === names.length - 1 ? add() : inputs.current[i + 1]?.focus())}
              autoFocus={i === 0}
            />
            {names.length > 2 && <button className="x" onClick={() => remove(i)} aria-label="remove">✕</button>}
          </div>
        ))}
        {names.length < 12 && <button className="btn ghost small" onClick={add}>+ Add player</button>}
      </div>

      <h3>How long?</h3>
      <div className="chips row">
        {DURATIONS.map((x) => (
          <button key={x.id} className={'chip slim' + (duration === x.id ? ' on' : '')} onClick={() => pick(setDuration, x.id)}>{x.label}</button>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      <button className="btn big sticky" onClick={go}>Vibe check →</button>
    </div>
  )
}

/* ---------------- Opening vibe check ---------------- */
function Quiz({ g, onDone }) {
  const [step, setStep] = useState(0) // 0..2 group questions, then players
  const [ans, setAns] = useState({})
  const [archs, setArchs] = useState([])
  const [cover, setCover] = useState(true)
  const nG = GROUP_QS.length
  const n = g.players.length

  const answerGroup = (key, v) => {
    sfx.ding(); buzz(20)
    setAns((a) => ({ ...a, [key]: v }))
    setStep((s) => s + 1)
  }
  const answerPlayer = (a) => {
    sfx.ding(); buzz(20)
    const next = [...archs, a]
    setArchs(next)
    if (next.length >= n) onDone({ venue: ans.venue, intensity: ans.intensity, familiarity: ans.familiarity, archs: next })
    else setCover(true)
  }

  if (step < nG) {
    const q = GROUP_QS[step]
    return (
      <div key={step} className="stack pop">
        <p className="who">Vibe check · {step + 1}/{nG + 1} · answer together</p>
        <h2 className="shout">{q.q}</h2>
        <div className="options">
          {q.o.map((o) => (
            <button key={o.label} className="opt" onClick={() => answerGroup(q.key, o.v)}>
              <span className="opt-emoji">{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const i = archs.length
  const name = g.players[i].name
  if (cover) {
    return (
      <div key={'c' + i} className="center stack pop">
        <p className="who">Vibe check · {nG + 1}/{nG + 1} · one each</p>
        <h2>Pass the phone to</h2>
        <div className="holder">{name}</div>
        <button className="btn big" onClick={() => { sfx.whoosh(); setCover(false) }}>I'm {name}</button>
      </div>
    )
  }
  const keys = Object.keys(ARCHETYPES)
  return (
    <div key={'p' + i} className="stack pop">
      <p className="who">{name}, be honest</p>
      <h2 className="shout">{ARCH_Q}</h2>
      <div className="options">
        {keys.map((k) => (
          <button key={k} className="opt" onClick={() => answerPlayer(k)}>
            <span className="opt-emoji">{ARCHETYPES[k].emoji}</span>{ARCHETYPES[k].pick}
          </button>
        ))}
      </div>
      <button className="link" onClick={() => answerPlayer(keys[Math.floor(Math.random() * keys.length)])}>Surprise me 🎲</button>
    </div>
  )
}

function Profile({ g, onGo }) {
  const archs = g.players.map((p) => p.arch)
  const { top, games } = groupProfile(archs)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown > g.players.length) return
    const t = setTimeout(() => { setShown((s) => s + 1); shown < g.players.length ? sfx.pass() : sfx.fanfare() }, shown === 0 ? 400 : 650)
    return () => clearTimeout(t)
  }, [shown])
  return (
    <div className="stack">
      <p className="who center-text">Your squad is…</p>
      <h2 className="shout center-text">{g.players.length === 2 ? GROUP_NAMES[top].replace('The ', 'The Duo: ') : GROUP_NAMES[top]}</h2>
      <div className="arch-grid">
        {g.players.map((p, i) => {
          const a = ARCHETYPES[p.arch]
          return (
            <div key={i} className={'arch-card' + (i < shown ? ' in' : '')} style={{ transform: i < shown ? `rotate(${i % 2 ? 2 : -2}deg)` : undefined }}>
              <span className="arch-emoji">{a.emoji}</span>
              <b>{p.name}</b>
              <span className="arch-label">{a.label}</span>
              <small>{a.line}</small>
            </div>
          )
        })}
      </div>
      {shown > g.players.length && (
        <div className="land show">
          {g.teams && (
            <div className="teams">
              <p className="who center-text">{g.players.length} players = {g.teams.length} teams, mixed by personality</p>
              {g.teams.map((t, k) => (
                <div key={k} className="team-card" style={{ background: t.color }}>
                  <b>{t.emoji} {t.name}</b>
                  <span>{t.members.map((m) => g.players[m].name).join(' · ')}</span>
                </div>
              ))}
            </div>
          )}
          <p className="tag center-text">Tuned for you: more {games.map((x) => `${GAMES[x].emoji} ${GAMES[x].title}`).join(' and ')}. Vibe: {g.intensity}.</p>
          <button className="btn big" onClick={() => { sfx.whoosh(); onGo() }}>Spin the first game 🎰</button>
        </div>
      )}
    </div>
  )
}

// Slot-machine randomizer. The game is already chosen; the reel just lands on it (it never lies).
function Slot({ g, onDone }) {
  const ids = Object.keys(GAMES)
  const target = g.episode.game
  const H = 120
  const reel = []
  for (let k = 0; k < 18; k++) reel.push(ids[k % ids.length])
  reel.push(target)
  const [y, setY] = useState(0)
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    sfx.drumroll(2.2)
    const t1 = setTimeout(() => setY(-(reel.length - 1) * H), 50)
    let delay = 40, alive = true, elapsed = 0
    const tick = () => {
      if (!alive || elapsed > 2200) return
      sfx.slotTick(); elapsed += delay; delay *= 1.12
      setTimeout(tick, delay)
    }
    tick()
    const t2 = setTimeout(() => { setLanded(true); sfx.boom(); buzz(120) }, 2400)
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const game = GAMES[target]
  return (
    <div className="center stack">
      <p className="who">Next game is…</p>
      <div className={'slot' + (landed ? ' landed' : '')}>
        <div className="reel" style={{ transform: `translateY(${y}px)` }}>
          {reel.map((id, k) => (
            <div key={k} className="slot-card" style={{ background: GAMES[id].color }}>
              <span>{GAMES[id].emoji}</span>{GAMES[id].title}
            </div>
          ))}
        </div>
      </div>
      <div className={'land' + (landed ? ' show' : '')}>
        <h2 className="shout" style={{ color: game.color }}>{game.title}!</h2>
        <button className="btn big" onClick={onDone} disabled={!landed}>Show me the rules</button>
      </div>
    </div>
  )
}

function Rules({ g, onGo }) {
  const game = GAMES[g.episode.game]
  return (
    <div className="center stack">
      <p className="tag">{game.promise}</p>
      {game.tags && <p className="tags">{game.tags}</p>}
      <HowTo game={game.id} />
      <p className="muted tiny">{g.episode.total} rounds · tap "? Rules" any time during play</p>
      <button className="btn big" onClick={onGo}>Let's go 🔥</button>
    </div>
  )
}

/* ---------------- BLAST Bomb ---------------- */
function Bomb({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const n = g.players.length
  const holderName = g.players[r.holder].name
  const [now, setNow] = useState(Date.now())
  const holderRef = useRef(r.holder)
  holderRef.current = r.holder

  // Ticking that speeds up as the secret fuse burns down.
  useEffect(() => {
    if (r.step !== 'live') return
    let alive = true
    const total = r.endsAt - r.startedAt
    const loop = () => {
      if (!alive) return
      const t = Date.now()
      setNow(t)
      if (t >= r.endsAt) {
        sfx.boom(); buzz([200, 80, 400])
        setRound({ step: 'boom', loser: holderRef.current })
        return
      }
      const left = (r.endsAt - t) / total
      sfx.tick(left < 0.25)
      setTimeout(loop, 120 + 560 * left)
    }
    loop()
    return () => { alive = false }
  }, [r.step])

  if (r.step === 'ready') {
    return (
      <div className="center stack">
        <p className="who" style={{ color: GAMES.bomb.color }}>Round category</p>
        <h2 className="prompt">{r.prompt.q}</h2>
        <div className="bomb idle">💣</div>
        <p className="tag"><b>{holderName}</b> holds the bomb first.<br />Say one answer, tap PASS, hand it on. No repeats!</p>
        <button className="btn big" onClick={() => { const t = Date.now(); sfx.whoosh(); setRound({ step: 'live', startedAt: t, endsAt: t + fuseMs() }) }}>Light the fuse</button>
        <button className="link" onClick={() => { sfx.tap(); onSkip() }}>New category</button>
      </div>
    )
  }

  if (r.step === 'live') {
    const heat = r.endsAt ? 1 - Math.max(0, (r.endsAt - now) / (r.endsAt - r.startedAt)) : 0
    const pass = () => {
      sfx.pass(); buzz(25)
      setRound({ holder: (r.holder + 1) % n, passes: r.passes + 1 })
    }
    return (
      <div className="center stack bomb-live" style={{ '--heat': heat }}>
        <p className="who">{r.prompt.q}</p>
        <div className="bomb" style={{ animationDuration: `${0.9 - heat * 0.75}s` }}>💣</div>
        <div className="holder">{holderName}</div>
        <button className="pass-btn" onPointerDown={pass}>PASS ➜</button>
        <p className="muted tiny">{r.passes} passes · stuck? the group can shout "TIME!" and you must answer</p>
      </div>
    )
  }

  // boom
  const loser = g.players[r.loser].name
  const finish = () =>
    onScore(
      g.players.map((_, i) => ({ player: i, points: teamOf(g, i) === teamOf(g, r.loser) ? 0 : POINTS })),
      `💥 ${loser} was holding the bomb${g.teams ? ` (${g.teams[teamOf(g, r.loser)].name} scores 0)` : ''}`,
    )
  return (
    <div className="center stack boom">
      <div className="explosion">💥</div>
      <h2 className="shout">BLAST!</h2>
      <div className="holder">{loser}</div>
      <p className="tag">was holding it after {r.passes} passes.<br />Everyone else gets +{POINTS}.</p>
      <button className="btn big" onClick={finish}>Scores →</button>
    </div>
  )
}

/* ---------------- Defend the Indefensible ---------------- */
function Defend({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES.defend
  const name = g.players[r.holder].name
  const [left, setLeft] = useState(30)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (r.step !== 'live') return
    const start = Date.now()
    let twisted = false
    const id = setInterval(() => {
      const l = Math.max(0, 30 - Math.floor((Date.now() - start) / 1000))
      setLeft((old) => { if (old !== l && l <= 5 && l > 0) sfx.tick(true); return l })
      if (r.twist && !twisted && l <= 15) { twisted = true; setFlipped(true); sfx.twist(); buzz([100, 50, 100]) }
      if (l === 0) { clearInterval(id); sfx.buzzer(); buzz(300); setRound({ step: 'rate', flipped: r.twist }) }
    }, 200)
    return () => clearInterval(id)
  }, [r.step])

  if (r.step === 'ready') {
    return (
      <div className="center stack">
        <TurnStrip g={g} current={r.holder} />
        <div className="spotlight small">{name}</div>
        <p className="who" style={{ color: game.color }}>you must defend:</p>
        <h2 className="prompt quote">“{r.prompt.q}”</h2>
        <p className="tag">Read it out loud. You get 30 seconds. Be dramatic. Be a lawyer. Be shameless.</p>
        <button className="btn big" onClick={() => { sfx.whoosh(); setRound({ step: 'live' }) }}>Start my 30 seconds</button>
        <button className="link" onClick={() => { sfx.tap(); onSkip() }}>Give me a different one</button>
      </div>
    )
  }

  if (r.step === 'live') {
    return (
      <div className={'center stack' + (flipped ? ' twisted' : '')}>
        {flipped ? (
          <>
            <div className="twist-banner">🔄 PLOT TWIST!</div>
            <p className="tag"><b>{name}</b>, now argue the <b>OPPOSITE</b>!</p>
            <h2 className="prompt quote strike">“{r.prompt.q}”</h2>
          </>
        ) : (
          <>
            <p className="who" style={{ color: game.color }}>{name} is defending</p>
            <h2 className="prompt quote">“{r.prompt.q}”</h2>
          </>
        )}
        <div className={'timer' + (left <= 5 ? ' hot' : '')}>{left}</div>
        <button className="link" onClick={() => { sfx.buzzer(); setRound({ step: 'rate', flipped }) }}>Done early</button>
      </div>
    )
  }

  // rate
  const rate = (fire) => {
    if (fire >= 4) sfx.fanfare(); else sfx.ding()
    buzz(60)
    const verdict = ['', 'Objection sustained 😬', 'Weak case', 'Decent lawyer', 'Very convincing', 'Supreme Court material'][fire]
    onScore([{ player: r.holder, points: fire * POINTS }], `${'🔥'.repeat(fire)} ${name}: ${verdict} (+${fire * POINTS})`)
  }
  return (
    <div className="center stack">
      <h2 className="shout">Verdict!</h2>
      <p className="tag">Everyone except {name}: how convincing was that{r.flipped ? ', including the twist' : ''}?<br />Decide together, then tap.</p>
      <div className="fires">
        {[1, 2, 3, 4, 5].map((f) => (
          <button key={f} className="fire" onClick={() => rate(f)}>
            <span>{'🔥'.repeat(f)}</span><small>+{f * POINTS}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Accusation Station ---------------- */
function Accuse({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES.accuse
  const me = r.holder
  const name = g.players[me].name
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (r.step !== 'count') return
    let k = 3
    setCount(3); sfx.tick(false); buzz(40)
    const id = setInterval(() => {
      k -= 1
      if (k > 0) { setCount(k); sfx.tick(k === 1); buzz(40) }
      else { clearInterval(id); setCount('POINT!'); sfx.boom(); buzz([150, 60, 150]); setTimeout(() => setRound({ step: 'tally' }), 1100) }
    }, 800)
    return () => clearInterval(id)
  }, [r.step])

  if (r.step === 'ready') {
    return (
      <div className="center stack">
        <TurnStrip g={g} current={me} />
        <p className="who" style={{ color: game.color }}>Predictor this round</p>
        <div className="spotlight small">{name}</div>
        <h2 className="prompt quote">{r.prompt.q}</h2>
        <p className="tag"><b>{name}</b> takes the phone. Everyone else, look away 👀</p>
        <button className="btn big" onClick={() => { sfx.whoosh(); setRound({ step: 'predict' }) }}>I'm {name}</button>
        <button className="link" onClick={() => { sfx.tap(); onSkip() }}>Different question</button>
      </div>
    )
  }
  if (r.step === 'predict') {
    return (
      <div className="stack">
        <p className="who" style={{ color: game.color }}>{name}, secret prediction</p>
        <h2 className="prompt small">{r.prompt.q}</h2>
        <p className="tag">Who will the group point at? (Could be you!)</p>
        <div className="chips row wrap">
          {g.players.map((p, i) => (
            <button key={i} className={'chip slim' + (r.pick === i ? ' on' : '')} onClick={() => { sfx.tap(); setRound({ pick: i }) }}>{p.name}</button>
          ))}
        </div>
        <button className="btn big" disabled={r.pick === null} onClick={() => { sfx.ding(); setRound({ step: 'gather' }) }}>Lock it in 🔒</button>
      </div>
    )
  }
  if (r.step === 'gather') {
    return (
      <div className="center stack">
        <div className="burst">👉</div>
        <h2 className="shout">Phone in the middle!</h2>
        <h2 className="prompt quote">{r.prompt.q}</h2>
        <p className="tag">Everyone gets ready to point. On "POINT!", everyone points at once. No take-backs.</p>
        <button className="btn big" onClick={() => setRound({ step: 'count' })}>3… 2… 1…</button>
      </div>
    )
  }
  if (r.step === 'count') {
    return (
      <div className="center stack">
        <div key={count} className={'countdown' + (count === 'POINT!' ? ' go' : '')}>{count}</div>
      </div>
    )
  }
  // tally
  const toggle = (i) => {
    sfx.tap()
    setRound({ accused: r.accused.includes(i) ? r.accused.filter((x) => x !== i) : [...r.accused, i] })
  }
  const finish = () => {
    const hit = r.accused.includes(r.pick)
    if (hit) sfx.fanfare(); else sfx.buzzer()
    const crowned = r.accused.map((i) => g.players[i].name).join(' & ')
    onScore(
      [{ player: me, points: hit ? 2 * POINTS : 0 }],
      `👑 ${crowned} got accused! ${name} predicted ${g.players[r.pick].name}${hit ? ` (+${2 * POINTS})` : ' ✗'}`,
    )
  }
  return (
    <div className="stack">
      <h2 className="shout center-text">Who got the most votes?</h2>
      <p className="tag center-text">Look around: who did the most people point at? Tap them. Tie? Tap all of them.</p>
      <div className="chips row wrap">
        {g.players.map((p, i) => (
          <button key={i} className={'chip slim' + (r.accused.includes(i) ? ' on' : '')} onClick={() => toggle(i)}>{p.name}</button>
        ))}
      </div>
      <button className="btn big" disabled={r.accused.length === 0} onClick={finish}>Reveal {name}'s prediction</button>
    </div>
  )
}

/* ---------------- Where's the Line? ---------------- */
function Line({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES.line
  const me = r.holder
  const name = g.players[me].name
  const [val, setVal] = useState(null) // nothing picked until someone taps

  const Scale = () => (
    <NumberScale val={val} setVal={setVal} lo={r.prompt.lo} hi={r.prompt.hi} />
  )

  if (r.step === 'ready') {
    return (
      <div className="center stack">
        <TurnStrip g={g} current={me} />
        <p className="who" style={{ color: game.color }}>This round's mind reader</p>
        <div className="spotlight">{name}</div>
        <p className="tag"><b>{name}</b> takes the phone.<br />Everyone else, look away 👀</p>
        <button className="btn big" onClick={() => { sfx.whoosh(); setRound({ step: 'set' }) }}>I'm {name} 🙋</button>
        <button className="link" onClick={() => { sfx.tap(); onSkip() }}>Different situation</button>
      </div>
    )
  }
  if (r.step === 'set') {
    return (
      <div className="stack">
        <div className="name-banner" style={{ background: game.color }}>🤫 {name}'s SECRET pick</div>
        <h2 className="prompt quote">{r.prompt.q}</h2>
        <p className="tag center-text">How <b>{r.prompt.hi.toLowerCase()}</b> is this to you? Tap 1 to 10.</p>
        <Scale />
        <button className="btn big" disabled={val === null} onClick={() => { sfx.ding(); setRound({ secret: val, step: 'handoff' }) }}>{val === null ? 'Pick a number first' : `Lock ${val} 🔒`}</button>
      </div>
    )
  }
  if (r.step === 'handoff') {
    return (
      <div className="center stack">
        <div className="burst">🤐</div>
        <h2 className="shout">Locked!</h2>
        <p className="tag">Hand the phone to {g.teams ? <b>{g.teams[teamOf(g, me)].emoji} {g.teams[teamOf(g, me)].name}</b> : 'the group'}.</p>
        <div className="spotlight small">{name}</div>
        <p className="tag">no hints, no faces!</p>
        <button className="btn big" onClick={() => { sfx.whoosh(); setRound({ step: 'guess' }) }}>We have the phone</button>
      </div>
    )
  }
  if (r.step === 'guess') {
    const lock = () => {
      const d = Math.abs(val - r.secret)
      const pts = d === 0 ? 2 * POINTS : d === 1 ? POINTS : 0
      if (pts) sfx.fanfare(); else sfx.buzzer()
      onScore(
        g.players.map((_, i) => ({ player: i, points: teamOf(g, i) === teamOf(g, me) || !g.teams ? pts : 0 })),
        `📏 ${name} said ${r.secret}, group guessed ${val}. ${d === 0 ? `Bullseye! +${pts} ${g.teams ? g.teams[teamOf(g, me)].name : 'everyone'}` : d === 1 ? `So close! +${pts} ${g.teams ? g.teams[teamOf(g, me)].name : 'everyone'}` : 'Way off. Do you even know them?'}`,
      )
    }
    return (
      <div className="stack">
        <div className="name-banner" style={{ background: game.color }}>🧠 {g.teams ? `${g.teams[teamOf(g, me)].name}: ` : ''}Where did {name} put it?</div>
        <h2 className="prompt quote">{r.prompt.q}</h2>
        <p className="tag center-text">How <b>{r.prompt.hi.toLowerCase()}</b> did {name} rate it? Argue, then tap ONE number.</p>
        <Scale />
        <button className="btn big" disabled={val === null} onClick={lock}>{val === null ? 'Pick the group guess' : `Lock group guess: ${val}`}</button>
      </div>
    )
  }
  return null
}

// 1-10 on ONE line: a thermometer from the mild end to the wild end. Tap a number.
const SCALE_EMOJI = ['😇', '🙂', '😌', '🤔', '😐', '🤨', '😬', '😳', '🤯', '😱']
function NumberScale({ val, setVal, lo, hi }) {
  return (
    <div className="nscale">
      <div className="nscale-ends">
        <span className="lo">😇 {lo}</span>
        <span className="hi">{hi} 😱</span>
      </div>
      <div className="nscale-row">
        {SCALE_EMOJI.map((e, k) => {
          const n = k + 1
          return (
            <button
              key={n}
              className={'ncell' + (val === n ? ' on' : '')}
              style={{ background: `hsl(${140 - k * 15}, 90%, 55%)` }}
              onClick={() => { sfx.slotTick(); sfx.tap(); buzz(15); setVal(n) }}
            >
              {val === n && <span className="ncell-emoji">{e}</span>}
              {n}
            </button>
          )
        })}
      </div>
      <div className="nscale-arrow"><span>milder</span><span>wilder</span></div>
    </div>
  )
}

/* ---------------- Going Once, Going Twice ---------------- */
function Auction({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES.auction
  const [left, setLeft] = useState(30)
  const opener = g.players[r.holder].name

  useEffect(() => {
    if (r.step !== 'timer') return
    const start = Date.now()
    const id = setInterval(() => {
      const l = Math.max(0, 30 - Math.floor((Date.now() - start) / 1000))
      setLeft((old) => { if (old !== l) sfx.tick(l <= 5); return l })
      if (l === 0) { clearInterval(id); sfx.buzzer(); buzz(300); setRound({ step: 'confirm' }) }
    }, 200)
    return () => clearInterval(id)
  }, [r.step])

  if (r.step === 'ready') {
    return (
      <div className="stack">
        <p className="who" style={{ color: game.color }}>Lot on the table</p>
        <h2 className="prompt quote">{r.prompt.q}</h2>
        <p className="tag">How many can you name in 30 seconds? <b>{opener}</b> opens the bidding. Go round, out loud, each bid higher. Someone says "Going once, going twice… SOLD!"{g.venue === 'quiet' ? ' (Inside voices 🤫)' : ''}</p>
        <h3>Sold to…</h3>
        <div className="chips row wrap">
          {g.players.map((p, i) => (
            <button key={i} className={'chip slim' + (r.bidder === i ? ' on' : '')} onClick={() => { sfx.tap(); setRound({ bidder: i }) }}>{p.name}</button>
          ))}
        </div>
        <h3>…for</h3>
        <div className="stepper">
          <button onClick={() => { sfx.tap(); setRound({ bid: Math.max(1, r.bid - 1) }) }}>−</button>
          <span>{r.bid}</span>
          <button onClick={() => { sfx.tap(); setRound({ bid: Math.min(40, r.bid + 1) }) }}>+</button>
        </div>
        <button className="btn big" disabled={r.bidder === null} onClick={() => { sfx.boom(); setRound({ step: 'timer', count: 0 }) }}>🔨 SOLD! Start 30s</button>
        <button className="link" onClick={() => { sfx.tap(); onSkip() }}>Different category</button>
      </div>
    )
  }

  const bidderName = g.players[r.bidder].name
  if (r.step === 'timer') {
    return (
      <div className="center stack">
        <p className="who" style={{ color: game.color }}>{bidderName} needs {r.bid}</p>
        <h2 className="prompt small">{r.prompt.q}</h2>
        <div className={'timer' + (left <= 5 ? ' hot' : '')}>{left}</div>
        <button className="counter" onClick={() => { sfx.pass(); buzz(15); setRound({ count: r.count + 1 }) }}>
          <span>{r.count}</span>
          <small>Group: tap for each valid answer</small>
        </button>
        <button className="link" onClick={() => setRound({ step: 'confirm' })}>Stop early</button>
      </div>
    )
  }
  const hit = r.count >= r.bid
  const finish = (ok) => {
    if (ok) sfx.fanfare(); else sfx.buzzer()
    onScore(
      g.players.map((_, i) => ({ player: i, points: ok ? (i === r.bidder ? 3 * POINTS : 0) : (teamOf(g, i) === teamOf(g, r.bidder) ? 0 : POINTS) })),
      ok ? `🔨 ${bidderName} delivered ${r.bid}! +${3 * POINTS}` : `💸 ${bidderName} overbid! Everyone else +${POINTS}`,
    )
  }
  return (
    <div className="center stack">
      <h2 className="shout">Time!</h2>
      <p className="tag">{bidderName} bid <b>{r.bid}</b>. Counter says <b>{r.count}</b>.</p>
      <p className="muted">Group has the final word.</p>
      <button className={'btn big' + (hit ? '' : ' ghost')} onClick={() => finish(true)}>✅ Delivered! +{3 * POINTS}</button>
      <button className={'btn' + (hit ? ' ghost' : ' big')} onClick={() => finish(false)}>❌ Fell short</button>
    </div>
  )
}

/* ---------------- between rounds / games ---------------- */

function RoundEnd({ g, onNext, onEpisodeEnd }) {
  const ep = g.episode
  const last = ep.done >= ep.total
  return (
    <div className="stack">
      <p className="who center-text">Round {ep.done} of {ep.total}</p>
      <h2 className="center-text">{g.round.headline}</h2>
      <MiniBoard g={g} />
      {last ? (
        <button className="btn big" onClick={() => { sfx.fanfare(); onEpisodeEnd() }}>Game done 🏁</button>
      ) : (
        <button className="btn big" onClick={onNext}>Next round →</button>
      )}
    </div>
  )
}

function EpisodeEnd({ g, onRandom, onPick, onFinish }) {
  const elapsed = g.startedAt ? (Date.now() - g.startedAt) / 60000 : 0
  const timeUp = g.duration > 0 && elapsed >= g.duration
  const others = Object.values(GAMES).filter((x) => x.id !== g.episode.game)
  const over = g.gamesDone >= MAX_GAMES
  if (over) {
    return (
      <div className="center stack">
        <h2 className="shout">That's all 5 games! 🏁</h2>
        <MiniBoard g={g} />
        <button className="btn big" onClick={onFinish}>Crown the winner 👑</button>
      </div>
    )
  }
  return (
    <div className="stack">
      <h2 className="center-text shout">{GAMES[g.episode.game].emoji} Game {g.gamesDone} of {MAX_GAMES} done!</h2>
      <MiniBoard g={g} />
      {timeUp && <p className="center-text tag">⏰ You hit your {g.duration}-minute target!</p>}
      <button className="btn big" onClick={onRandom}>Next game 🎰</button>
      <h3>…or pick the next game</h3>
      <div className="chips row wrap">
        {others.map((x) => (
          <button key={x.id} className="chip slim" onClick={() => { sfx.tap(); onPick(x.id) }}>
            <span className="chip-emoji">{x.emoji}</span>{x.title}
          </button>
        ))}
      </div>
      <button className={'btn ' + (timeUp ? '' : 'ghost')} onClick={onFinish}>Finish & crown the winner 👑</button>
    </div>
  )
}

function ShareBox({ g }) {
  const [img, setImg] = useState(null)
  const [busy, setBusy] = useState(false)
  const archs = g.players.map((p) => p.arch).filter(Boolean)
  const squad = archs.length ? GROUP_NAMES[groupProfile(archs).top] : 'The Squad'
  const go = async () => {
    sfx.tap(); setBusy(true)
    try {
      const r = await shareCard({ players: units(g), squad })
      if (typeof r === 'string' && r.startsWith('data:')) setImg(r)
    } catch {}
    setBusy(false)
  }
  return (
    <div className="sharebox">
      <button className="btn insta" onClick={go} disabled={busy}>📸 {busy ? 'Making your card…' : 'Share to Instagram story'}</button>
      {img && (
        <>
          <img className="card-preview" src={img} alt="BLAST leaderboard card" />
          <p className="muted tiny center-text">Saved to downloads. Or long-press the card to save it.</p>
        </>
      )}
    </div>
  )
}

function Summary({ g, onAgain, onHome }) {
  const list = ranked(units(g))
  const top = list[0]?.score ?? 0
  const winners = list.filter((p) => p.score === top)
  const rounds = g.history.length
  return (
    <div className="center stack">
      <div className="confetti" aria-hidden>{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.15}s`, background: ['#ff2e63', '#00e0ff', '#ffb800', '#9dff3b', '#b14dff'][i % 5] }} />)}</div>
      <div className="burst">🏆</div>
      <h2 className="shout">{top === 0 ? 'Everybody tied at zero 😅' : winners.length > 1 ? 'Joint winners!' : 'Winner!'}</h2>
      {top > 0 && <div className="holder">{winners.map((w) => w.name).join(' & ')}</div>}
      <p className="tag">{top} points · {rounds} round{rounds === 1 ? '' : 's'} of chaos</p>
      <MiniBoard g={g} />
      <ShareBox g={g} />
      <button className="btn big" onClick={onAgain}>Play again, same squad</button>
      <button className="btn ghost" onClick={onHome}>New group</button>
    </div>
  )
}
